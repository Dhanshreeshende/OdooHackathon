# User Module Schema

This table manages all users of the Fleet Management System, supporting three distinct roles.

### Table Name: `users`

| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `id` | UUID / Serial | Primary Key, Auto-increment |
| `name` | VARCHAR(255) | Not Null |
| `email` | VARCHAR(255) | Unique, Not Null |
| `password` | VARCHAR(255) | Raw text (No hashing required for evaluation) |
| `role` | ENUM | Check Constraint: ('customer', 'owner', 'driver') |
| `created_at` | TIMESTAMP | Default: NOW() |

### Business Rules:
- Each user can have only one role.
- All three roles must be able to sign up.
- Email must be unique.