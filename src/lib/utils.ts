import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Memastikan URL Google Drive bisa dirender sebagai gambar langsung.
 * Mendukung format: 
 * - drive.google.com/file/d/ID/view
 * - drive.google.com/open?id=ID
 * - drive.google.com/uc?id=ID
 * Mengonversi ke link thumbnail/LH3 yang lebih reliable.
 */
export function getGoogleDriveUrl(url: string = '') {
  if (!url) return '';
  if (!url.includes('drive.google.com')) return url;

  let fileId = '';
  
  // Extract ID from various formats
  if (url.includes('/file/d/')) {
    fileId = url.split('/file/d/')[1].split('/')[0];
  } else if (url.includes('id=')) {
    fileId = url.split('id=')[1].split('&')[0];
  }

  if (fileId) {
    // Format thumbnail atau lh3 googleusercontent lebih cepat dan reliable
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parses items from a string or array.
 * Handles:
 * 1. JSON string: [{"name": "Product", "qty": 1, "price": 1000}]
 * 2. Plain text: "Product Name (2)" or "Product Name x2"
 */
export function parseItems(itemsData: any): { name: string; qty: number; price: number }[] {
  if (!itemsData) return [];
  
  // If it's already an array, just normalize fields
  if (Array.isArray(itemsData)) {
    return itemsData.map(item => ({
      name: String(item.name || item.product_name || 'Produk'),
      qty: Number(item.qty || item.quantity || 1),
      price: Number(item.price || 0)
    }));
  }

  if (typeof itemsData !== 'string') return [];

  // Try JSON parse
  try {
    const parsed = JSON.parse(itemsData);
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        name: String(item.name || item.product_name || 'Produk'),
        qty: Number(item.qty || item.quantity || 1),
        price: Number(item.price || 0)
      }));
    }
  } catch (e) {
    // Handle plain text like "Item A (1), Item B (2)"
    const itemStrings = itemsData.split(/,(?![^(]*\))/); // Split by comma but NOT if inside parentheses
    
    return itemStrings.map(str => {
      let part = str.trim();
      
      // 1. Extract Quantity: Pattern "(Qty)" or "xQty" at the end
      const qtyRegex = /\((\d+)\)$|x(\d+)$/;
      const qtyMatch = part.match(qtyRegex);
      let qty = 1;
      if (qtyMatch) {
        qty = parseInt(qtyMatch[1] || qtyMatch[2]);
        part = part.replace(qtyRegex, '').trim();
      }

      // 2. Extract Price: Pattern "Rp 25.000" or "Rp25.000"
      const priceRegex = /Rp\s?([0-9.]+)/i;
      const priceMatch = part.match(priceRegex);
      let price = 0;
      if (priceMatch) {
        // Remove dots for numeric parsing
        price = parseInt(priceMatch[1].replace(/\./g, ''));
        part = part.replace(priceRegex, '').trim();
      }
      
      return { name: part, qty, price };
    }).filter(item => item.name);
  }

  return [];
}

/**
 * Formats time from Google Sheets which often comes as "1899-12-30T16:00:00.000Z"
 * or a standard time string like "08:00:00".
 */
export function formatTime(timeStr: string): string {
  if (!timeStr || timeStr === '-') return '-';
  
  // Handle ISO strings from Sheets (e.g., 1899-12-30T08:00:00.000Z)
  if (timeStr.includes('T') && timeStr.includes('Z')) {
    try {
      const date = new Date(timeStr);
      // We use UTC methods because Sheets times are often interpreted as UTC and offset
      // However, usually we just want the time part
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch (e) {
      return timeStr;
    }
  }
  
  return timeStr;
}
