import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Truck,
  Megaphone,
  Package,
  BookOpen,
  Book,
  Bell,
  Smartphone,
  Tablet,
  Download,
  Sparkles,
  Volume2,
  CheckCircle2,
  Info,
  Code2,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../components/NotificationProvider';
import { cn, getGoogleDriveUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BRAND_NAME, METADATA, BRAND_LOGO } from '../constants';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'POS & Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Production', href: '/production', icon: Truck },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Menu Recipes', href: '/recipes', icon: Book },
  { name: 'Promo & Banners', href: '/banners', icon: Megaphone },
  { name: 'Hero Section', href: '/hero', icon: ImageIcon },
  { name: 'About Us', href: '/about', icon: BookOpen },
  { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  { name: 'Dev Tracker', href: '/dev-tracker', icon: Code2 },
  { name: 'Social Planner', href: '/social-planner', icon: CalendarDays },
  { name: 'Site Config', href: '/settings', icon: Settings },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const { signOut, user } = useAuth();
  const { 
    permissionStatus, 
    isPWAInstalled,
    requestPermission, 
    triggerTestNotification,
    lastNotifications 
  } = useNotifications();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 sm:w-72 sidebar-glass flex flex-col transform transition-transform duration-500 lg:relative lg:translate-x-0 outline-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-4 sm:p-8">
          <div className="flex items-center gap-2 mb-6 sm:mb-10 px-2 group">
            <img 
               src={getGoogleDriveUrl(BRAND_LOGO)} 
               alt={BRAND_NAME} 
               className="h-8 sm:h-12 w-auto object-contain" 
               referrerPolicy="no-referrer"
               onError={(e) => {
                 (e.currentTarget as HTMLImageElement).style.display = 'none';
               }}
            />
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-black text-white">HQ</span>
              <div className="w-1.5 h-1.5 bg-brand-neon rounded-full" />
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "sidebar-link",
                  isActive && "active"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 transition-colors" />
                <span className="text-xs sm:text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-6">
            <div className="p-3 rounded-lg bg-white/10 flex items-center gap-3 overflow-hidden">
               <div className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0" />
               <div className="overflow-hidden">
                 <p className="text-xs font-bold truncate text-white">Admin User</p>
                 <p className="text-[10px] text-white/60 truncate">{user?.email}</p>
               </div>
            </div>
            <button
               onClick={() => signOut()}
               className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-slate-50 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 sm:p-3 bg-white shadow-sm text-slate-900 rounded-xl sm:rounded-2xl"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-brand-purple" />
          </button>
          
          <div className="flex flex-col lg:block flex-1 ml-3 lg:ml-0 overflow-hidden">
            <h2 className="text-sm sm:text-xl lg:text-3xl font-serif font-black text-black tracking-tight truncate">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
            <p className="hidden md:block text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">Live Sync • {METADATA.url ? new URL(METADATA.url).hostname : 'web'}</p>
          </div>

          <div className="flex items-center gap-2 lg:gap-5 relative">
            <button 
              onClick={() => setShowStatus(!showStatus)}
              className="relative p-2 sm:p-3 bg-white shadow-sm border border-slate-200 rounded-xl sm:rounded-2xl text-slate-600 hover:text-brand-purple hover:scale-105 transition-all outline-none cursor-pointer"
              title="Notifikasi & Pusat Aplikasi"
            >
               <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-brand-purple" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-brand-neon rounded-full border border-white" />
            </button>

            <AnimatePresence>
              {showStatus && (
                <>
                  <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowStatus(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card p-5 sm:p-6 shadow-2xl z-50 overflow-hidden bg-white border border-slate-200 rounded-3xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-purple" />
                        <h4 className="text-xs sm:text-sm font-serif font-black text-slate-900">Pusat Aplikasi & Notifikasi</h4>
                      </div>
                      <span className="text-[8px] font-black uppercase bg-brand-purple/5 text-brand-purple px-2 py-0.5 rounded border border-brand-purple/10">Active Device</span>
                    </div>

                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                      
                      {/* Active Push-Notification Authorization Card */}
                      <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Izin Push Notifications</span>
                          {permissionStatus === 'granted' ? (
                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">AKTIF</span>
                          ) : permissionStatus === 'denied' ? (
                            <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">DIBLOKIR</span>
                          ) : (
                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">PENDING</span>
                          )}
                        </div>

                        {permissionStatus === 'granted' ? (
                          <p className="text-[10px] text-slate-600 leading-relaxed">
                            ✓ Tablet & HP Android Anda siap menerima pemberitahuan otomatis order baru dengan sistem bersuara.
                          </p>
                        ) : (
                          <div>
                            <p className="text-[10px] text-slate-600 leading-relaxed mb-2.5">
                              Pemberitahuan belum diizinkan. Aktifkan agar HP/Tablet Anda otomatis berdering saat order baru masuk!
                            </p>
                            <button
                              onClick={() => requestPermission()}
                              className="w-full py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              Izinkan Notifikasi Di Sini
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Floating Test Actions */}
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Uji Coba Notifikasi Sistem & Order</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => triggerTestNotification('system')}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                            Tes Sistem
                          </button>
                          <button
                            onClick={() => triggerTestNotification('new_order')}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-brand-purple/5 border border-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
                            Tes Orderan Baru
                          </button>
                        </div>
                      </div>

                      {/* Android / Tablet Installation Guide */}
                      <div className="p-4 bg-brand-purple/5 border border-brand-purple/10 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="w-4 h-4 text-brand-purple" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-brand-purple">Pasang Aplikasi di Tablet / Android</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed mb-3">
                          Aplikasi Mornings HQ dikonfigurasi ganda agar dapat dinikmati secara instan (PWA) maupun sebagai file APK native:
                        </p>
                        
                        <div className="space-y-3.5 text-[10px] font-medium text-slate-700">
                          <div className="border-l-2 border-brand-purple pl-2.5">
                            <span className="font-extrabold text-slate-900 block text-[9px] uppercase tracking-wide">METODE 1: Instant PWA (Cara Rekomendasi ✭)</span>
                            <ol className="list-decimal list-inside space-y-1 mt-1 text-[9px] text-slate-600 leading-normal">
                              <li>Buka halaman web ini di browser <span className="font-bold text-brand-purple">Google Chrome</span> Android Anda.</li>
                              <li>Ketuk menu titik tiga <span className="font-bold">(⋮)</span> di kanan atas halaman Chrome.</li>
                              <li>Pilih menu <span className="font-bold text-slate-900">"Tambahkan ke Layar Utama"</span> atau <span className="font-bold text-slate-900">"Instal Aplikasi"</span>.</li>
                              <li>Aplikasi akan langsung muncul sebagai shortcut mandiri ber-ikon di handphone & tablet Anda dengan performa full-screen layaknya APK!</li>
                            </ol>
                          </div>

                          <div className="border-l-2 border-slate-300 pl-2.5">
                            <span className="font-extrabold text-slate-900 block text-[9px] uppercase tracking-wide">METODE 2: File APK Mandiri (Capacitor Build)</span>
                            <p className="text-[9px] text-slate-600 leading-normal mt-1 mb-1.5">
                              Sistem Capacitor telah terpasang di source code. Tim IT atau developer Anda dapat mengompilasi APK melalui baris perintah berikut:
                            </p>
                            <code className="block bg-slate-900 text-white p-2.5 rounded-lg text-[8px] font-mono whitespace-pre overflow-x-auto leading-relaxed">
                              # 1. Jalankan build produksi web
                              {"\n"}npm run build
                              {"\n"}# 2. Inisiasi sinkronisasi Android
                              {"\n"}npx cap add android
                              {"\n"}npx cap sync
                              {"\n"}# 3. Compile file debug/release APK
                              {"\n"}npx cap open android
                            </code>
                            <p className="text-[8px] text-slate-500 mt-2 leading-snug">
                              *Instruksi di atas akan membuka Android Studio untuk memproduksi file <code className="font-mono text-brand-purple bg-brand-purple/5 px-1 font-bold">.apk</code> untuk dibagikan secara lokal di tablet dapur Anda.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Network & Service Health Status */}
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Status Server & IoT</span>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="flex-1">
                              <p className="text-[9px] font-black uppercase text-slate-800 leading-none">Google Sheets Sync</p>
                              <p className="text-[8px] text-slate-500 font-bold">Stable • Latency 140ms</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div className="flex-1">
                              <p className="text-[9px] font-black uppercase text-slate-800 leading-none">Database Engine</p>
                              <p className="text-[8px] text-slate-500 font-bold">All sheets operational</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Log of Triggered Alerts */}
                      {lastNotifications.length > 0 && (
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Riwayat Bell Terakhir ({lastNotifications.length})</span>
                          <div className="space-y-2 max-h-[160px] overflow-y-auto">
                            {lastNotifications.map((n) => (
                              <div key={n.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-[9px] font-black text-slate-800 truncate">{n.title}</span>
                                  <span className="text-[8px] font-bold text-slate-400 shrink-0">
                                    {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-500 leading-relaxed">{n.body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
