const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/maintenance
router.get('/', async (req, res, next) => {
  try {
    const { vehicle_id, status } = req.query;
    let query = `
      SELECT m.*, v.name AS vehicle_name, v.license_plate
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    if (vehicle_id) { params.push(vehicle_id); query += ` AND m.vehicle_id = $${params.length}`; }
    if (status)     { params.push(status);     query += ` AND m.status = $${params.length}`; }
    query += ' ORDER BY m.service_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/maintenance  — auto sets vehicle status to "In Shop"
router.post(
  '/',
  authorize('Fleet Manager', 'Safety Officer'),
  [
    body('vehicle_id').isUUID(),
    body('service_type').notEmpty().trim(),
    body('cost').isFloat({ min: 0 }),
    body('mechanic_name').notEmpty().trim(),
    body('service_date').isDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { vehicle_id, service_type, cost, mechanic_name, service_date, notes } = req.body;

      const log = await client.query(
        `INSERT INTO maintenance_logs (vehicle_id, service_type, cost, mechanic_name, service_date, notes, logged_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [vehicle_id, service_type, cost, mechanic_name, service_date, notes, req.user.id]
      );

      // Auto-logic: vehicle → In Shop
      await client.query("UPDATE vehicles SET status = 'In Shop' WHERE id = $1", [vehicle_id]);

      await client.query('COMMIT');
      res.status(201).json(log.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// PATCH /api/maintenance/:id/complete
router.patch('/:id/complete', authorize('Fleet Manager', 'Safety Officer'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const logRow = await client.query('SELECT * FROM maintenance_logs WHERE id = $1', [req.params.id]);
    const log = logRow.rows[0];
    if (!log) return res.status(404).json({ error: 'Log not found' });

    await client.query("UPDATE maintenance_logs SET status = 'Completed' WHERE id = $1", [log.id]);
    // Auto: vehicle → Available
    await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [log.vehicle_id]);

    await client.query('COMMIT');
    const updated = await pool.query('SELECT * FROM maintenance_logs WHERE id = $1', [log.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', authorize('Fleet Manager'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_logs WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Log not found' });
    res.json({ message: 'Log deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
