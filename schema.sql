-- FleetFlow Database Schema
-- PostgreSQL 15+

-- ─── EXTENSIONS ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── VEHICLES ─────────────────────────────────────────────
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  license_plate VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('Truck', 'Van', 'Bike')),
  region VARCHAR(50) NOT NULL CHECK (region IN ('North', 'South', 'East', 'West')),
  max_load_capacity_kg INTEGER NOT NULL,
  odometer_km INTEGER DEFAULT 0,
  acquisition_cost NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── DRIVERS ──────────────────────────────────────────────
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  license_category VARCHAR(20) NOT NULL CHECK (license_category IN ('Truck', 'Van', 'Bike', 'All')),
  phone VARCHAR(30),
  trips_completed INTEGER DEFAULT 0,
  safety_score INTEGER DEFAULT 80 CHECK (safety_score BETWEEN 0 AND 100),
  status VARCHAR(20) NOT NULL DEFAULT 'Off Duty'
    CHECK (status IN ('On Duty', 'Off Duty', 'Suspended')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── TRIPS ────────────────────────────────────────────────
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_code VARCHAR(20) UNIQUE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  cargo_weight_kg INTEGER NOT NULL,
  distance_km INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Dispatched', 'On Trip', 'Completed', 'Cancelled')),
  trip_date DATE DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ─── MAINTENANCE LOGS ─────────────────────────────────────
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL,
  cost NUMERIC(10, 2) NOT NULL,
  mechanic_name VARCHAR(255) NOT NULL,
  service_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'In Progress'
    CHECK (status IN ('In Progress', 'Completed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  logged_by UUID REFERENCES users(id)
);

-- ─── EXPENSES ─────────────────────────────────────────────
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  expense_type VARCHAR(50) NOT NULL CHECK (expense_type IN ('Fuel', 'Toll', 'Driver Allowance', 'Other')),
  liters NUMERIC(8, 2) DEFAULT 0,
  cost NUMERIC(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  logged_by UUID REFERENCES users(id)
);

-- ─── INDEXES ──────────────────────────────────────────────
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_expiry ON drivers(license_expiry);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_maintenance_updated BEFORE UPDATE ON maintenance_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── TRIP CODE SEQUENCE ───────────────────────────────────
CREATE SEQUENCE trip_seq START 1;

CREATE OR REPLACE FUNCTION generate_trip_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trip_code IS NULL OR NEW.trip_code = '' THEN
    NEW.trip_code = 'TRIP-' || LPAD(nextval('trip_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_trip_code BEFORE INSERT ON trips FOR EACH ROW EXECUTE FUNCTION generate_trip_code();
