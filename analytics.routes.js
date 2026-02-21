# Trip Module Schema

This table records trip details created by customers and tracks completion status.

### Table Name: `trips`

| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID / Serial | Primary Key, Auto-increment |
| `customer_id` | UUID / Serial | Foreign Key -> `users.id` |
| `vehicle_id` | UUID / Serial | Foreign Key -> `vehicles.id` |
| `start_date` | DATE / TIMESTAMP | Not Null |
| `end_date` | DATE / TIMESTAMP | Nullable until trip ends |
| `location` | VARCHAR(255) | Not Null |
| `distance_km` | DECIMAL(10,2) | Not Null |
| `passengers` | INTEGER | Not Null |
| `tripCost` | DECIMAL(10,2) | Nullable until trip ends |
| `isCompleted` | BOOLEAN | Default: false |
| `created_at` | TIMESTAMP | Default: NOW() |

### Relationships:
- **Customer → Trips**: One-to-many relationship.
- **Vehicle → Trips**: One-to-many relationship.

### Business Rules:
- **Calculation**: `tripCost` = `distance_km` * `rate_per_km`.
- **Availability**: When a trip is created, the associated vehicle's `isAvailable` must become `false`. When the trip ends, it becomes `true`.
- **Capacity**: Passengers must not exceed vehicle capacity.