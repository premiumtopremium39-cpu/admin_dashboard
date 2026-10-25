-- ==============================================================================
-- EDEN & THREADS: UNIFIED LIVE SYNC & REALTIME REPLICATION SCRIPT
-- Run this once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fkkfzmydaascwthtonsi/sql
-- ==============================================================================

-- 1. Enable Realtime Publications on Products, Promos, Announcements, Orders, Reviews
-- This guarantees any admin change is pushed instantly over WebSocket to https://eden-threads.vercel.app/
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promo_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;

-- 2. Configure Full Row Replication Identity (Ensures all column values are broadcast)
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.promo_codes REPLICA IDENTITY FULL;
ALTER TABLE public.announcements REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.product_reviews REPLICA IDENTITY FULL;

-- 3. Storage Bucket 'garment-photos' setup with Public Read & Upload permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'garment-photos',
    'garment-photos',
    true,
    15728640, -- 15MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET 
    public = true,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public garment photos read policy" ON storage.objects;
CREATE POLICY "Public garment photos read policy"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'garment-photos');

DROP POLICY IF EXISTS "Allow uploads to garment-photos" ON storage.objects;
CREATE POLICY "Allow uploads to garment-photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'garment-photos');

DROP POLICY IF EXISTS "Allow updates to garment-photos" ON storage.objects;
CREATE POLICY "Allow updates to garment-photos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'garment-photos');

DROP POLICY IF EXISTS "Allow delete from garment-photos" ON storage.objects;
CREATE POLICY "Allow delete from garment-photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'garment-photos');
