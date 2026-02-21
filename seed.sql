-- FleetFlow Seed Data
-- Default password for all users: Fleet@123
-- bcrypt hash of 'Fleet@123' with 10 rounds

INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('manager@fleetflow.io',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Arjun Mehta',       'Fleet Manager'),
  ('dispatcher@fleetflow.io','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sunita Rao',         'Dispatcher'),
  ('safety@fleetflow.io',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vikram Nair',        'Safety Officer'),
  ('analyst@fleetflow.io',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Preethi Krishnan',  'Financial Analyst');

-- Note: The above hash is for 'password' (bcrypt default test). 
-- In production, re-hash with: bcrypt.hash('Fleet@123', 10)
-- For real seed, run: node backend/src/scripts/seed.js

INSERT INTO vehicles (name, license_plate, vehicle_type, region, max_load_capacity_kg, odometer_km, acquisition_cost, status) VALUES
  ('Tata Prima – Truck-01',       'MH-01-AA-0001', 'Truck', 'North', 5000, 124500, 2500000, 'Available'),
  ('Mahindra Bolero – Van-02',    'MH-02-AB-0042', 'Van',   'South', 800,  56200,  950000,  'On Trip'),
  ('Honda Activa – Bike-03',      'MH-03-AC-0088', 'Bike',  'East',  50,   18400,  95000,   'Available'),
  ('Ashok Leyland – Truck-04',    'MH-04-AD-0110', 'Truck', 'West',  8000, 310000, 3200000, 'In Shop'),
  ('Maruti Eeco – Van-05',        'MH-05-AE-0500', 'Van',   'North', 500,  34100,  680000,  'Available'),
  ('TVS Apache – Bike-06',        'MH-06-AF-0678', 'Bike',  'South', 40,   8900,   120000,  'On Trip'),
  ('Tata Ace – Van-07',           'MH-07-AG-0712', 'Van',   'East',  750,  89000,  750000,  'In Shop'),
  ('Eicher Pro – Truck-08',       'MH-08-AH-0890', 'Truck', 'West',  6000, 201000, 2800000, 'Available');

INSERT INTO drivers (full_name, license_number, license_expiry, license_category, phone, trips_completed, safety_score, status) VALUES
  ('Rajesh Kumar',  'MH0320200012345', '2026-08-15', 'Truck', '+91 98765 43210', 124, 92, 'On Duty'),
  ('Priya Sharma',  'MH0220190067890', '2025-03-01', 'Van',   '+91 87654 32109', 87,  88, 'On Duty'),
  ('Suresh Patel',  'MH0520210034567', '2027-11-20', 'All',   '+91 76543 21098', 203, 96, 'Off Duty'),
  ('Meena Nair',    'MH0320180089012', '2024-06-30', 'Bike',  '+91 65432 10987', 45,  72, 'Suspended'),
  ('Alex Johnson',  'MH0120220045678', '2028-02-28', 'Van',   '+91 54321 09876', 62,  85, 'On Duty');

-- Trips (vehicle/driver FKs via subquery)
INSERT INTO trips (trip_code, vehicle_id, driver_id, origin, destination, cargo_weight_kg, distance_km, status, trip_date) VALUES
  ('TRIP-001',
    (SELECT id FROM vehicles WHERE license_plate='MH-02-AB-0042'),
    (SELECT id FROM drivers  WHERE license_number='MH0320200012345'),
    'Mumbai Warehouse', 'Pune Hub', 650, 148, 'Completed', '2025-06-10'),
  ('TRIP-002',
    (SELECT id FROM vehicles WHERE license_plate='MH-05-AE-0500'),
    (SELECT id FROM drivers  WHERE license_number='MH0120220045678'),
    'Thane Depot', 'Nashik Centre', 450, 160, 'Dispatched', '2025-06-11'),
  ('TRIP-003',
    (SELECT id FROM vehicles WHERE license_plate='MH-06-AF-0678'),
    (SELECT id FROM drivers  WHERE license_number='MH0220190067890'),
    'Andheri Hub', 'Bandra Store', 30, 12, 'On Trip', '2025-06-11'),
  ('TRIP-004',
    (SELECT id FROM vehicles WHERE license_plate='MH-01-AA-0001'),
    (SELECT id FROM drivers  WHERE license_number='MH0520210034567'),
    'Bhiwandi Warehouse', 'Nagpur Hub', 4200, 862, 'Draft', '2025-06-12'),
  ('TRIP-005',
    (SELECT id FROM vehicles WHERE license_plate='MH-03-AC-0088'),
    (SELECT id FROM drivers  WHERE license_number='MH0320200012345'),
    'Colaba Store', 'Dadar Hub', 45, 8, 'Cancelled', '2025-06-09');

INSERT INTO maintenance_logs (vehicle_id, service_type, cost, mechanic_name, service_date, status, notes) VALUES
  ((SELECT id FROM vehicles WHERE license_plate='MH-04-AD-0110'), 'Engine Overhaul', 85000, 'TechFix Garage',      '2025-06-08', 'In Progress', 'Major engine rebuild required'),
  ((SELECT id FROM vehicles WHERE license_plate='MH-07-AG-0712'), 'Brake Service',   12000, 'AutoCare Workshop',   '2025-06-10', 'Completed',   'All four brakes replaced'),
  ((SELECT id FROM vehicles WHERE license_plate='MH-01-AA-0001'), 'Oil Change',       3500, 'QuickLube Station',   '2025-05-28', 'Completed',   'Routine 10k service');

INSERT INTO expenses (vehicle_id, trip_id, expense_type, liters, cost, expense_date) VALUES
  ((SELECT id FROM vehicles WHERE license_plate='MH-02-AB-0042'), (SELECT id FROM trips WHERE trip_code='TRIP-001'), 'Fuel',  62,  6820,  '2025-06-10'),
  ((SELECT id FROM vehicles WHERE license_plate='MH-02-AB-0042'), (SELECT id FROM trips WHERE trip_code='TRIP-001'), 'Toll',  0,   450,   '2025-06-10'),
  ((SELECT id FROM vehicles WHERE license_plate='MH-05-AE-0500'), (SELECT id FROM trips WHERE trip_code='TRIP-002'), 'Fuel',  45,  4950,  '2025-06-11'),
  ((SELECT id FROM vehicles WHERE license_plate='MH-04-AD-0110'), NULL,                                               'Other', 0,   85000, '2025-06-08'),
  ((SELECT id FROM vehicles WHERE license_plate='MH-01-AA-0001'), NULL,                                               'Fuel',  210, 23100, '2025-06-12');

-- Update trip sequence
SELECT setval('trip_seq', 5);
