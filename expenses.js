const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const { vehicle_id, trip_id, expense_type } = req.query;
    let query = `
      SELECT e.*,
             v.name AS vehicle_name, v.license_plate,
             t.trip_code
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN trips t ON e.trip_id = t.id
      WHERE 1=1
    `;
    const params = [];
    if (vehicle_id)    { params.push(vehicle_id);    query += ` AND e.vehicle_id = $${params.length}`; }
    if (trip_id)       { params.push(trip_id);       query += ` AND e.trip_id = $${params.length}`; }
    if (expense_type)  { params.push(expense_type);  query += ` AND e.expense_type = $${params.length}`; }
    query += ' ORDER BY e.expense_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/expenses/summary — total ops cost per vehicle
router.get('/summary', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id, v.name, v.license_plate,
        COALESCE(SUM(e.cost), 0) AS total_ops_cost,
        COALESCE(SUM(CASE WHEN e.expense_type = 'Fuel' THEN e.cost ELSE 0 END), 0) AS total_fuel_cost,
        COALESCE(SUM(CASE WHEN e.expense_type = 'Fuel' THEN e.liters ELSE 0 END), 0) AS total_liters
      FROM vehicles v
      LEFT JOIN expenses e ON v.id = e.vehicle_id
      GROUP BY v.id, v.name, v.license_plate
      ORDER BY total_ops_cost DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/expenses
router.post(
  '/',
  authorize('Fleet Manager', 'Dispatcher', 'Financial Analyst'),
  [
    body('vehicle_id').isUUID(),
    body('expense_type').isIn(['Fuel', 'Toll', 'Driver Allowance', 'Other']),
    body('cost').isFloat({ min: 0.01 }),
    body('expense_date').isDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { vehicle_id, trip_id, expense_type, liters, cost, expense_date, notes } = req.body;
      const result = await pool.query(
        `INSERT INTO expenses (vehicle_id, trip_id, expense_type, liters, cost, expense_date, notes, logged_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [vehicle_id, trip_id || null, expense_type, liters || 0, cost, expense_date, notes, req.user.id]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// DELETE /api/expenses/:id
router.delete('/:id', authorize('Fleet Manager', 'Financial Analyst'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
