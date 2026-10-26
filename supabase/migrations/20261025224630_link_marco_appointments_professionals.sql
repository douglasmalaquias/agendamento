/*
# Link appointments to professionals

1. Modified Tables
- `marco_appointments` gains nullable `professional_id`, linking a booking to the selected professional.
2. Security
- No policy changes are needed because the existing appointment CRUD policies continue to cover the new column.
3. Important notes
- The column is nullable so existing bookings remain valid and are not changed or deleted.
*/

ALTER TABLE marco_appointments
  ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES marco_professionals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS marco_appointments_professional_idx ON marco_appointments(professional_id);