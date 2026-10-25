import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fkkfzmydaascwthtonsi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_C1elhIPYMMmlzkrSImfLog_3zFrwYAT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Resizes and re-encodes raster images client-side into WebP with high visual fidelity
 * @param {File} file 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export async function optimizeImageClient(file, maxWidth = 1600, maxHeight = 1600, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Preserve aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas conversion to blob failed'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Corrupt or malformed image file.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads garment image directly to the Supabase Storage bucket 'garment-photos'
 * @param {File} file 
 * @returns {Promise<string>} public URL of the uploaded image
 */
export async function uploadGarmentPhoto(file) {
  if (!file) throw new Error('No file selected');

  // File security & type validation
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('Please select a valid image file (JPG, JPEG, PNG, WebP, or AVIF)');
  }

  // 15MB limit safeguard
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image exceeds 15MB size limit');
  }

  let uploadBlob = file;
  let fileExt = 'webp';
  let mimeType = 'image/webp';

  try {
    uploadBlob = await optimizeImageClient(file, 1600, 1600, 0.88);
  } catch (err) {
    console.warn('Image re-encoding fallback to original:', err);
    fileExt = file.name.split('.').pop();
    mimeType = file.type;
  }

  const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `${Date.now()}_${cleanBase}.${fileExt}`;
  const filePath = `products/${fileName}`;

  // Upload directly to bucket 'garment-photos'
  const { data, error } = await supabase.storage
    .from('garment-photos')
    .upload(filePath, uploadBlob, {
      contentType: mimeType,
      cacheControl: '31536000, public', // 1 year immutable CDN cache
      upsert: true,
    });

  if (error) {
    console.error('Storage upload error:', error);
    if (error.message?.includes('row-level security') || error.statusCode === '403') {
      throw new Error(`Storage Policy Error: The 'garment-photos' bucket has RLS enabled without an INSERT policy. Please run the provided SQL setup script in Supabase SQL Editor.`);
    }
    throw new Error(`Upload to 'garment-photos' bucket failed: ${error.message}`);
  }

  // Get resulting public URL
  const { data: publicData } = supabase.storage
    .from('garment-photos')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

/**
 * Extracts storage path from a Supabase Storage public URL and deletes the file from 'garment-photos'
 * @param {string} imageUrl 
 * @returns {Promise<void>}
 */
export async function deleteGarmentPhoto(imageUrl) {
  if (!imageUrl) return;

  try {
    // Only delete if the image is hosted in the garment-photos bucket
    if (imageUrl.includes('/garment-photos/')) {
      const parts = imageUrl.split('/garment-photos/');
      if (parts.length > 1) {
        // Remove query parameters if present
        const filePath = parts[1].split('?')[0];
        console.log(`Deleting orphan photo from garment-photos bucket: ${filePath}`);
        
        const { error } = await supabase.storage
          .from('garment-photos')
          .remove([filePath]);

        if (error) {
          console.warn('Notice: Could not delete image from storage bucket:', error.message);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to parse and delete storage file:', err);
  }
}
