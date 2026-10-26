/*
# Create Marcô multi-tenant scheduling core

1. New Tables
- `marco_tenants` stores each barbershop or salon, its public slug, contact WhatsApp, and visual theme.
- `marco_services` stores the services offered by each commerce, including duration and price.
- `marco_appointments` stores customer bookings linked to a commerce and service.
- `marco_subscriptions` stores the commercial plan and subscription status for Super Admin visibility.
2. Security
- Enable row-level security on every new table.
- This first version intentionally uses public/shared access so a public booking link can work without sign-in.
- Grant only the CRUD operations used by the browser and create separate policies for each operation.
3. Important notes
- Public slugs are unique and are the stable links shared by each commerce.
- Appointment timestamps are stored with timezone support.
- Seed data creates one realistic demo commerce so the first screen is immediately usable.
*/

CREATE TABLE IF NOT EXISTS marco_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'Barbearia',
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  theme text NOT NULL DEFAULT 'dark',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marco_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES marco_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 45,
  price numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marco_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES marco_tenants(id) ON DELETE CASCADE,
  service_id uuid REFERENCES marco_services(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marco_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES marco_tenants(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'Essencial',
  status text NOT NULL DEFAULT 'active',
  monthly_value numeric(10,2) NOT NULL DEFAULT 49.90,
  renewal_date date NOT NULL DEFAULT CURRENT_DATE + 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marco_services_tenant_idx ON marco_services(tenant_id);
CREATE INDEX IF NOT EXISTS marco_appointments_tenant_date_idx ON marco_appointments(tenant_id, appointment_date);

ALTER TABLE marco_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE marco_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE marco_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marco_subscriptions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON marco_tenants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marco_services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marco_appointments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON marco_subscriptions TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view tenants" ON marco_tenants;
CREATE POLICY "Public can view tenants" ON marco_tenants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create tenants" ON marco_tenants;
CREATE POLICY "Public can create tenants" ON marco_tenants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update tenants" ON marco_tenants;
CREATE POLICY "Public can update tenants" ON marco_tenants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete tenants" ON marco_tenants;
CREATE POLICY "Public can delete tenants" ON marco_tenants FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view services" ON marco_services;
CREATE POLICY "Public can view services" ON marco_services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create services" ON marco_services;
CREATE POLICY "Public can create services" ON marco_services FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update services" ON marco_services;
CREATE POLICY "Public can update services" ON marco_services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete services" ON marco_services;
CREATE POLICY "Public can delete services" ON marco_services FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view appointments" ON marco_appointments;
CREATE POLICY "Public can view appointments" ON marco_appointments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create appointments" ON marco_appointments;
CREATE POLICY "Public can create appointments" ON marco_appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update appointments" ON marco_appointments;
CREATE POLICY "Public can update appointments" ON marco_appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete appointments" ON marco_appointments;
CREATE POLICY "Public can delete appointments" ON marco_appointments FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view subscriptions" ON marco_subscriptions;
CREATE POLICY "Public can view subscriptions" ON marco_subscriptions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Public can create subscriptions" ON marco_subscriptions;
CREATE POLICY "Public can create subscriptions" ON marco_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Public can update subscriptions" ON marco_subscriptions;
CREATE POLICY "Public can update subscriptions" ON marco_subscriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public can delete subscriptions" ON marco_subscriptions;
CREATE POLICY "Public can delete subscriptions" ON marco_subscriptions FOR DELETE TO anon, authenticated USING (true);

INSERT INTO marco_tenants (name, slug, category, phone, whatsapp, city, theme)
VALUES ('Barbearia Aurora', 'barbearia-aurora', 'Barbearia', '(11) 98888-2244', '5511988882244', 'São Paulo, SP', 'dark')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO marco_services (tenant_id, name, duration_minutes, price)
SELECT id, item.name, item.duration_minutes, item.price
FROM marco_tenants, (VALUES
  ('Corte clássico', 45, 45.00),
  ('Barba desenhada', 30, 35.00),
  ('Corte + barba', 75, 70.00),
  ('Sobrancelha', 15, 20.00)
) AS item(name, duration_minutes, price)
WHERE slug = 'barbearia-aurora'
  AND NOT EXISTS (SELECT 1 FROM marco_services WHERE tenant_id = marco_tenants.id);

INSERT INTO marco_subscriptions (tenant_id, plan, status, monthly_value, renewal_date)
SELECT id, 'Profissional', 'active', 89.90, CURRENT_DATE + 18
FROM marco_tenants
WHERE slug = 'barbearia-aurora'
ON CONFLICT (tenant_id) DO NOTHING;