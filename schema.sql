-- ============================
-- FLEETFLOW DATABASE SCHEMA
-- ============================

CREATE DATABASE fleetflow;
\c fleetflow;

-- ============================
-- 1. USERS (RBAC)
-- ============================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) CHECK (role IN ('manager','dispatcher','safety','finance')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 2. VEHICLES
-- ============================

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    max_capacity NUMERIC(10,2) NOT NULL,
    odometer NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(30) CHECK (status IN ('available','on_trip','in_shop','retired')) DEFAULT 'available',
    acquisition_cost NUMERIC(12,2),
    region VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 3. DRIVERS
-- ============================

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_category VARCHAR(50),
    license_expiry_date DATE NOT NULL,
    status VARCHAR(30) CHECK (status IN ('on_duty','off_duty','suspended')) DEFAULT 'on_duty',
    safety_score NUMERIC(5,2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 4. TRIPS
-- ============================

CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    cargo_weight NUMERIC(10,2) NOT NULL,
    origin VARCHAR(100),
    destination VARCHAR(100),
    status VARCHAR(30) CHECK (status IN ('draft','dispatched','completed','cancelled')) DEFAULT 'draft',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    final_odometer NUMERIC(10,2),
    revenue NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 5. MAINTENANCE LOGS
-- ============================

CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT,
    cost NUMERIC(12,2),
    service_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 6. FUEL LOGS
-- ============================

CREATE TABLE fuel_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    liters NUMERIC(10,2) NOT NULL,
    cost NUMERIC(12,2) NOT NULL,
    fuel_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- INDEXES (Performance Boost)
-- ============================

CREATE INDEX idx_vehicle_status ON vehicles(status);
CREATE INDEX idx_trip_status ON trips(status);
CREATE INDEX idx_driver_status ON drivers(status);

-- ============================
-- SAMPLE DATA (Optional)
-- ============================

INSERT INTO vehicles (name, license_plate, vehicle_type, max_capacity, acquisition_cost, region)
VALUES ('Van-05', 'MH12AB1234', 'van', 500, 800000, 'Nagpur');

INSERT INTO drivers (name, license_number, license_category, license_expiry_date)
VALUES ('Alex', 'DL12345', 'van', '2027-12-31');
