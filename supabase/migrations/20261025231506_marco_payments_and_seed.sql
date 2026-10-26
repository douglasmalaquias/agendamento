/*
# Pagamentos, status do plano e 10 comércios fictícios

1. Novas colunas
- `marco_tenants.pix_key` (text): chave Pix do estabelecimento para receber pagamentos online.
- `marco_tenants.pix_key_type` (text): tipo da chave Pix (cpf, email, telefone, aleatoria).
- `marco_professionals.pix_key` (text): chave Pix individual do profissional, opcional.
- `marco_professionals.pix_key_type` (text): tipo da chave Pix do profissional.
- `marco_appointments.payment_method` (text): 'pix' (online) ou 'local' (pagar no local).
- `marco_appointments.payment_status` (text): 'pending', 'paid' ou 'local'.

2. Ajustes de dados
- Atualiza `marco_subscriptions` existentes para o plano único "Pro Ilimitado".
- Cria 10 comércios fictícios de ramos variados (manicure, salão, estética facial,
  tatuagem, depilação, massoterapia, barbearia premium, maquiagem, sobrancelha, estética corporal)
  com serviços, profissionais, Pix e subscription próprios.

3. Segurança
- Nenhuma nova tabela. As novas colunas ficam cobertas pelas políticas públicas já existentes.

4. Notas
- Os 10 comércios usam slugs únicos em português, prontos para serem abertos via URL pública.
- As chaves Pix são fictícias e servem apenas para exibição na página do cliente.
*/

ALTER TABLE marco_tenants
  ADD COLUMN IF NOT EXISTS pix_key text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix_key_type text NOT NULL DEFAULT 'telefone';

ALTER TABLE marco_professionals
  ADD COLUMN IF NOT EXISTS pix_key text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix_key_type text NOT NULL DEFAULT 'telefone';

ALTER TABLE marco_appointments
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'local';

-- Unifica o plano em "Pro Ilimitado"
UPDATE marco_subscriptions
SET plan = 'Pro Ilimitado',
    status = 'active',
    monthly_value = 0,
    renewal_date = CURRENT_DATE + 30
WHERE status = 'active';

UPDATE marco_subscriptions
SET status = 'paid',
    renewal_date = CURRENT_DATE + 18,
    monthly_value = 0
WHERE tenant_id = (SELECT id FROM marco_tenants WHERE slug = 'barbearia-aurora');

INSERT INTO marco_subscriptions (tenant_id, plan, status, monthly_value, renewal_date)
SELECT id, 'Pro Ilimitado', 'paid', 0, CURRENT_DATE + 18
FROM marco_tenants
WHERE slug = 'barbearia-aurora'
  AND NOT EXISTS (SELECT 1 FROM marco_subscriptions WHERE tenant_id = marco_tenants.id);

UPDATE marco_tenants
SET pix_key = '5511988882244', pix_key_type = 'telefone'
WHERE slug = 'barbearia-aurora';

-- 10 comércios fictícios
DO $$
DECLARE
  s jsonb;
  t_id uuid;
  s_item jsonb;
  p_item jsonb;
  seeds jsonb := $json$[
    {"name":"Studio Bella Unha","slug":"studio-bella-unha","category":"Manicure e Pedicure","phone":"(11) 97777-1100","whatsapp":"5511977771100","city":"São Paulo, SP","theme":"pink","pix_key":"5511977771100","pix_key_type":"telefone","paid":true,
     "services":[["Manicure completa",40,35.00],["Pedicure spa",50,45.00],["Esmaltação em gel",60,70.00],["Nail art",45,55.00]],
     "professionals":[["Bianca Rocha","Manicure","Esmaltação em gel"],["Camila Duarte","Pedicure","Spa dos pés"]]},
    {"name":"Espelho Mágico","slug":"espelho-magico","category":"Salão de Beleza","phone":"(11) 96666-2200","whatsapp":"5511966662200","city":"Campinas, SP","theme":"gold","pix_key":"espelho@magic.com","pix_key_type":"email","paid":true,
     "services":[["Corte feminino",60,80.00],["Escova modeladora",45,60.00],["Coloração completa",120,180.00],["Hidratação profunda",60,95.00]],
     "professionals":[["Renata Lopes","Cabeleireira","Coloração"],["Sandra Melo","Cabeleireira","Cortes femininos"]]},
    {"name":"Pele Radiante Estética","slug":"pele-radiante","category":"Estética Facial","phone":"(11) 95555-3300","whatsapp":"5511955553300","city":"São Paulo, SP","theme":"green","pix_key":"5511955553300","pix_key_type":"telefone","paid":false,
     "services":[["Limpeza de pele",60,120.00],["Peeling facial",45,150.00],["Microagulhamento",75,220.00],["Máscara de hidratação",30,70.00]],
     "professionals":[["Dra. Helena Castro","Esteticista","Estética facial"],["Marina Reis","Esteticista","Limpeza de pele"]]},
    {"name":"Tinta & Pele Studio","slug":"tinta-e-pele","category":"Tatuagem","phone":"(11) 94444-4400","whatsapp":"5511944444400","city":"São Paulo, SP","theme":"dark","pix_key":"tintaepele@pix.com","pix_key_type":"email","paid":true,
     "services":[["Sessão tatuagem (1h)",60,250.00],["Sessão tatuagem (2h)",120,450.00],["Cover-up",90,350.00],["Retoque",45,120.00]],
     "professionals":[["Diego Alves","Tatuador","Realismo"],["Tatiana Freire","Tatuadora","Fine line"]]},
    {"name":"Seda Depilação","slug":"seda-depilacao","category":"Depilação","phone":"(11) 93333-5500","whatsapp":"5511933335500","city":"Guarulhos, SP","theme":"light","pix_key":"5511933335500","pix_key_type":"telefone","paid":true,
     "services":[["Depilação axila",20,35.00],["Depilação perna inteira",45,90.00],["Depilação virilha",30,70.00],["Depilação facial",25,45.00]],
     "professionals":[["Aline Souza","Depiladora","Cera quente"],["Patrícia Nunes","Depiladora","Cera fria"]]},
    {"name":"Equilíbrio Massoterapia","slug":"equilibrio-massoterapia","category":"Massoterapia","phone":"(11) 92222-6600","whatsapp":"5511922226600","city":"São Paulo, SP","theme":"green","pix_key":"equilibrio@masso.com","pix_key_type":"email","paid":false,
     "services":[["Massagem relaxante",60,130.00],["Massagem terapêutica",75,160.00],["Quick massage",30,70.00],["Massagem modeladora",90,200.00]],
     "professionals":[["Thiago Maia","Massoterapeuta","Relaxante"],["Carla Pinto","Massoterapeuta","Modeladora"]]},
    {"name":"Barba & Navalha","slug":"barba-navalha","category":"Barbearia Premium","phone":"(11) 91111-7700","whatsapp":"5511911117700","city":"São Paulo, SP","theme":"gold","pix_key":"5511911117700","pix_key_type":"telefone","paid":true,
     "services":[["Corte premium",60,90.00],["Barba toalha quente",45,70.00],["Combo executivo",90,140.00],["Pigmentação capilar",30,60.00]],
     "professionals":[["Vinícius Lima","Barbeiro","Corte premium"],["André Bento","Barbeiro","Barba navalhada"],["Kauã Oliveira","Barbeiro","Combo executivo"]]},
    {"name":"Glam Maquiagem","slug":"glam-maquiagem","category":"Maquiagem","phone":"(11) 98888-8800","whatsapp":"5511988888800","city":"São Bernardo, SP","theme":"pink","pix_key":"5511988888800","pix_key_type":"telefone","paid":true,
     "services":[["Maquiagem social",60,150.00],["Maquiagem para noiva",120,450.00],["Maquiagem para festa",75,220.00],["Curso de automaquagem",90,300.00]],
     "professionals":[["Larissa Mendes","Maquiadora","Noivas"],["Fernanda Dias","Maquiadora","Festas"]]},
    {"name":"Arco Íris Sobrancelha","slug":"arco-iris-sobrancelha","category":"Design de Sobrancelhas","phone":"(11) 97777-9900","whatsapp":"5511977779900","city":"Osasco, SP","theme":"light","pix_key":"5511977779900","pix_key_type":"telefone","paid":false,
     "services":[["Design de sobrancelha",30,45.00],["Henna",20,25.00],["Brow lamination",45,90.00],["Microblading",120,350.00]],
     "professionals":[["Jéssica Barros","Designer","Microblading"],["Renata Cunha","Designer","Design e henna"]]},
    {"name":"Lótus Estética Corporal","slug":"lotus-estetica","category":"Estética Corporal","phone":"(11) 96666-1010","whatsapp":"5511966661010","city":"Santo André, SP","theme":"green","pix_key":"lotus@estetica.com","pix_key_type":"email","paid":true,
     "services":[["Drenagem linfática",60,140.00],["Massagem modeladora",75,170.00],["Radiofrequência",45,200.00],["Criolipólise",60,350.00]],
     "professionals":[["Dra. Beatriz Lopes","Fisioterapeuta","Drenagem linfática"],["Marina Costa","Esteticista","Criolipólise"]]}
  ]$json$;
BEGIN
  FOR s IN SELECT * FROM jsonb_array_elements(seeds) LOOP
    -- insere o comércio
    INSERT INTO marco_tenants (name, slug, category, phone, whatsapp, city, theme, pix_key, pix_key_type)
    VALUES (s->>'name', s->>'slug', s->>'category', s->>'phone', s->>'whatsapp', s->>'city', s->>'theme', s->>'pix_key', s->>'pix_key_type')
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO t_id FROM marco_tenants WHERE slug = s->>'slug';

    -- subscription
    INSERT INTO marco_subscriptions (tenant_id, plan, status, monthly_value, renewal_date)
    VALUES (t_id, 'Pro Ilimitado',
      CASE WHEN (s->>'paid') = 'true' THEN 'paid' ELSE 'pending' END,
      0, CURRENT_DATE + (floor(random() * 25 + 5))::int)
    ON CONFLICT (tenant_id) DO NOTHING;

    -- serviços
    FOR s_item IN SELECT * FROM jsonb_array_elements(s->'services') LOOP
      INSERT INTO marco_services (tenant_id, name, duration_minutes, price)
      VALUES (t_id, s_item->>0, (s_item->>1)::int, (s_item->>2)::numeric)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- profissionais (herdam o pix do estabelecimento por padrão)
    FOR p_item IN SELECT * FROM jsonb_array_elements(s->'professionals') LOOP
      INSERT INTO marco_professionals (tenant_id, name, role, specialty, pix_key, pix_key_type)
      VALUES (t_id, p_item->>0, p_item->>1, p_item->>2, s->>'pix_key', s->>'pix_key_type')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
