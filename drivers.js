const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/drivers
router.get('/', async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    let query = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (status)   { params.push(status);   query += ` AND status = $${params.length}`; }
    if (category) { params.push(category); query += ` AND license_category = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (full_name ILIKE $${params.length} OR license_number ILIKE $${params.length})`;
    }

    query += ' ORDER BY full_name ASC';
    const result = await pool.query(query, params);

    // Add computed fields
    const rows = result.rows.map(d => ({
      ...d,
      license_expired: new Date(d.license_expiry) < new Date(),
      license_expiring_soon: (() => {
        const diff = (new Date(d.license_expiry) - new Date()) / 86400000;
        return diff > 0 && diff < 60;
      })(),
    }));

    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/drivers/available — for trip dispatcher
router.get('/available', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM drivers
       WHERE status = 'On Duty' AND license_expiry > CURRENT_DATE
       ORDER BY full_name`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/drivers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/drivers
router.post(
  '/',
  authorize('Fleet Manager', 'Safety Officer'),
  [
    body('full_name').notEmpty().trim(),
    body('license_number').notEmpty().trim().toUpperCase(),
    body('license_expiry').isDate(),
    body('license_category').isIn(['Truck', 'Van', 'Bike', 'All']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { full_name, license_number, license_expiry, license_category, phone } = req.body;

      // Block if already expired
      if (new Date(license_expiry) < new Date()) {
        return res.status(400).json({ error: 'Cannot add driver with expired license' });
      }

      const result = await pool.query(
        `INSERT INTO drivers (full_name, license_number, license_expiry, license_category, phone)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [full_name, license_number, license_expiry, license_category, phone]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

// PUT /api/drivers/:id
router.put('/:id', authorize('Fleet Manager', 'Safety Officer'), async (req, res, next) => {
  try {
    const { full_name, license_number, license_expiry, license_category, phone, safety_score } = req.body;
    const result = await pool.query(
      `UPDATE drivers SET full_name=$1, license_number=$2, license_expiry=$3,
        license_category=$4, phone=$5, safety_score=$6
       WHERE id=$7 RETURNING *`,
      [full_name, license_number, license_expiry, license_category, phone, safety_score, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/drivers/:id/status
router.patch('/:id/status', authorize('Fleet Manager', 'Safety Officer'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['On Duty', 'Off Duty', 'Suspended'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      'UPDATE drivers SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/drivers/:id
router.delete('/:id', authorize('Fleet Manager'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM drivers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Driver deleted', id: result.rows[0].id });
  } catch (err) { next(err); }
});

module.exports = router;
