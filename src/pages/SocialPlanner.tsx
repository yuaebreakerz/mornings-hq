import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Tag, 
  Sparkles, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Clock, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Instagram, 
  MessageSquare, 
  Video, 
  Share2, 
  TrendingUp, 
  Edit2, 
  Trash2, 
  Info, 
  X, 
  Check, 
  ListTodo,
  CalendarDays,
  FileVideo,
  Lightbulb,
  Workflow,
  Sparkle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNotifications } from '../components/NotificationProvider';

// Types
export interface SocialContent {
  id: string;
  title: string;
  platform: 'Instagram' | 'TikTok' | 'Threads';
  type: 'Feed' | 'Reels' | 'Story';
  uploadDate: string; // YYYY-MM-DD
  status: 'Idea' | 'Draft' | 'Editing' | 'Posted';
  ideaDescription: string;
  caption: string;
  cta: string;
  shootChecklist: { id: string; text: string; done: boolean }[];
  assets: { id: string; name: string; type: string; url: string }[];
  created_at: string;
}

const PLATFORMS = ['Instagram', 'TikTok', 'Threads'] as const;
const TYPES = ['Feed', 'Reels', 'Story'] as const;
const STATUSES = ['Idea', 'Draft', 'Editing', 'Posted'] as const;

export default function SocialPlanner() {
  const { triggerTestNotification } = useNotifications();
  const [contents, setContents] = useState<SocialContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Tab control: 'calendar' | 'list'
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Generator State
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [genBrandName, setGenBrandName] = useState('Mornings Fresh & Radiant');
  const [genProduct, setGenProduct] = useState('Golden Glow Mango Smoothie');
  const [genGoal, setGenGoal] = useState('Promo Launch Diskon 20% & Manfaat Sehat');
  const [genPlatform, setGenPlatform] = useState<'Instagram' | 'TikTok' | 'Threads'>('Instagram');
  const [generatedResult, setGeneratedResult] = useState<{
    ideas: string;
    hook: string;
    caption: string;
    hashtags: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Content Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<SocialContent | null>(null);
  
  // Form edit states
  const [formData, setFormData] = useState({
    title: '',
    platform: 'Instagram' as SocialContent['platform'],
    type: 'Reels' as SocialContent['type'],
    uploadDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'Idea' as SocialContent['status'],
    ideaDescription: '',
    caption: '',
    cta: '',
    shootChecklist: [] as SocialContent['shootChecklist'],
    assets: [] as SocialContent['assets']
  });

  // Checklist helper item state
  const [newChecklistItem, setNewChecklistItem] = useState('');
  // Attachment helper files state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Load items from local storage
  useEffect(() => {
    const cached = localStorage.getItem('mornings_social_planner');
    if (cached) {
      try {
        setContents(JSON.parse(cached));
      } catch (e) {
        console.warn('Failed to load social contents', e);
      }
    } else {
      // Mock initial data
      const mockInitial: SocialContent[] = [
        {
          id: 's1',
          title: 'Behind the Scenes: Proses Blender Collagen Glow',
          platform: 'Instagram',
          type: 'Reels',
          uploadDate: format(new Date(), 'yyyy-MM-dd'),
          status: 'Editing',
          ideaDescription: 'Tampilkan aesthetic pours, warna merah buah naga segar, serbuk kolagen premium, dan tekstur kental smoothie.',
          caption: 'Dibalik kelembutan Dragon Fruit Collagen Glow! 🐉✨ Diproses higienis setiap pagi untuk mencerahkan hari dan kulitmu. Mau nyoba langsung di outlet?',
          cta: 'Klik Link di Bio untuk pesan instan POS / WhatsApp!',
          shootChecklist: [
            { id: '1', text: 'Ambil video cinematic cup kosong', done: true },
            { id: '2', text: 'Rekam pouring naga segar & susu almond', done: true },
            { id: '3', text: 'Ambil shot blender berputar kencang', done: true },
            { id: '4', text: 'Sajikan dengan kelapa parut di atasnya', done: false }
          ],
          assets: [
            { id: 'a1', name: 'bts_draft_video.mp4', type: 'video/mp4', url: 'blob:mock' }
          ],
          created_at: new Date().toISOString()
        },
        {
          id: 's2',
          title: 'Tips Memilih Menu Sehat Saat Cuaca Panas',
          platform: 'TikTok',
          type: 'Reels',
          uploadDate: format(new Date(Date.now() + 86400000 * 2), 'yyyy-MM-dd'),
          status: 'Idea',
          ideaDescription: 'Berikan 3 alasan kenapa buah-buahan dingin berenergi tinggi lebih efektif dibanding es sirup gula.',
          caption: 'Cuaca terik ekstrim bikin gampang lemes? 🥵 Jangan salah pilih asupan! Ini dia 3 rahasia tetep bugar & fresh seharian.',
          cta: 'Share video ini ke bestie mager kalian!',
          shootChecklist: [
            { id: '10', text: 'Wajah lelah ekspresi kepanasan', done: false },
            { id: '11', text: 'Tampilkan transisi minum Mornings Mango Glow', done: false }
          ],
          assets: [],
          created_at: new Date().toISOString()
        },
        {
          id: 's3',
          title: 'Threads Tanya Jawab: "Sarapan favorit kalian apa?"',
          platform: 'Threads',
          type: 'Feed',
          uploadDate: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'),
          status: 'Posted',
          ideaDescription: 'Tingkatkan keterlibatan audiens dengan polling sederhana dan thread interaktif tentang gaya hidup gluten-free.',
          caption: 'Makan bubur diaduk, ga diaduk, atau... sarapan Smoothie Cup pagi hari tanpa ribet sambil nyetir? Coba sebutin rutinitas kalian di bawah 👇',
          cta: 'Ikuti percakapan dan klaim diskon eksklusif di Threads!',
          shootChecklist: [],
          assets: [],
          created_at: new Date().toISOString()
        }
      ];
      setContents(mockInitial);
      localStorage.setItem('mornings_social_planner', JSON.stringify(mockInitial));
    }
  }, []);

  const saveContentsToDb = (updated: SocialContent[]) => {
    setContents(updated);
    localStorage.setItem('mornings_social_planner', JSON.stringify(updated));
  };

  // Drag and Drop simulated click movement
  const handleMoveStatus = (id: string, nextStatus: SocialContent['status']) => {
    const updated = contents.map(c => c.id === id ? { ...c, status: nextStatus } : c);
    saveContentsToDb(updated);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  };

  // Open task for details or editing
  const handleOpenDetail = (content: SocialContent) => {
    setSelectedContent(content);
    setFormData({
      title: content.title,
      platform: content.platform,
      type: content.type,
      uploadDate: content.uploadDate,
      status: content.status,
      ideaDescription: content.ideaDescription,
      caption: content.caption,
      cta: content.cta,
      shootChecklist: [...content.shootChecklist],
      assets: [...content.assets]
    });
    setNewChecklistItem('');
    setUploadedFiles([]);
    setShowModal(true);
  };

  // Save changes
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    let updatedList: SocialContent[] = [];
    if (selectedContent) {
      // Editing
      const updatedItem: SocialContent = {
        ...selectedContent,
        title: formData.title,
        platform: formData.platform,
        type: formData.type,
        uploadDate: formData.uploadDate,
        status: formData.status,
        ideaDescription: formData.ideaDescription,
        caption: formData.caption,
        cta: formData.cta,
        shootChecklist: formData.shootChecklist,
        assets: formData.assets
      };
      updatedList = contents.map(c => c.id === selectedContent.id ? updatedItem : c);
    } else {
      // New Content
      const newItem: SocialContent = {
        id: 's_' + Date.now(),
        title: formData.title,
        platform: formData.platform,
        type: formData.type,
        uploadDate: formData.uploadDate,
        status: formData.status,
        ideaDescription: formData.ideaDescription,
        caption: formData.caption,
        cta: formData.cta,
        shootChecklist: formData.shootChecklist,
        assets: [],
        created_at: new Date().toISOString()
      };
      updatedList = [newItem, ...contents];
    }

    saveContentsToDb(updatedList);
    setShowModal(false);
    setSelectedContent(null);
    triggerTestNotification('system');
  };

  const handleDeleteContent = (id: string) => {
    if (confirm('Hapus rencana konten media sosial ini?')) {
      const updated = contents.filter(c => c.id !== id);
      saveContentsToDb(updated);
      setShowModal(false);
      setSelectedContent(null);
    }
  };

  // Quick checklist manipulation inside modal
  const handleAddChecklist = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: 'chk_' + Date.now(),
      text: newChecklistItem.trim(),
      done: false
    };
    setFormData(prev => ({
      ...prev,
      shootChecklist: [...prev.shootChecklist, newItem]
    }));
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      shootChecklist: prev.shootChecklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item)
    }));
  };

  const removeChecklistItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      shootChecklist: prev.shootChecklist.filter(item => item.id !== itemId)
    }));
  };

  // AI Content Generator with actual smart dynamic parsing for Mornings!
  const handleAIRun = () => {
    setGenerating(true);
    setTimeout(() => {
      // Analyze the product to determine the category
      const prodLower = (genProduct || '').toLowerCase();

      // Detect keywords to bucket into standard category verticals
      const isBeverage = /susu|milk|boba|shake|smoothie|jus|juice|kopi|coffee|tea|teh|minum|drink|collagen|water|air|glow|mango|naga|dragon|berry|avocado|matcha|cokelat|chocolate|lemon|ginger|jahe|kelapa/i.test(prodLower);
      const isFood = /makan|food|cup|bowl|salad|roti|bread|cake|kue|pastry|cookies|granola|cemilan|snack|bakery|kuliner|sate|nasi|mie|ayam|beef|burger|pizza|biscuit|donat|donut|pisang|banana|berry/i.test(prodLower);
      const isSkincare = /serum|cleaner|cleanser|skincare|beauty|cream|kulit|skin|shampoo|sabun|soap|lotion|wajah|face|glowup|toner|moisturizer|masker|mask|acne|jerawat|sunscreen|cosmetic|foundation/i.test(prodLower);
      const isFashion = /baju|kaos|celana|jeans|jaket|t-shirt|outfit|fashion|hijab|wear|shirt|denim|dress|sepatu|shoes|tas|bag|topi|hat|aksesoris|accessories/i.test(prodLower);
      const isTech = /aplikasi|software|pos|kasir|digital|system|sistem|website|layanan|service|it|tech|laptop|gadget|admin|cloud|platform/i.test(prodLower);

      let category = 'general';
      if (isBeverage) category = 'beverage';
      else if (isFood) category = 'food';
      else if (isSkincare) category = 'skincare';
      else if (isFashion) category = 'fashion';
      else if (isTech) category = 'tech';

      // 1. Hook generator (Indonesian copywriting standard & high engagement)
      let hook = '';
      if (genPlatform === 'Instagram') {
        if (category === 'beverage') {
          hook = `🔥 "Berhenti jajan minuman tinggi gula pengawet saat cuaca panas terik! Badan lelah & gampang dehidrasi itu sinyal bahaya." (Transisi cinematic menuangkan ${genProduct})`;
        } else if (category === 'food') {
          hook = `🔥 "Cara nikmat makan lezat tanpa rasa bersalah dan perut begah!" (Transisi aesthetic menyajikan sepiring ${genProduct})`;
        } else if (category === 'skincare') {
          hook = `✨ "Rahasia kulit glowing, plumpy, dan bebas kusam sepanjang hari secara alami!" (Zoom-in tetesan botol pipet ${genProduct})`;
        } else if (category === 'fashion') {
          hook = `👗 "Outfit simple tapi stylish yang langsung naikin pede kamu 10x lipat!" (Transisi snap-cut ganti pakaian ke ${genProduct})`;
        } else if (category === 'tech') {
          hook = `⚡ "Cara cerdas menghemat waktu & memotong kerjaan berulang hingga 80%!" (Zoom-in dashboard modern ${genProduct})`;
        } else {
          hook = `✨ "Upgrade kualitas hidup dan rutinitas harianmu ke level berikutnya!" (Cinematic unboxing/reveal ${genProduct})`;
        }
      } else if (genPlatform === 'TikTok') {
        if (category === 'beverage') {
          hook = `📢 "POV: Elu pengen tetep dapet asupan segar, berenergi & kulit terhidrasi pas cuaca panas terik tanpa takut kalori berlebih!" (Transisi menuangkan ${genProduct})`;
        } else if (category === 'food') {
          hook = `📢 "POV: Saat kelaparan melanda pas jam kerja tapi janji mau diet & clean eat harian!" (Tampilkan sendokan pertama ${genProduct})`;
        } else if (category === 'skincare') {
          hook = `📢 "POV: Kulit wajah kamu bermasalah & kusam padahal udah pakai macam-macam skincare!" (Transisi before-after memakai ${genProduct})`;
        } else if (category === 'fashion') {
          hook = `📢 "POV: Elu butuh look baru yang nyaman, estetik, dan awet buat nemenin mobilitas harian!" (Pose percaya diri memakai ${genProduct})`;
        } else if (category === 'tech') {
          hook = `📢 "POV: Ketika sistem kerjaan lama kamu super ribet, manual, dan rawan bikin human error!" (Transisi ekspresi lega pakai ${genProduct})`;
        } else {
          hook = `📢 "POV: Akhirnya nemu solusi andalan yang praktis dan bener-bener ngerubah kebiasaan sehari-hari!" (Tunjukkan close-up ${genProduct})`;
        }
      } else { // Threads
        if (category === 'beverage') {
          hook = `💬 "Lebih baik invest ke segelas es kopi manis kekinian yang bikin ngantuk, atau asupan energi alami murni dari ${genProduct}?"`;
        } else if (category === 'food') {
          hook = `💬 "Mitos atau fakta: Makanan sehat rasanya selalu hambar? Coba rasain sensasi rasa dari ${genProduct} dulu sebelum ambil kesimpulan."`;
        } else if (category === 'skincare') {
          hook = `💬 "Investasi skincare termahal sebenarnya adalah konsistensi & formula aktif yang tepat. Gimana pendapat kalian tentang ${genProduct}?"`;
        } else if (category === 'fashion') {
          hook = `💬 "Riset membuktikan pakaian yang nyaman bisa ningkatin produktivitas kerja kita hingga 30%. Siapa yang setuju?"`;
        } else if (category === 'tech') {
          hook = `💬 "Sebagai pelaku bisnis, seberapa banyak waktu yang kalian habiskan untuk urusan admin manual setiap harinya? Ada solusinya?"`;
        } else {
          hook = `💬 "Apa satu kebiasaan atau produk baru belakangan ini yang bener-bener membantu aktivitas harian kalian jadi super praktis?"`;
        }
      }

      // 2. Shoot ideas script (Aesthetic Content Scene Layout)
      let ideasOutput = '';
      if (category === 'beverage') {
        ideasOutput = `Scene 1: Close-up cinematic bahan segar, potongan buah, atau sensasi es dingin berkabut.\nScene 2: Shot pouring (menuang) cairan ${genProduct} yang kental & kaya tekstur dari blender/botol secara perlahan.\nScene 3: Detail sendok menyajikan toping pelengkap. Zoom in kepuasan sesapan pertama (Satisfying sip).`;
      } else if (category === 'food') {
        ideasOutput = `Scene 1: Tampilkan plating cantik estetik ${genProduct} di atas piring atau mangkuk dengan pencahayaan hangat.\nScene 2: Sendolan pertama yang memperlihatkan kelembutan, kesegaran, atau keriuk renyah dari detail tekstur.\nScene 3: Tampilkan ekspresi wajah ceria menikmati suapan pertama yang sehat dan lezat.`;
      } else if (category === 'skincare') {
        ideasOutput = `Scene 1: Rekam tekstur produk ${genProduct} yang diaplikasikan ke kulit wajah/tangan (cinematic drip/drop).\nScene 2: Detail kemasan mewah, botol, dan label estetik, perlihatkan kemudahan penggunaan serum.\nScene 3: Tampilkan model dengan kulit wajah plumpy, bercahaya (glowing skin finish), berekspresi segar.`;
      } else if (category === 'fashion') {
        ideasOutput = `Scene 1: Close-up detail serat benang kain, kancing, jahitan rapi, atau tekstur berkualitas tinggi dari ${genProduct}.\nScene 2: Video transisi cepat 'snap change' sebelum beralih ke total look estetik berpakaian lengkap.\nScene 3: Model berjalan cinematic santai di koridor atau background minimalis luar ruangan, tunjukkan kenyamanan bergerak.`;
      } else if (category === 'tech') {
        ideasOutput = `Scene 1: Rekam layar (screen record) antarmuka ${genProduct} yang elegan, responsif, dan mudah digunakan (dashboard run-through).\nScene 2: Perbandingan kartun/ekspresi: Tangan pusing mengetik (cara lama) vs Jari mengetuk satu tombol lalu berhasil instan.\nScene 3: Tunjukkan grafik pertambahan efisiensi waktu, omset, atau grafik kesuksesan bisnis yang menanjak.`;
      } else {
        ideasOutput = `Scene 1: Unboxing cinematic kemasan luar produk yang dikemas rapi, tunjukkan detail segel premium.\nScene 2: Demonstrasikan fungsi utama ${genProduct} saat digunakan langsung dalam rutinitas harian.\nScene 3: Shot close-up estetika produk saat ditaruh di workspace/pajangan dengan cahaya berkelas.`;
      }

      // 3. Dynamic Caption Builder
      let probSentence = '';
      let benefitSentence = '';
      let ctaSentence = '';

      if (category === 'beverage') {
        probSentence = `Sering capek di tengah aktivitas padat dan butuh asupan yang segar sekaligus menutrisi tubuh? Jangan biarkan tubuhmu lelah dengan minuman tinggi pemanis buatan yang bikin gampang dehidrasi!`;
        benefitSentence = `Diracik segar menggunakan formula kaya vitamin alami, serat seimbang, serta kandungan antioksidan tinggi yang langsung melepaskan kesegaran alami untuk recharge energimu seketika. Hidup teratur tanpa lonjakan gula berlebih!`;
      } else if (category === 'food') {
        probSentence = `Pengen makan enak tapi selalu dihantui rasa bersalah karena takut program diet berantakan? Mencari sarapan atau cemilan praktis yang bikin kenyang tahan lama tanpa menimbun lemak jahat?`;
        benefitSentence = `Dibuat khusus dari bahan rendah kalori namun padat nutrisi, memberikan asupan energi bersih (clean energy) agar kamu tetap fokus beraktivitas seharian tanpa merasa lesu atau begah. Rasa lezat, fisik bugar!`;
      } else if (category === 'skincare') {
        probSentence = `Punya keluhan kulit tampak kusam, lelah, dehidrasi, atau gampang berjerawat akibat debu polusi dan ruangan AC berjam-jam? Yuk saatnya upgrade perawatan kulit wajahmu ke level premium!`;
        benefitSentence = `Menggunakan zat aktif konsentrat mikro yang meresap sempurna ke lapisan kulit terdalam untuk menghidrasi secara intensif, menenangkan kemerahan, sekaligus merangsang regenerasi sel kulit baru. Kulit terasa kenyal, cerah merona, dan plumpy alami!`;
      } else if (category === 'fashion') {
        probSentence = `Pernah merasa tidak percaya diri karena gaya baju yang gitu-gitu aja, atau tidak nyaman beraktivitas seharian karena pakaian terasa gerah dan kaku saat dipakai bergerak?`;
        benefitSentence = `Menggabungkan estetika cutting modern yang stylish dengan kualitas serat kain berteknologi tinggi. Sangat menyerap keringat, kokoh namun lembut di kulit, memberikan fleksibilitas tanpa batas bagi gayamu sehari-hari.`;
      } else if (category === 'tech') {
        probSentence = `Berapa banyak waktu berharga dan operasional harian yang terbuang sia-sia hanya untuk mengurus proses administrasi manual, laporan terpisah-pisah, serta data acak yang membingungkan?`;
        benefitSentence = `Menyederhanakan alur kerja yang rumit menjadi cerdas, otomatis, dan serba cepat. Dapat diakses kapan saja dan di mana saja untuk menghemat operasional harian sekaligus mendongkrak skalabilitas bisnismu secara signifikan!`;
      } else {
        probSentence = `Sering merasa rutinitas harian terasa lambat atau tidak efisien karena belum menemukan alat/solusi penunjang yang benar-benar pas dengan kebutuhan aktivitas harianmu?`;
        benefitSentence = `Menawarkan fungsionalitas terbaik yang dikombinasikan dengan daya tahan luar biasa serta kepraktisan luar-biasa. Menjawab kebutuhan riil Anda demi memberikan rasa bahagia dan kemudahan di setiap langkah.`;
      }

      // Platform specific CTA lines
      if (genPlatform === 'Instagram') {
        ctaSentence = `🔥 Spesial momen ini, daftarkan diri dan nikmati penawaran eksklusif: **${genGoal}**!\n\n👇 Klik Link di Bio kami untuk klaim promo & konsultasi langsung sekarang juga sebelum kehabisan slot harian ya!`;
      } else if (genPlatform === 'TikTok') {
        ctaSentence = `✨ Ambil tindakan hari ini untuk perubahan optimal! Nikmati: **${genGoal}**.\n\n👉 Buruan ketuk ikon keranjang kuning di bawah atau kunjungi link di deskripsi profil kami sekarang untuk checkout instan!`;
      } else { // Threads
        ctaSentence = `💡 Mulai langkah sehat & produktifmu sekarang! Dapatkan penawaran terbaik: **${genGoal}**.\n\nTulis pendapatmu di kolom komentar dan diskusikan bersama kami. Link promo selengkapnya tersedia di bio profil!`;
      }

      const captionOutput = `${probSentence}\n\nPerkenalkan solusi terbaik untukmu: **${genProduct}** persembahan dari **${genBrandName}**! ✨\n\n${benefitSentence}\n\n${ctaSentence}`;

      // 4. Hashtag Generator
      const cleanBrand = (genBrandName || '').replace(/[^a-zA-Z0-9]/g, '');
      const cleanProd = (genProduct || '').replace(/[^a-zA-Z0-9]/g, '');

      let industryTags = '';
      if (category === 'beverage') industryTags = '#MinumanSehat #HeathyDrinks #GlowWithMornings #FreshIngredients';
      else if (category === 'food') industryTags = '#CleanEating #MakanSehat #HealthyLifestyle #KulinerEstetik';
      else if (category === 'skincare') industryTags = '#GlowUpSkin #SkincareRutin #SkinBarriers #WajahGlowing';
      else if (category === 'fashion') industryTags = '#StyleInspiration #OOTDLocal #PremiumWear #OutfitKece';
      else if (category === 'tech') industryTags = '#SmartSolution #SystemAutomations #StartupLife #BisnisPraktis';
      else industryTags = '#PremiumProduct #KualitasAndalan #SolusiTerpercaya #DailyBooster';

      const hashtagOutput = `#${cleanBrand || 'MorningsHQ'} #${cleanProd || 'HealthyChoice'} ${industryTags} #ViralBooster`.trim();

      setGeneratedResult({
        ideas: ideasOutput,
        hook,
        caption: captionOutput,
        hashtags: hashtagOutput
      });
      setGenerating(false);
    }, 1200);
  };

  // Filter & Search Logic
  const filteredContents = contents.filter(c => {
    const matchSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (c.ideaDescription || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlatform = selectedPlatform === 'All' || c.platform === selectedPlatform;
    const matchStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchSearch && matchPlatform && matchStatus;
  });

  // Calendar specific helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday, 1 is Monday, etc.

  const getContentsForDay = (day: Date) => {
    return contents.filter(c => isSameDay(new Date(c.uploadDate), day));
  };

  // Simple stats calculation
  const totalCountThisMonth = contents.filter(c => {
    const date = new Date(c.uploadDate);
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  }).length;
  const pendingCount = contents.filter(c => c.status !== 'Posted').length;
  const postedCount = contents.filter(c => c.status === 'Posted').length;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8 rounded-3xl border border-slate-900 shadow-2xl space-y-6">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 bg-brand-purple/20 text-brand-neon rounded-xl border border-brand-purple/35 shrink-0">
              <Share2 className="w-5 h-5 text-brand-neon" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-white flex items-center gap-2">
                Social Media Planner <span className="text-xs font-mono font-bold bg-brand-purple/20 text-brand-neon px-2.5 py-1 rounded border border-brand-purple/30">DARK MODE HQ</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Mengorganisir perencanaan, checklist shoot, caption, dan booster AI untuk konten viral Mornings.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick AI Idea Trigger */}
          <button
            onClick={() => {
              setGeneratorOpen(true);
              setGeneratedResult(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-brand-neon hover:bg-brand-neon/90 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-brand-neon/10"
          >
            <Sparkle className="w-4 h-4 fill-current text-slate-950 animate-bounce" />
            AI Idea Generator
          </button>

          <button
            onClick={() => {
              setSelectedContent(null);
              setFormData({
                title: '',
                platform: 'Instagram',
                type: 'Reels',
                uploadDate: format(new Date(), 'yyyy-MM-dd'),
                status: 'Idea',
                ideaDescription: '',
                caption: '',
                cta: '',
                shootChecklist: [],
                assets: []
              });
              setNewChecklistItem('');
              setUploadedFiles([]);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-purple/95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-brand-purple/30"
          >
            <Plus className="w-4 h-4" />
            Plan Konten
          </button>
        </div>
      </div>

      {/* DASHBOARD SIMPLE STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">Bulan Ini</span>
          <p className="text-2xl font-serif font-black text-white mt-2">{totalCountThisMonth} Konten</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-1">Ditetapkan dalam kalender</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">Pending Produksi</span>
          <p className="text-2xl font-serif font-black text-amber-500 mt-2">{pendingCount}</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-1">Status Idea, Draft, Editing</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">Telah Posting</span>
          <p className="text-2xl font-serif font-black text-emerald-500 mt-2">{postedCount}</p>
          <span className="text-[9px] text-slate-500 font-semibold mt-1">Siap menghibur audiens</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">Jadwal Terdekat</span>
          <p className="text-sm font-sans font-extrabold text-brand-neon mt-2 truncate">
            {contents.filter(c => c.status !== 'Posted').sort((a,b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())[0]?.title || 'Tiada Jadwal'}
          </p>
          <span className="text-[9px] text-slate-500 font-mono mt-1">
            {contents.filter(c => c.status !== 'Posted').sort((a,b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())[0]?.uploadDate || '-'}
          </span>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Switching Modes */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'calendar' ? "bg-brand-purple text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Kalender Konten
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'list' ? "bg-brand-purple text-white shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Daftar Konten List
          </button>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 flex-1 md:max-w-xl">
          <div className="relative sm:col-span-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari konten, caption..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 focus:bg-slate-900 border border-slate-850 rounded-xl text-xs text-white outline-none transition-all placeholder:text-slate-550"
            />
          </div>

          <div className="sm:col-span-3 flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1 rounded-xl">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none w-full py-1.5 cursor-pointer"
            >
              <option value="All">PLATFORM</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1 rounded-xl">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-0 text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none w-full py-1.5 cursor-pointer"
            >
              <option value="All">STATUS</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* =======================TAB 1: CALENDAR VIEW======================= */}
        {activeTab === 'calendar' ? (
          <motion.div
            key="calendar-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Months Selector */}
            <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-850"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm sm:text-base font-serif font-black uppercase tracking-widest text-brand-neon">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-850"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/20 p-2">
              {['Mgg', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(dayName => (
                <div key={dayName} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {dayName}
                </div>
              ))}

              {/* Padding empty days for the start of the month */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[110px] bg-slate-950/20 border border-slate-900/40 rounded-xl opacity-20"
                />
              ))}

              {daysInMonth.map((day, idx) => {
                const dayContents = getContentsForDay(day);
                const isCurrentToday = isToday(day);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[110px] bg-slate-950/85 p-2 rounded-xl transition-all relative border flex flex-col justify-between group",
                      isCurrentToday ? "border-brand-purple shadow-sm shadow-brand-purple/5" : "border-slate-900/60",
                      "hover:border-slate-800 hover:bg-slate-900/20"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={cn(
                        "text-xs font-mono font-bold px-1.5 py-0.5 rounded",
                        isCurrentToday ? "bg-brand-purple text-white" : "text-slate-400"
                      )}>
                        {format(day, 'd')}
                      </span>

                      {/* Tool Addition for this day */}
                      <button
                        onClick={() => {
                          setSelectedContent(null);
                          setFormData({
                            title: '',
                            platform: 'Instagram',
                            type: 'Reels',
                            uploadDate: format(day, 'yyyy-MM-dd'),
                            status: 'Idea',
                            ideaDescription: '',
                            caption: '',
                            cta: '',
                            shootChecklist: [],
                            assets: []
                          });
                          setShowModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[10px] text-brand-neon hover:bg-slate-900 rounded transition-all cursor-pointer"
                        title="Tambah plan tanggal ini"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Day Scheduled Badges */}
                    <div className="space-y-1.5 flex-1 flex flex-col justify-start overflow-y-auto scrollbar-none pr-0.5 select-none">
                      {dayContents.map(c => {
                        let colorClass = "bg-purple-950/40 text-purple-300 border-purple-900/50";
                        if (c.platform === 'TikTok') colorClass = "bg-sky-950/40 text-sky-300 border-sky-900/50";
                        if (c.platform === 'Threads') colorClass = "bg-neutral-800 text-slate-200 border-neutral-700";

                        return (
                          <div
                            key={c.id}
                            onClick={() => handleOpenDetail(c)}
                            className={cn(
                              "px-1.5 py-1 rounded text-[9px] font-extrabold truncate border leading-normal cursor-pointer transition-all hover:scale-[1.02]",
                              colorClass,
                              c.status === 'Posted' && "opacity-50 line-through"
                            )}
                            title={`${c.platform} ${c.type}: ${c.title}`}
                          >
                            <span className="font-mono text-[8px] uppercase tracking-wide block text-[8px] opacity-75">{c.platform} • {c.type}</span>
                            {c.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* =======================TAB 2: LIST VIEW======================= */
          <motion.div
            key="list-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start"
          >
            {/* Drag and Drop simulation Columns representing Content Workflow statuses */}
            {(['Idea', 'Draft', 'Editing', 'Posted'] as const).map(status => {
              const statusContents = filteredContents.filter(c => c.status === status);
              let statusLabel = 'Ide / Inspirasi';
              let accentColor = 'bg-slate-900 text-slate-400 border-slate-800';
              if (status === 'Draft') {
                statusLabel = 'Draft Naskah';
                accentColor = 'bg-amber-955/10 text-amber-500 border-amber-900/30';
              } else if (status === 'Editing') {
                statusLabel = 'Dalam Editing';
                accentColor = 'bg-indigo-950/40 text-brand-purple border-brand-purple/20';
              } else if (status === 'Posted') {
                statusLabel = 'Telah Posting';
                accentColor = 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30';
              }

              return (
                <div key={status} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-4 min-h-[420px]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2.5 mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border", accentColor)}>
                        {status}
                      </span>
                      <h4 className="text-xs font-bold text-slate-300">{statusLabel}</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full">{statusContents.length}</span>
                  </div>

                  {/* List Container */}
                  <div className="space-y-3">
                    {statusContents.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-600 border border-dashed border-slate-850 rounded-xl">
                        Kosong
                      </div>
                    ) : (
                      statusContents.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleOpenDetail(c)}
                          className="p-3 bg-slate-950 border border-slate-900 rounded-xl hover:border-slate-750 transition-all cursor-pointer group flex flex-col justify-between min-h-[120px]"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide",
                                c.platform === 'Instagram' ? "bg-purple-950 text-purple-300 border border-purple-900" : 
                                c.platform === 'TikTok' ? "bg-sky-950 text-sky-300 border border-sky-900" : 
                                "bg-neutral-850 text-slate-300"
                              )}>
                                {c.platform}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500">{c.type}</span>
                            </div>

                            <h5 className="text-[11px] font-extrabold text-white group-hover:text-brand-neon transition-colors tracking-tight line-clamp-2 leading-relaxed">
                              {c.title}
                            </h5>
                          </div>

                          {/* Quick details */}
                          <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-550">
                            <span className="font-mono">{c.uploadDate}</span>
                            
                            <div className="flex items-center gap-1.5" onClick={(e) => {
                              e.stopPropagation(); // Prevent dialog open
                            }}>
                              {/* Quick Move Status selectors */}
                              {status !== 'Idea' && (
                                <button 
                                  onClick={() => handleMoveStatus(c.id, STATUSES[STATUSES.indexOf(status) - 1])}
                                  className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-white"
                                  title="Kembalikan status"
                                >
                                  ←
                                </button>
                              )}
                              {status !== 'Posted' && (
                                <button 
                                  onClick={() => handleMoveStatus(c.id, STATUSES[STATUSES.indexOf(status) + 1])}
                                  className="p-1 hover:bg-slate-900 rounded text-brand-neon font-black"
                                  title="Lanjutkan workflow"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI INSTANT IDEA GENERATOR PANEL */}
      {generatorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-slate-200 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setGeneratorOpen(false)}
              className="absolute right-5 top-5 p-2 bg-slate-955 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-brand-neon animate-pulse" />
              <h3 className="text-base sm:text-lg font-serif font-black tracking-wider text-white uppercase">AI Social Booster Generator</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inputs Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nama Brand Anda</label>
                  <input
                    type="text"
                    value={genBrandName}
                    onChange={(e) => setGenBrandName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:border-brand-neon outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nama Produk / Topik</label>
                  <input
                    type="text"
                    placeholder="Contoh: Mango Berry Bliss"
                    value={genProduct}
                    onChange={(e) => setGenProduct(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:border-brand-neon outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Sudut Pandang / Angle Kampanye</label>
                  <input
                    type="text"
                    placeholder="Contoh: Promo Cashback"
                    value={genGoal}
                    onChange={(e) => setGenGoal(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:border-brand-neon outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Target Media Sosial</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setGenPlatform(p)}
                        className={cn(
                          "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                          genPlatform === p 
                            ? "bg-brand-purple text-white border-brand-purple" 
                            : "bg-slate-950 text-slate-400 border-slate-850"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAIRun}
                  disabled={generating}
                  className="w-full py-3.5 bg-brand-neon hover:bg-brand-neon/90 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer text-center"
                >
                  {generating ? 'Menghubungkan ke Gemini...' : 'Kompilasikan Strategi Konten'}
                </button>
              </div>

              {/* AI outputs display */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 overflow-y-auto max-h-[350px] space-y-4">
                {generatedResult ? (
                  <div className="space-y-4 text-xs">
                    {/* Ideas Hook */}
                    <div className="p-2.5 bg-brand-purple/10 border border-brand-purple/20 rounded-xl">
                      <span className="text-[8px] font-black uppercase text-brand-neon tracking-wider block mb-1">Viral Hooks Secepat Kilat</span>
                      <p className="font-serif italic font-bold text-white text-[11px] leading-relaxed">
                        {generatedResult.hook}
                      </p>
                    </div>

                    {/* Shoot ideas */}
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-1">Skenario Rekaman Kamera (Shoot Script)</span>
                      <p className="text-slate-300 leading-relaxed font-mono text-[10px] whitespace-pre-wrap">
                        {generatedResult.ideas}
                      </p>
                    </div>

                    {/* Captions */}
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-1 font-bold">Caption Feed / Video</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-900 p-2.5 rounded-xl text-[10px] whitespace-pre-wrap border border-slate-800">
                        {generatedResult.caption}
                      </p>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-1">Boost Tagar Terpercaya</span>
                      <p className="text-brand-neon font-bold leading-relaxed text-[10px]">
                        {generatedResult.hashtags}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        // Apply results directly into Planner Creation form!
                        setFormData({
                          title: `AI Content: ${genProduct}`,
                          platform: genPlatform,
                          type: genPlatform === 'Instagram' ? 'Reels' : genPlatform === 'TikTok' ? 'Reels' : 'Feed',
                          uploadDate: format(new Date(), 'yyyy-MM-dd'),
                          status: 'Idea',
                          ideaDescription: `${generatedResult.hook}\n\nSCENE IDEAS:\n${generatedResult.ideas}`,
                          caption: generatedResult.caption,
                          cta: `Klaim promo: ${genGoal}`,
                          shootChecklist: [
                            { id: '1', text: 'Ambil shoot opening hook', done: false },
                            { id: '2', text: 'Rekam visual close up produk', done: false }
                          ],
                          assets: []
                        });
                        setGeneratorOpen(false);
                        setShowModal(true);
                      }}
                      className="w-full py-2 bg-slate-900 border border-brand-neon/20 hover:border-brand-neon text-brand-neon rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Pindahkan Ke Form Planner
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-650 py-16">
                    <Sparkles className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                    <p className="text-[10px] uppercase font-black tracking-wider">AI Studio Builder Ready</p>
                    <p className="text-[9px] text-slate-500 mt-1 max-w-[200px]">Masukkan nama brand & produk menu, lalu klik "Kompilasikan" untuk men-generate instant caption harian.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PLAN DETAILS & CREATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-slate-200 relative max-h-[95vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedContent(null);
              }}
              className="absolute right-5 top-5 p-2 bg-slate-955 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-serif font-black text-white border-b border-slate-800 pb-3 mb-5 uppercase tracking-wide">
              {selectedContent ? 'Detail & Edit Rencana Media' : 'Buat Rencana Konten Baru'}
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* LHS Inputs */}
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Judul Konten / Pitch *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Behind the Scenes menu baru"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder:text-slate-600 focus:border-brand-purple outline-none font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Platform Media</label>
                      <select
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value as SocialContent['platform'] })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none cursor-pointer"
                      >
                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Format/Jenis</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as SocialContent['type'] })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none cursor-pointer"
                      >
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tanggal Upload</label>
                      <input
                        type="date"
                        value={formData.uploadDate}
                        onChange={(e) => setFormData({ ...formData, uploadDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status Workflow</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as SocialContent['status'] })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none cursor-pointer"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Ide Detail Skenario</label>
                    <textarea
                      placeholder="Jelaskan angle rekam kamera, sound trend yang mau dipake, ref properti..."
                      value={formData.ideaDescription}
                      onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
                      rows={3.5}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-brand-purple resize-none placeholder:text-slate-650"
                    />
                  </div>
                </div>

                {/* RHS Inputs */}
                <div className="space-y-3.5">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Caption Terlampir</label>
                    <textarea
                      placeholder="Tulis draf teks caption di sini..."
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      rows={3.5}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white outline-none focus:border-brand-purple resize-none placeholder:text-slate-650"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Call to Action (CTA)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Klik tautan di bio untuk booking menu!"
                      value={formData.cta}
                      onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder:text-slate-650 focus:border-brand-purple outline-none"
                    />
                  </div>

                  {/* Checklist Shoot */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Checklist Pengambilan Gambar (Shoot)</label>
                    
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Tambah task scene rekam..."
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChecklist();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddChecklist}
                        className="px-3 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-[10px] font-black uppercase transition-colors"
                      >
                        Tambah
                      </button>
                    </div>

                    {/* Checklist items log */}
                    <div className="max-h-[110px] overflow-y-auto space-y-1.5 scrollbar-thin">
                      {formData.shootChecklist.length === 0 ? (
                        <span className="text-[9px] text-slate-600 italic">Belum ada scene rekaman ditambahkan.</span>
                      ) : (
                        formData.shootChecklist.map(item => (
                          <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 bg-slate-950 rounded-lg border border-slate-850">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleChecklistItem(item.id)}
                                className="text-brand-neon hover:text-brand-neon/80"
                              >
                                {item.done ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-600" />}
                              </button>
                              <span className={cn("text-[10px]", item.done && "line-through text-slate-500", !item.done && "text-slate-300")}>
                                {item.text}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeChecklistItem(item.id)}
                              className="text-[9px] text-slate-500 hover:text-rose-400 font-extrabold"
                            >
                              Hapus
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom control row */}
              <div className="border-t border-slate-850 pt-4 flex flex-col sm:flex-row gap-3.5 justify-between items-center bg-transparent mt-6">
                <div>
                  {selectedContent && (
                    <button
                      type="button"
                      onClick={() => handleDeleteContent(selectedContent.id)}
                      className="text-xs text-rose-500 hover:text-rose-400 font-black uppercase tracking-widest px-3 py-1.5 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border border-rose-550/15"
                    >
                      Hapus Plan
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedContent(null);
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-950 hover:bg-slate-905 border border-slate-850 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-brand-purple/20"
                  >
                    Simpan Plan
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
