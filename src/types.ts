export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  harga_asli?: number;
  status_produk?: string;
  image_url: string;
  active: boolean | string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  image_url: string;
}

export interface PromoHighlight {
  id: string;
  title: string;
  image_url: string;
}

export interface HeroContent {
  tagline: string;
  title: string;
  title_Italic: string;
  description: string;
  image_url: string;
  primary_Button_Text: string;
  secondary_Button_Text: string;
  toko_buka: boolean | string;
  teks_buka: string;
  teks_libur: string;
  updated_at?: string;
}

export interface AboutContent {
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  values_json: { values: string[] } | string;
}

export interface UrgentPromoContent {
  enabled: boolean | string;
  image_url: string;
  title: string;
  description: string;
  cta_text: string;
  cta_link: string;
}

export interface SiteConfig {
  whatsapp_number: string;
  instagram_handle: string;
  tiktok_handle: string;
  address: string;
  email_contact: string;
  opening_hours: string;
  running_text: string;
  announcement: string;
  shipping_config: any;
  cart_content: any;
  contact_content: any;
  metadata_config: any;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  whatsapp_number: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  items: any[] | string;
  created_at: string;
  delivery_date: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
}
