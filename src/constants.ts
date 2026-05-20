import { 
  Product, 
  Testimonial, 
  PromoHighlight, 
  HeroContent, 
  AboutContent, 
  UrgentPromoContent, 
} from './types';
 
export const BRAND_NAME = "Mornings by SFC";
export const BRAND_LOGO = "/logo.png";

export const METADATA = {
  title: "Mornings by SFC | Healthy Rituals",
  description: "Menghadirkan ritual pagi yang lebih bermakna melalui koleksi real food overnight oats dan beverages fungsional.",
  thumbnail: "/images/thumbnail.jpg",
  url: "http://morningsbysfc.my.id",
};

export const URGENT_PROMO: UrgentPromoContent = {
  enabled: true,
  image_url: "/images/gratis-ongkir.png?auto=format&fit=crop&q=80&w=800",
  title: "Gratis Ongkir Se-Gedebage!",
  description: "Makan enak ngga perlu mikir ongkir, Cling! udah dateng!",
  cta_text: "Pesan Sekarang",
  cta_link: "#menu",
};

export const NAV_LINKS = [
  { name: 'Beranda', href: '#' },
  { name: 'Menu', href: '#menu' },
  { name: 'Ongkir', href: '#shipping-calculator' },
  { name: 'Tentang', href: '#about' },
  { name: 'Testimoni', href: '#testimonials' },
  { name: 'Kontak', href: '#contact' },
];

export const NAV_BUTTON_TEXT = "Pesan Online";

export const HERO_CONTENT: HeroContent = {
  tagline: `${BRAND_NAME} | HEALTHY RITUALS`,
  title: "Ritual Pagi",
  title_Italic: "Yang Sempurna.",
  description: "Menghadirkan ritual pagi yang lebih bermakna melalui koleksi real food overnight oats dan beverages fungsional.",
  image_url: "https://drive.google.com/file/d/1rvwT1kJGKRcCfGGZarA40yCLkxvbOylv/view?usp=drive_link",
  primary_Button_Text: "Lihat Menu",
  secondary_Button_Text: "Hubungi Kami",
  toko_buka: true,
  teks_buka: "BUKA",
  teks_libur: "LIBUR",
};

export const ABOUT_CONTENT: AboutContent = {
  tagline: BRAND_NAME,
  title: "Awal yang sehat untuk hari yang luar biasa.",
  subtitle: "Mornings by SFC percaya bahwa apa yang Anda konsumsi di pagi hari menentukan ritme hari Anda.",
  description: "Kami menghadirkan pilihan sarapan dan camilan fungsional. Produk Overnight Oats dan Beverages kami menggunakan bahan \"Real Food\" yang menyehatkan bagi tubuh. Sebagai pelengkap momen santai, kami juga menghadirkan Snacks lezat yang memanjakan lidah.",
  values_json: { values: [
    'Plant-Based Goodness',
    'Zero Added Sugar',
    'Ancient Wisdom'
  ] }
};

export const MENU_CATEGORIES = [
  { id: 'all', name: 'All Items' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'snacks', name: 'Snacks' },
  { id: 'overnight-oats', name: 'Overnight Oats' },
  { id: 'meals', name: 'Meals' },
];

export const MENU_BUTTON_TEXT = "+ Tambah ke Pesanan";

export const CART_CONTENT = {
  title: "Pilihan Anda",
  subtitle: `Sistem Pesanan ${BRAND_NAME}`,
  emptyMessage: "\"Menu menanti pilihan kurasi Anda.\"",
  emptyAction: "Lihat Penawaran",
  noteLabel: "Keterangan Tambahan (Opsional)",
  notePlaceholder: "Contoh: Tanpa gula, tambah topping, atau instruksi pengiriman...",
  totalLabel: "Estimasi Total",
  checkoutButton: "Konfirmasi Pilihan"
};

export const FOOTER_CONTENT = {
  description: "Mornings by SFC: Menghadirkan ritual pagi yang seimbang. Dari Overnight Oats dan Beverages berbahan real food yang menyehatkan, hingga Snacks lezat untuk memanjakan harimu.",
  quickLinks: [
    { name: 'Cerita Kami', href: '#' },
    { name: 'Menu Lengkap', href: '#menu' },
    { name: 'Testimoni', href: '#testimonials' },
    { name: 'Karir', href: '#contact' },
  ],
  openingHours: [
    { label: "Senin - Jumat", time: "07:00 - 21:00" },
    { label: "Sabtu - Minggu", time: "08:00 - 22:00", highlight: true }
  ],
  newsletter: {
    title: "Buletin",
    description: "Berlangganan untuk mendapatkan pembaruan spesial dan undangan acara.",
    placeholder: "Alamat Email",
    buttonText: "DAFTAR SEKARANG"
  },
  footerNote: "* Jam operasional hari libur nasional mungkin berbeda",
  statusText: "Sistem Pemesanan Online Aktif",
  locationText: "Bandung, Indonesia",
  copyrightYear: 2026
};

export const SECTION_TITLES = {
  promo: {
    tagline: "KAMPANYE TERBARU",
    title: "Promo & Unggulan"
  },
  menu: {
    tagline: "PENAWARAN KAMI",
    title: "Menu Pilihan"
  },
  testimonials: {
    tagline: "ULASAN",
    title: "Kata Mereka yang Menikmati"
  },
  contact: {
    tagline: "HUBUNGI KAMI",
    title: "Ambil Pesanan Anda"
  }
};

export const CONTACT_CONTENT = {
  formTitle: "Kirim Pesan",
  nameLabel: "Nama Lengkap",
  namePlaceholder: "Contoh: Budi Santoso",
  emailLabel: "Alamat Email",
  emailPlaceholder: "hello@example.com",
  messageLabel: "Pesan atau Pertanyaan",
  messagePlaceholder: "Bagaimana kami bisa membantu Anda?",
  submitButton: "KIRIM PESAN",
  successAlert: (name: string) => `Terima kasih ${name}! Kami telah menerima pesan Anda.`
};

export const TESTIMONIALS_UI = {
  tagline: "ULASAN",
  title: "Kata Mereka yang Menikmati",
  cardSubtitle: "Kesan Penikmat"
};

export const SLIDER_UI = {
  prevLabel: "Promo sebelumnya",
  nextLabel: "Promo berikutnya"
};

export const CONTACT_INFO = {
  location: {
    title: "Lokasi Pengambilan",
    address: "Griya Cempaka Arum Blok F2 no 16",
    district: "Rancanumpang Gedebage",
    city: "Kota Bandung, 40295",
    note: "*Hanya untuk pengambilan pesanan"
  },
  whatsapp: {
    title: "WhatsApp",
    number: "+62 813-9144-5237",
    link: "https://wa.me/6281391445237",
    phoneNumber: "6281391445237"
  },
  email: {
    title: "Email",
    address: "morningsbysfc@gmail.com"
  },
  social: {
    instagram: "https://www.instagram.com/morningsbysfc/"
  }
};

export const SHIPPING_CONFIG = {
  PICKUP_ADDRESS: "Griya Cempaka Arum Blok F2 no 16, Bandung",
  PICKUP_MAPS_LINK: "https://www.google.com/maps/search/?api=1&query=-6.958222,107.709778",
  FREE_SHIPPING_MIN_ORDER: 50000,
  MAX_DISTANCE_KM: 10,
  TIERS: [
    { maxKm: 2, fee: 8000, label: "Zona Dekat" },
    { maxKm: 5, fee: 10000, label: "Zona Menengah" },
    { maxKm: 8, fee: 12000, label: "Zona Jauh" },
    { maxKm: 10, fee: 15000, label: "Zona Extra" },
  ],
  FREE_SHIPPING_TIERS: [
    { minOrder: 200000, maxKm: 10 },
    { minOrder: 150000, maxKm: 7 },
    { minOrder: 100000, maxKm: 5 },
    { minOrder: 50000, maxKm: 3 },
  ],  
  UI: {
    tagline: "LAYANAN PENGIRIMAN",
    title: "Kalkulator Ongkir",
    guide: "Panduan: Cek jarak dari Gedebage (Griya Cempaka Arum) ke alamat kamu melalui Google Maps, lalu masukkan hasil km di bawah ini.",
    distanceLabel: "Jarak (KM)",
    distancePlaceholder: "Contoh: 3.5",
    totalLabel: "Total Belanja (Opsional)",
    totalPlaceholder: "Total belanja",
    calculateButton: "Hitung Ongkir",
    mapsButton: "Cek di Google Maps",
    results: {
      distance: "Jarak Input",
      status: "Zona / Status",
      fee: "Biaya Ongkir"
    }
  }
};

export const PROMO_IMAGES = [
  {
    id: 'promo-1',
    title: 'Bener Ngga Sih?',
    image: '/images/oats.jpg?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'promo-2',
    title: 'Makan Ubi Pake Cara Lain?',
    image: '/images/ube-cheesecake-content-1.jpg?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'promo-3',
    title: 'Minuman Lembut Dengan Aroma Nostalgia',
    image: '/images/arcane-content.jpg?auto=format&fit=crop&q=80&w=800',
  }
];

export const MENU_ITEMS: Product[] = [
  {
    id: 'oat-original',
    name: 'OatShine Original (Apple)',
    description: 'Perpaduan rolled oat, susu, chia seed, dan apel segar dengan manis alami madu. Creamy, ringan, dan bikin kenyang lebih lama.',
    price: 25000,
    category: 'Overnights Oats',
    image_url: '/images/original.jpg?auto=format&fit=crop&q=80&w=600',
    active: true,
    updated_at: ''
  },
  {
    id: 'oat-mango',
    name: 'OatShine Mango',
    description: 'Perpaduan rolled oat, susu, chia seed, dan mangga segar dengan rasa manis alami yang creamy and menyegarkan. Praktis, mengenyangkan, dan pas untuk memulai hari.',
    price: 25000,
    category: 'Overnights Oats',
    image_url: '/images/mango.jpg?auto=format&fit=crop&q=80&w=600',
    active: true,
    updated_at: ''
  },
  {
    id: 'oat-dragon',
    name: 'OatShine Buah Naga',
    description: 'Overnight oats dengan buah naga segar, rolled oat, susu, dan chia seed. Ringan, segar, dan bikin pagi terasa lebih fresh.',
    price: 25000,
    category: 'Overnights Oats',
    image_url: '/images/dragon.jpg?auto=format&fit=crop&q=80&w=600',
    active: true,
    updated_at: ''
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Yuae Breakerz',
    role: 'Mornings Owner',
    content: 'Orang indo itu jarang yang makan overnight oats, kalo mereka tau rasanya, bakal minta terus!',
    image_url: '/images/syabab.jpg?auto=format&fit=crop&q=80&w=150'
  },
  {
    id: 't2',
    name: 'Desi Nelasari',
    role: 'Mornings Manager',
    content: 'Aku juga awalnya aneh sama ubi dibanjur cream cheese, ternyata kok enak? setelah itu ngga judging lagi sebelum ngerasain.',
    image_url: '/images/bunga.jpg?auto=format&fit=crop&q=80&w=150'
  }
];
