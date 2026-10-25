// Helper to resolve images: if relative path like "/assets/...", resolve to storefront URL or fallback luxury garment photo
export function getOptimizedImageUrl(imageSrc, width = 600) {
  if (!imageSrc) {
    return 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=' + width;
  }

  // If already a full URL (e.g. Supabase Storage public URL or external CDN)
  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
    // If it's a Supabase storage image, support transformation parameters if enabled
    return imageSrc;
  }

  // If it's a relative path from the storefront project (e.g. /assets/shirt_front.png)
  // Storefront runs at http://localhost:5173
  if (imageSrc.startsWith('/')) {
    // Return storefront absolute path so browser can load it from customer store dev server
    return `http://localhost:5173${imageSrc}`;
  }

  return imageSrc;
}

// Fallback high-resolution linen images for fallback if localhost:5173 assets aren't served
export const FALLBACK_GARMENT_IMAGES = {
  1: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=600',
  2: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
  3: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&q=80&w=600',
  4: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?auto=format&fit=crop&q=80&w=600',
  5: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=600',
};
