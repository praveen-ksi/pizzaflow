/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const PLACEHOLDER_URL = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
const BROKEN_VEGGIE_URL_ID = 'photo-1571066811602-71683a3f680d';
const NEW_VEGGIE_URL = 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=600&q=80';

export const PIZZA_IMAGE_MAP: Record<string, string> = {
  'margherita': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
  'chicago': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
  'deep dish': 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80',
  'greek': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
  'mediterranean': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
  'california veggie': NEW_VEGGIE_URL,
  'veggie': NEW_VEGGIE_URL,
  'farm house': 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=600&q=80',
  'farmhouse': 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=600&q=80',
  'pepperoni': 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
  'bbq chicken': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  'paneer': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80',
  'tikka': 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80'
};

/**
 * Returns a high quality image for a pizza based on its name.
 * If currentImage is provided and is NOT the general placeholder or broken image, it keeps it.
 */
export function getPizzaImage(name: string, currentImage?: string): string {
  if (currentImage && currentImage.trim().length > 0) {
    if (currentImage.includes(BROKEN_VEGGIE_URL_ID)) {
      return NEW_VEGGIE_URL;
    }
    if (currentImage !== PLACEHOLDER_URL) {
      return currentImage;
    }
  }

  const normalized = name.toLowerCase();
  
  for (const [key, url] of Object.entries(PIZZA_IMAGE_MAP)) {
    if (normalized.includes(key)) {
      return url;
    }
  }

  // General default fallback
  return PLACEHOLDER_URL;
}
