/**
 * Mornings HQ - Backend Service (Google Apps Script Integration)
 * 
 * Flow:
 * 1. Database: Google Sheets (Tab: products, categories)
 * 2. Storage: Google Drive (Folder khusus gambar)
 * 3. API: Google Apps Script (POST method with action dispatcher)
 */

export function getApiUrl() {
  const localUrl = localStorage.getItem('mornings_gas_api_url_override');
  if (localUrl) return localUrl;
  return (import.meta as any).env.VITE_GAS_API_URL || '';
}

async function request(path: string, method: 'GET' | 'POST' = 'GET', data: any = null) {
  const API_URL = getApiUrl();
  if (!API_URL || API_URL.includes('YOUR_SCRIPT_ID')) {
    throw new Error('Google Apps Script URL belum dikonfigurasi di .env atau Pengaturan.');
  }

  try {
    let url = API_URL.trim();
    
    // Safety check for common URL mistakes
    if (!url.endsWith('/exec')) {
      console.warn(`[GAS WARNING] URL Anda mungkin salah: ${url}. Web App URL biasanya berakhiran /exec. Jika berakhiran /dev atau /edit, aplikasi tidak akan bisa terhubung.`);
    }

    console.log(`[GAS DEBUG] Koneksi ke URL: ${url}`);
    const options: any = {
      method,
      mode: 'cors',
      redirect: 'follow'
    };

    if (method === 'GET') {
      const sep = url.includes('?') ? '&' : '?';
      // Add action=read and a cache-buster timestamp
      url = `${url}${sep}path=${encodeURIComponent(path)}&action=read&cb=${Date.now()}`;
    } else {
      // Add path to URL even for POST, some GAS dispatchers need it
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}path=${encodeURIComponent(path)}`;
      
      // If data has action, add it to the URL as well for visibility to e.parameter
      if (data && data.action) {
        url += `&action=${encodeURIComponent(data.action)}`;
      }
      
      options.headers = {
        'Content-Type': 'text/plain;charset=utf-8',
      };
      options.body = JSON.stringify(data || {});
    }

    console.log(`Sending payload to GAS [${method}]:`, data ? { ...data, image_file: data.image_file ? '[BASE64_DATA]' : 'none' } : 'No data');
    
    // Add timeout to fetch
    const controller = new AbortController();
    const TIMEOUT_DURATION = 120000; // 120s timeout
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);
    
    options.signal = controller.signal;

    let response;
    let retryCount = 0;
    const MAX_RETRIES = 1;

    const performFetch = async () => {
      try {
        return await fetch(url, options);
      } catch (e: any) {
        if (e.name === 'AbortError') {
          throw new Error(`Koneksi terputus (Timeout ${TIMEOUT_DURATION/1000}s). Server Google sedang sibuk atau data terlalu besar. Silakan coba lagi bbrp saat lagi.`);
        }
        
        if (e.message === 'Failed to fetch' && retryCount < MAX_RETRIES) {
          console.warn(`[GAS] Fetch failed, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          retryCount++;
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await performFetch();
        }

        if (e.message === 'Failed to fetch') {
          throw new Error(`Koneksi Gagal: Tidak bisa menghubungi Google Sheets. \nDetail: \n1. Pastikan URL di Settings berakhiran /exec (Bukan /dev). \n2. Pastikan Script sudah di-deploy sebagai "Web App" dengan akses "Anyone". \n3. Periksa koneksi internet Anda.`);
        }
        throw e;
      }
    };

    try {
      response = await performFetch();
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) throw new Error('Network response was not ok');
    
    const resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.error(`[GAS DEBUG] Error parsing response as JSON. Response start: "${resultText.substring(0, 100)}..."`);
      if (resultText.includes('authorize access')) {
        throw new Error('Google Apps Script memerlukan otorisasi. Silakan buka editor script dan jalankan fungsi doGet atau doPost sekali, atau pastikan deployment disetel ke "Anyone".');
      }
      throw new Error(`Respons dari server bukan JSON yang valid. (Mungkin spreadsheet Anda sedang bermasalah atau URL salah). Debug: ${resultText.substring(0, 50)}`);
    }
    
    if (result && result.script_version) {
      console.log(`[GAS DEBUG] Script Version: ${result.script_version}`);
    }

    if (result && typeof result === 'object' && result.error) {
      if (result.error.includes('IZIN DRIVE DITOLAK')) {
        const detail = result.error.match(/\[(.*?)\]/)?.[1] || 'Login Ganda Detected';
        throw new Error(`⚠️ AKSES DRIVE DITOLAK: (${detail}). Google bingung karena Anda login lebih dari 1 akun. Buka file INSTRUCTIONS_FOR_USER.md untuk cara 'Hard Reset' via Incognito.`);
      }
      throw new Error(result.error);
    }
    
    // If result is null/undefined or empty string, return null or empty array based on expectation
    if (result === null || result === undefined) return null;

    return result;
  } catch (error: any) {
    console.error(`API Error [${path}]:`, error);
    throw error;
  }
}

export const productService = {
  async getAll() {
    return request('products');
  },

  async getCategories() {
    return request('categories');
  },

  async getHero() {
    const data = await request('hero_content');
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async getUrgentPromo() {
    const data = await request('urgent_promo');
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async getTestimonials() {
    return request('testimonials');
  },

  async getPromoHighlights() {
    return request('promo_highlights');
  },

  async getAbout() {
    const data = await request('about_content');
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async getAboutAll() {
    return request('about_content');
  },

  async getConfig() {
    const data = await request('site_config');
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  },

  async saveHeroContent(data: any) {
    return request('hero_content', 'POST', {
      action: 'update_single',
      sheet: 'hero_content',
      data
    });
  },

  async saveUrgentPromo(data: any) {
    return request('urgent_promo', 'POST', {
      action: 'update_single',
      sheet: 'urgent_promo',
      data
    });
  },

  async saveConfig(data: any) {
    return request('site_config', 'POST', {
      action: 'update_single',
      sheet: 'site_config',
      data
    });
  },

  async saveAboutNarrative(data: any) {
    return request('about_content', 'POST', {
      action: 'update_single',
      sheet: 'about_content',
      data
    });
  },

  async getOrders() {
    return request('orders');
  },

  async createOrder(orderData: any) {
    // This uses POST as per user's script, adding action: 'insert' for consistency
    return request('orders', 'POST', { 
      action: 'insert',
      sheet: 'orders',
      data: orderData 
    });
  },

  async create(data: any, sheet: string = 'products') {
    return request(sheet, 'POST', {
      action: 'insert',
      sheet,
      data
    });
  },

  async update(id: string | number, product: any, sheet: string = 'products') {
    return request(sheet, 'POST', {
      action: 'update',
      sheet,
      id,
      data: product
    });
  },

  async delete(id: string | number, sheet: string = 'products') {
    return request(sheet, 'POST', {
      action: 'delete',
      sheet,
      id
    });
  },

  async getRecipes() {
    return request('recipes');
  },

  async saveRecipe(data: any) {
    if (data.id) {
      return request('recipes', 'POST', {
        action: 'update',
        sheet: 'recipes',
        id: data.id,
        data
      });
    } else {
      return request('recipes', 'POST', {
        action: 'insert',
        sheet: 'recipes',
        data
      });
    }
  },

  async deleteRecipe(id: string | number) {
    return request('recipes', 'POST', {
      action: 'delete',
      sheet: 'recipes',
      id
    });
  }
};
