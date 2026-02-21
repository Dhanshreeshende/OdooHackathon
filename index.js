require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes        = require('./routes/auth');
const vehicleRoutes     = require('./routes/vehicles');
const driverRoutes      = require('./routes/drivers');
const tripRoutes        = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const expenseRoutes     = require('./routes/expenses');
const analyticsRoutes   = require('./routes/analytics');
const { errorHandler }  = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'FleetFlow API' });
});

// ─── ROUTES ───────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/vehicles',    vehicleRoutes);
app.use('/api/drivers',     driverRoutes);
app.use('/api/trips',       tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses',    expenseRoutes);
app.use('/api/analytics',   analyticsRoutes);

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── ERROR HANDLER ────────────────────────────────────────
app.use(errorHandler);

// ─── START ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚛 FleetFlow API running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
