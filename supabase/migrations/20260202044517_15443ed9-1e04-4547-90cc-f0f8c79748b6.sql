-- Permitir upload de fotos no bucket fiscal-photos respeitando pasta do usuário
-- (evita erro: new row violates row-level security policy for table "objects")

-- Garantir bucket existente (id = name)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fiscal-photos', 'fiscal-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Policies para o bucket fiscal-photos
-- Leitura pública (bucket é público)
DROP POLICY IF EXISTS "Fiscal photos are publicly accessible" ON storage.objects;
CREATE POLICY "Fiscal photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fiscal-photos');

-- Upload: somente usuário autenticado pode gravar dentro da sua própria pasta {user_id}/...
DROP POLICY IF EXISTS "Users can upload their own fiscal photos" ON storage.objects;
CREATE POLICY "Users can upload their own fiscal photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'fiscal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Upsert pode virar UPDATE; permitir update apenas na própria pasta
DROP POLICY IF EXISTS "Users can update their own fiscal photos" ON storage.objects;
CREATE POLICY "Users can update their own fiscal photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'fiscal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'fiscal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- (Opcional) permitir delete apenas na própria pasta
DROP POLICY IF EXISTS "Users can delete their own fiscal photos" ON storage.objects;
CREATE POLICY "Users can delete their own fiscal photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'fiscal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
