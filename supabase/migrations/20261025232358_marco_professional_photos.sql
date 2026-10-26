/*
# Foto de perfil dos profissionais

1. Novas colunas
- `marco_professionals.photo_url` (text): URL pública da foto de perfil do profissional,
  armazenada no bucket `marco-professional-photos` do Supabase Storage. Vazia quando
  o profissional ainda não tem foto — o frontend usa as iniciais como fallback.

2. Storage
- Cria o bucket público `marco-professional-photos` se ainda não existir.
- Como o app é single-tenant (sem login), o bucket permite leitura pública e
  upload público controlado pelas políticas de storage abaixo. Em produção recomenda-se
  restringir o upload a usuários autenticados do painel; por enquanto, qualquer cliente
  anon pode enviar a foto, alinhado às políticas já existentes em marco_professionals.

3. Segurança
- Nenhuma nova tabela. A nova coluna fica coberta pelas políticas públicas já existentes
  (USING (true) / WITH CHECK (true)) porque o app é single-tenant sem login.
- Storage policies: leitura pública (SELECT) e upload/update/delete público (INSERT,
  UPDATE, DELETE) para anon e authenticated, compatível com o app sem login.

4. Notas
- O upload é feito direto do frontend via `supabase.storage.from('marco-professional-photos').upload()`.
- O caminho do arquivo usa o ID do profissional: `<professional_id>/<timestamp>.<ext>`.
- A URL pública gerada é salva em `marco_professionals.photo_url`.
*/

ALTER TABLE marco_professionals
  ADD COLUMN IF NOT EXISTS photo_url text NOT NULL DEFAULT '';

-- Bucket público para fotos de perfil dos profissionais
INSERT INTO storage.buckets (id, name, public)
VALUES ('marco-professional-photos', 'marco-professional-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage: leitura pública
DROP POLICY IF EXISTS "Public can read professional photos" ON storage.objects;
CREATE POLICY "Public can read professional photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'marco-professional-photos');

-- Upload público (app sem login)
DROP POLICY IF EXISTS "Public can upload professional photos" ON storage.objects;
CREATE POLICY "Public can upload professional photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'marco-professional-photos');

-- Atualização pública (reativar/reemplazar foto)
DROP POLICY IF EXISTS "Public can update professional photos" ON storage.objects;
CREATE POLICY "Public can update professional photos"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'marco-professional-photos')
WITH CHECK (bucket_id = 'marco-professional-photos');

-- Remoção pública
DROP POLICY IF EXISTS "Public can delete professional photos" ON storage.objects;
CREATE POLICY "Public can delete professional photos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'marco-professional-photos');
