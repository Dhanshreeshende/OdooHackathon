
require('dotenv').config();

const express = require('express');
const logger = require('./middlewares/logger.middleware');

const userRoutes = require('./routes/user.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

app.use(express.json());


app.use(logger);

// Register API Routes
app.use('/users', userRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/trips', tripRoutes);
app.use('/analytics', analyticsRoutes);


app.use((req, res) => {
    res.status(404).send("This Request Is Not Found");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Fleet Management System running on http://localhost:${PORT}`);
});