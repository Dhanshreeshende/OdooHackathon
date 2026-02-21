const express = require('express');
const { body, param, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/vehicles
router.get('/', async (req, res, next) => {
  try {
    const { type, status, region, search } = req.query;
    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (type)   { params.push(type);   query += ` AND vehicle_type = $${params.length}`; }
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (region) { params.push(region); query += ` AND region = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR license_plate ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/vehicles
router.post(
  '/',
  authorize('Fleet Manager'),
  [
    body('name').notEmpty().trim(),
    body('license_plate').notEmpty().trim().toUpperCase(),
    body('vehicle_type').isIn(['Truck', 'Van', 'Bike']),
    body('region').isIn(['North', 'South', 'East', 'West']),
    body('max_load_capacity_kg').isInt({ min: 1 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, model, license_plate, vehicle_type, region, max_load_capacity_kg, odometer_km, acquisition_cost } = req.body;
      const result = await pool.query(
        `INSERT INTO vehicles (name, model, license_plate, vehicle_type, region, max_load_capacity_kg, odometer_km, acquisition_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, model, license_plate, vehicle_type, region, max_load_capacity_kg, odometer_km || 0, acquisition_cost || 0]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// PUT /api/vehicles/:id
router.put('/:id', authorize('Fleet Manager'), async (req, res, next) => {
  try {
    const { name, model, license_plate, vehicle_type, region, max_load_capacity_kg, odometer_km, acquisition_cost, status } = req.body;
    const result = await pool.query(
      `UPDATE vehicles SET
        name=$1, model=$2, license_plate=$3, vehicle_type=$4, region=$5,
        max_load_capacity_kg=$6, odometer_km=$7, acquisition_cost=$8, status=$9
       WHERE id=$10 RETURNING *`,
      [name, model, license_plate, vehicle_type, region, max_load_capacity_kg, odometer_km, acquisition_cost, status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/vehicles/:id/status
router.patch('/:id/status', authorize('Fleet Manager', 'Dispatcher'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['Available', 'On Trip', 'In Shop', 'Retired'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      'UPDATE vehicles SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/vehicles/:id
router.delete('/:id', authorize('Fleet Manager'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted', id: result.rows[0].id });
  } catch (err) { next(err); }
});

module.exports = router;
