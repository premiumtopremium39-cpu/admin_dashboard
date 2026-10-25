-- ==============================================================================
-- EDEN & THREADS: STORAGE PERMISSIONS & PUBLIC POLICIES FOR 'garment-photos'
-- Run this once in the Supabase SQL Editor (https://supabase.com/dashboard/project/fkkfzmydaascwthtonsi/sql)
-- ==============================================================================

-- 1. Ensure the bucket exists and is marked public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'garment-photos',
    'garment-photos',
    true,
    15728640, -- 15MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Enable public read access for all visitors & storefront
DROP POLICY IF EXISTS "Public garment photos read policy" ON storage.objects;
CREATE POLICY "Public garment photos read policy"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'garment-photos');

-- 3. Allow uploads (INSERT) to 'garment-photos' bucket
DROP POLICY IF EXISTS "Allow uploads to garment-photos" ON storage.objects;
CREATE POLICY "Allow uploads to garment-photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'garment-photos');

-- 4. Allow updates & replacement of images
DROP POLICY IF EXISTS "Allow updates to garment-photos" ON storage.objects;
CREATE POLICY "Allow updates to garment-photos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'garment-photos');

-- 5. Allow deletion of archived or replaced garment images
DROP POLICY IF EXISTS "Allow delete from garment-photos" ON storage.objects;
CREATE POLICY "Allow delete from garment-photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'garment-photos');
