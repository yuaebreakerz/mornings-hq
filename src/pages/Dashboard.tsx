import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Loader2,
  Clock,
  Truck,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { productService } from '../services/googleService';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import ReceiptGenerator from '../components/ReceiptGenerator';

export default function Dashboard() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [soldOutProducts, setSoldOutProducts] = useState<any[]>([]);
  const [heroContent, setHeroContent] = useState<any>(null);

  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [products, orders, hero] = await Promise.all([
          productService.getAll().catch(err => {
            console.error('Failed to load products:', err);
            return null;
          }),
          productService.getOrders().catch(err => {
            console.error('Failed to load orders:', err);
            return null;
          }),
          productService.getHero().catch(err => {
            console.error('Failed to load hero:', err);
            return null;
          })
        ]);
        
        // If at least one succeeded, we consider it "online" but maybe partial
        if (products !== null || orders !== null || hero !== null) {
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }

        if (hero) {
          setHeroContent(hero);
        }
        
        // Calculate dynamic stats
        if (orders && Array.isArray(orders)) {
          const today = new Date().toISOString().split('T')[0];
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          
          const completed = orders.filter((o: any) => o && o.status === 'completed').length;
          const pending = orders.filter((o: any) => o && o.status === 'pending').length;
          const todays = orders.filter((o: any) => o && (o.delivery_date || '').startsWith(today)).length;
          const tomorrows = orders.filter((o: any) => o && (o.delivery_date || '').startsWith(tomorrow)).length;
          
          setStats({
            completedCount: completed,
            pendingCount: pending,
            todaysDeliveries: todays,
            tomorrowsDeliveries: tomorrows
          });
          
          // Sort orders by id or date descending
          const sortedOrders = [...orders].slice(-5).reverse();
          setRecentOrders(sortedOrders);
        }

        if (products && Array.isArray(products)) {
          setSoldOutProducts(products.filter((p: any) => p.active === false || p.active === 'FALSE'));
        }
        
      } catch (err) {
        setIsOnline(false);
        console.error('Dashboard general fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '-';
    try {
      // Check if it's just a time like T07:00:00.000Z
      if (dateStr.startsWith('T')) {
        const hms = dateStr.slice(1, 9); // 07:00:00
        return hms;
      }
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const statCards = [
    { label: 'Pesanan Selesai', value: stats?.completedCount || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 shadow-emerald-200/20' },
    { label: "Pengiriman Hari Ini", value: stats?.todaysDeliveries || 0, color: 'text-brand-purple', bg: 'bg-brand-purple/5 shadow-brand-purple/20' },
    { label: "Besok (H-1)", value: stats?.tomorrowsDeliveries || 0, color: 'text-blue-600', bg: 'bg-blue-50 shadow-blue-200/20' },
    { label: 'Pesanan Baru (Pending)', value: stats?.pendingCount || 0, color: 'text-rose-600', bg: 'bg-rose-50 shadow-rose-200/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-serif font-black text-slate-900">Dashboard</h2>
          <div className="flex items-center gap-2">
            {heroContent && (
              <div className={cn(
                "px-2 sm:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm",
                (heroContent.toko_buka === true || String(heroContent.toko_buka).toLowerCase() === 'true')
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : "bg-rose-500 text-white shadow-rose-500/20"
              )}>
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {(heroContent.toko_buka === true || String(heroContent.toko_buka).toLowerCase() === 'true')
                  ? (heroContent.teks_buka || 'BUKA')
                  : (heroContent.teks_libur || 'LIBUR')}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-slate-100 rounded-full shadow-sm">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isOnline === true ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" : 
                isOnline === false ? "bg-rose-500" : "bg-slate-300"
              )} />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-slate-600">
                {isOnline === true ? 'API Connected' : 
                 isOnline === false ? 'API Error' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min lg:auto-rows-[120px]">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="col-span-12 sm:col-span-6 lg:col-span-3 lg:row-span-1 glass-card p-4 sm:p-5 flex flex-col justify-between"
          >
            <span className="text-slate-700 text-[10px] font-bold uppercase tracking-[0.1em]">{stat.label}</span>
            <div className="flex items-end justify-between mt-1 sm:mt-2 lg:mt-0">
               <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</span>
               <div className={cn("px-2 py-0.5 rounded-full", stat.bg, stat.color)}>
                  <span className="text-[10px] font-bold">Status Live</span>
               </div>
            </div>
          </motion.div>
        ))}

        {/* Large List Section */}
        <div className="col-span-12 lg:col-span-8 lg:row-span-5 glass-card overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white gap-4">
            <h3 className="font-serif font-black text-slate-900 text-xs sm:text-sm">Aktivitas Pelanggan</h3>
            <Link to="/orders" className="text-[9px] sm:text-[10px] font-black text-brand-purple uppercase tracking-widest hover:underline flex items-center gap-1 group shrink-0">
               Lihat Semua 
               <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            {recentOrders.length > 0 ? (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{order.customer_name}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-tight">{order.whatsapp_number}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ReceiptGenerator order={order} variant="icon" />
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                            order.status === 'completed' ? "bg-brand-neon text-brand-purple" : 
                            order.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                          <Clock className="w-3 h-3" />
                          <span className="whitespace-nowrap">{formatDate(order.delivery_date)}</span>
                        </div>
                        <div className="font-black text-slate-900 text-xs">Rp {order.total_amount?.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop Table View */}
                <table className="hidden sm:table w-full text-sm text-left">
                  <thead className="bg-slate-50/80 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Pelanggan</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Pengiriman</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Total</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{order.customer_name}</div>
                          <div className="text-[10px] text-slate-700 uppercase tracking-tighter">{order.whatsapp_number}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-slate-600 font-medium whitespace-nowrap">
                              <Clock className="w-3 h-3 text-slate-600" />
                              {formatDate(order.delivery_date)}
                           </div>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900">Rp {order.total_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className={cn(
                              "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                              order.status === 'completed' ? "bg-brand-neon text-brand-purple" : 
                              order.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            )}>
                              {order.status}
                            </span>
                            <ReceiptGenerator order={order} variant="icon" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="p-10 sm:p-20 text-center text-slate-600 text-sm">Tidak ada pesanan terbaru.</div>
            )}
          </div>
        </div>

        {/* Action / Mini Info Sections */}
         <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-3 glass-card p-6 sm:p-8 flex flex-col justify-between min-h-[180px] sm:min-h-[220px]">
            <div>
              <h3 className="font-serif font-black text-slate-900 text-base sm:text-lg mb-1 sm:mb-2 leading-tight">Perencanaan Produksi</h3>
              <p className="text-slate-600 text-[10px] sm:text-xs leading-relaxed font-medium">Berdasarkan konfirmasi pre-order pelanggan untuk pemenuhan H-1.</p>
            </div>
            
            <div className="space-y-3 mt-4 sm:mt-6 lg:mt-0">
               <Link to="/production" className="btn-primary w-full block text-center py-2.5 sm:py-3 flex items-center justify-center gap-2 group text-xs">
                  <span>Rekap Kebutuhan</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
         </div>

         <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:row-span-2 glass-card p-6 sm:p-8 flex flex-col justify-between min-h-[130px] sm:min-h-[150px]">
          <div>
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Logistik</h4>
            <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
               <div className="p-1.5 sm:p-2 bg-brand-purple/10 rounded-xl">
                 <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-brand-purple" />
               </div>
               <span className="text-base sm:text-lg font-black text-slate-900">Daftar Kirim</span>
            </div>
          </div>
          <Link to="/orders" className="btn-secondary w-full block text-center py-2.5 sm:py-3 text-[10px] uppercase tracking-widest mt-3 sm:mt-4">
             Kelola Pengiriman
          </Link>
         </div>

         <div className="col-span-12 lg:col-span-4 lg:row-span-2 glass-card p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Status Stok (Sold Out)</h4>
              <Link to="/products" className="text-[10px] font-black text-brand-purple uppercase tracking-widest hover:underline">Kelola</Link>
            </div>
            
            <div className="space-y-2 sm:space-y-3 overflow-auto max-h-[100px] sm:max-h-[120px] pr-2">
                   {soldOutProducts.length > 0 ? (
                 soldOutProducts.map(p => (
                   <div key={p.id} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-slate-50 last:border-0">
                      <span className="text-xs font-bold text-slate-700 truncate mr-2">{p.name}</span>
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-[10px] font-bold uppercase whitespace-nowrap">Sold Out</span>
                   </div>
                 ))
               ) : (
                 <div className="flex items-center gap-2 py-4 justify-center text-slate-300">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                    <span className="text-xs font-medium">Semua menu aktif</span>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any = {}) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
