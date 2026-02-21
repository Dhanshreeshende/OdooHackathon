const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/trips
router.get('/', async (req, res, next) => {
  try {
    const { status, vehicle_id, driver_id } = req.query;
    let query = `
      SELECT t.*,
             v.name AS vehicle_name, v.license_plate, v.max_load_capacity_kg,
             d.full_name AS driver_name, d.license_expiry
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (status)     { params.push(status);     query += ` AND t.status = $${params.length}`; }
    if (vehicle_id) { params.push(vehicle_id); query += ` AND t.vehicle_id = $${params.length}`; }
    if (driver_id)  { params.push(driver_id);  query += ` AND t.driver_id = $${params.length}`; }

    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/trips/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, v.name AS vehicle_name, v.license_plate, v.max_load_capacity_kg,
              d.full_name AS driver_name, d.license_expiry
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Trip not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/trips
router.post(
  '/',
  authorize('Fleet Manager', 'Dispatcher'),
  [
    body('vehicle_id').isUUID(),
    body('driver_id').isUUID(),
    body('origin').notEmpty().trim(),
    body('destination').notEmpty().trim(),
    body('cargo_weight_kg').isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { vehicle_id, driver_id, origin, destination, cargo_weight_kg, distance_km, notes } = req.body;

      // ── VALIDATION RULE: cargo weight ──
      const vRow = await client.query('SELECT * FROM vehicles WHERE id = $1 FOR UPDATE', [vehicle_id]);
      const vehicle = vRow.rows[0];
      if (!vehicle) return res.status(400).json({ error: 'Vehicle not found' });
      if (vehicle.status !== 'Available') return res.status(400).json({ error: `Vehicle is not Available (current: ${vehicle.status})` });
      if (cargo_weight_kg > vehicle.max_load_capacity_kg) {
        return res.status(400).json({
          error: `Cargo weight (${cargo_weight_kg}kg) exceeds vehicle max capacity (${vehicle.max_load_capacity_kg}kg)`,
        });
      }

      // ── VALIDATION RULE: driver license ──
      const dRow = await client.query('SELECT * FROM drivers WHERE id = $1 FOR UPDATE', [driver_id]);
      const driver = dRow.rows[0];
      if (!driver) return res.status(400).json({ error: 'Driver not found' });
      if (driver.status === 'Suspended') return res.status(400).json({ error: 'Driver is suspended' });
      if (new Date(driver.license_expiry) < new Date()) return res.status(400).json({ error: 'Driver license is expired' });

      // ── CREATE TRIP ──
      const tripResult = await client.query(
        `INSERT INTO trips (vehicle_id, driver_id, origin, destination, cargo_weight_kg, distance_km, status, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'Dispatched', $7, $8) RETURNING *`,
        [vehicle_id, driver_id, origin, destination, cargo_weight_kg, distance_km || 0, notes, req.user.id]
      );

      // ── STATUS UPDATES ──
      await client.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [vehicle_id]);
      await client.query("UPDATE drivers  SET status = 'On Duty'  WHERE id = $1", [driver_id]);

      await client.query('COMMIT');
      res.status(201).json(tripResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// PATCH /api/trips/:id/status
router.patch('/:id/status', authorize('Fleet Manager', 'Dispatcher'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { status, odometer_reading } = req.body;
    const valid = ['Draft', 'Dispatched', 'On Trip', 'Completed', 'Cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const tripRow = await client.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    const trip = tripRow.rows[0];
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Update trip
    await client.query(
      `UPDATE trips SET status = $1 ${status === 'Completed' ? ', completed_at = NOW()' : ''} WHERE id = $2`,
      [status, trip.id]
    );

    // Cascade status changes
    if (status === 'Completed' || status === 'Cancelled') {
      await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id]);
      await client.query("UPDATE drivers  SET status = 'Off Duty' WHERE id = $1", [trip.driver_id]);

      if (status === 'Completed' && odometer_reading && trip.vehicle_id) {
        await client.query('UPDATE vehicles SET odometer_km = $1 WHERE id = $2', [odometer_reading, trip.vehicle_id]);
      }
      if (status === 'Completed') {
        await client.query('UPDATE drivers SET trips_completed = trips_completed + 1 WHERE id = $1', [trip.driver_id]);
      }
    }

    await client.query('COMMIT');
    const updated = await pool.query('SELECT * FROM trips WHERE id = $1', [trip.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/trips/:id  (only draft trips)
router.delete('/:id', authorize('Fleet Manager'), async (req, res, next) => {
  try {
    const check = await pool.query("SELECT status FROM trips WHERE id = $1", [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Trip not found' });
    if (check.rows[0].status !== 'Draft') return res.status(400).json({ error: 'Only Draft trips can be deleted' });

    await pool.query('DELETE FROM trips WHERE id = $1', [req.params.id]);
    res.json({ message: 'Trip deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
