/*
# Add professional profiles to Marcô

1. New Tables
- `marco_professionals` stores each professional working at a commerce.
- `id` uniquely identifies a professional.
- `tenant_id` links the professional to the commerce.
- `name` and `role` identify the professional shown to customers.
- `specialty` describes the main service focus.
- `active` controls whether the professional appears in booking.
2. Security
- Enable row-level security.
- Grant CRUD access to anon and authenticated because this first version has no sign-in screen.
- Add separate policies for each operation.
3. Important notes
- Professionals are linked to the commerce with a foreign key and are removed with that commerce.
- Seed professionals are added only when the demo commerce has none.
*/

CREATE TABLE IF NOT EXISTS marco_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES marco_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Profissional',
  specialty text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marco_professionals_tenant_idx ON marco_professionals(tenant_id);

ALTER TABLE marco_professionals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON marco_professionals TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view professionals" ON marco_professionals;
CREATE POLICY "Public can view professionals" ON marco_professionals FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create professionals" ON marco_professionals;
CREATE POLICY "Public can create professionals" ON marco_professionals FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update professionals" ON marco_professionals;
CREATE POLICY "Public can update professionals" ON marco_professionals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete professionals" ON marco_professionals;
CREATE POLICY "Public can delete professionals" ON marco_professionals FOR DELETE TO anon, authenticated USING (true);

INSERT INTO marco_professionals (tenant_id, name, role, specialty)
SELECT id, item.name, item.role, item.specialty
FROM marco_tenants, (VALUES
  ('Ana Martins', 'Especialista', 'Cortes e visagismo'),
  ('Rafael Costa', 'Barbeiro', 'Barba e acabamento'),
  ('Lucas Ferreira', 'Barbeiro', 'Corte clássico')
) AS item(name, role, specialty)
WHERE slug = 'barbearia-aurora'
  AND NOT EXISTS (SELECT 1 FROM marco_professionals WHERE tenant_id = marco_tenants.id);