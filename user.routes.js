# Vehicle Module Schema

This table tracks vehicles owned by users and assigned to drivers.

### Table Name: `vehicles`

| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID / Serial | Primary Key, Auto-increment |
| `name` | VARCHAR(255) | Not Null |
| `registration_number` | VARCHAR(255) | Unique, Not Null |
| `allowed_passengers` | INTEGER | Not Null |
| `isAvailable` | BOOLEAN | Default: true |
| `rate_per_km` | DECIMAL(10,2) | Not Null |
| `owner_id` | UUID / Serial | Foreign Key -> `users.id` |
| `driver_id` | UUID / Serial | Foreign Key -> `users.id` (Nullable initially) |
| `created_at` | TIMESTAMP | Default: NOW() |

### Relationships:
- **Owner → Vehicles**: One-to-many relationship (One owner can own multiple vehicles).
- **Driver → Vehicle**: One-to-one or Many-to-one (One driver assigned to a vehicle).

### Business Rules:
- Only owners can create vehicles.
- Registration numbers must be unique.