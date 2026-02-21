const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/analytics/dashboard — KPI summary
router.get('/dashboard', async (req, res, next) => {
  try {
    const [vehicles, trips, drivers, expenses] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'On Trip')   AS active,
          COUNT(*) FILTER (WHERE status = 'In Shop')   AS in_shop,
          COUNT(*) FILTER (WHERE status = 'Available') AS available,
          COUNT(*) FILTER (WHERE status = 'Retired')   AS retired
        FROM vehicles
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'Draft')      AS pending,
          COUNT(*) FILTER (WHERE status = 'Dispatched') AS dispatched,
          COUNT(*) FILTER (WHERE status = 'On Trip')    AS on_trip,
          COUNT(*) FILTER (WHERE status = 'Completed')  AS completed
        FROM trips
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'On Duty')   AS on_duty,
          COUNT(*) FILTER (WHERE status = 'Suspended') AS suspended,
          COUNT(*) FILTER (WHERE license_expiry < CURRENT_DATE) AS expired_licenses
        FROM drivers
      `),
      pool.query('SELECT COALESCE(SUM(cost), 0) AS total_ops_cost FROM expenses'),
    ]);

    const v = vehicles.rows[0];
    const utilization = v.total > 0
      ? Math.round((parseInt(v.active) / parseInt(v.total)) * 100)
      : 0;

    res.json({
      fleet: { ...v, utilization_pct: utilization },
      trips: trips.rows[0],
      drivers: drivers.rows[0],
      financials: expenses.rows[0],
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/roi — Vehicle ROI analysis
router.get('/roi', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        v.id, v.name, v.license_plate, v.vehicle_type, v.acquisition_cost,
        COUNT(DISTINCT t.id) AS trip_count,
        COALESCE(SUM(DISTINCT e.cost), 0) AS total_ops_cost,
        COALESCE(SUM(CASE WHEN e.expense_type = 'Fuel' THEN e.liters ELSE 0 END), 0) AS total_liters,
        v.odometer_km,
        CASE
          WHEN v.acquisition_cost > 0
          THEN ROUND(((COALESCE(SUM(t.distance_km), 0) * 10 - COALESCE(SUM(e.cost), 0)) / v.acquisition_cost) * 100, 2)
          ELSE 0
        END AS roi_pct,
        CASE
          WHEN COALESCE(SUM(CASE WHEN e.expense_type = 'Fuel' THEN e.liters ELSE 0 END), 0) > 0
          THEN ROUND(COALESCE(SUM(t.distance_km), 0)::NUMERIC / SUM(CASE WHEN e.expense_type = 'Fuel' THEN e.liters ELSE 0 END), 2)
          ELSE 0
        END AS fuel_efficiency_km_per_l
      FROM vehicles v
      LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'Completed'
      LEFT JOIN expenses e ON v.id = e.vehicle_id
      GROUP BY v.id, v.name, v.license_plate, v.vehicle_type, v.acquisition_cost, v.odometer_km
      ORDER BY roi_pct DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/analytics/fuel — Monthly fuel spend
router.get('/fuel', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(expense_date, 'Mon YYYY') AS month,
        DATE_TRUNC('month', expense_date) AS month_start,
        ROUND(SUM(cost), 2) AS total_cost,
        ROUND(SUM(liters), 2) AS total_liters
      FROM expenses
      WHERE expense_type = 'Fuel'
        AND expense_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month, month_start
      ORDER BY month_start ASC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/analytics/utilization
router.get('/utilization', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        vehicle_type,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'On Trip') AS on_trip,
        ROUND(COUNT(*) FILTER (WHERE status = 'On Trip')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1) AS utilization_pct
      FROM vehicles
      WHERE status != 'Retired'
      GROUP BY vehicle_type
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
