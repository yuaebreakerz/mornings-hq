import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Loader2,
  Clock,
  Truck,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileDown,
  Calendar,
  Award,
  ShoppingBag,
  BarChart2,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { productService } from '../services/googleService';
import { cn, parseItems } from '../lib/utils';
import { Link } from 'react-router-dom';
import ReceiptGenerator from '../components/ReceiptGenerator';

export default function Dashboard() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [soldOutProducts, setSoldOutProducts] = useState<any[]>([]);
  const [heroContent, setHeroContent] = useState<any>(null);

  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filterRange, setFilterRange] = useState<'today' | '7days' | 'month' | 'all'>('all');

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
          setAllOrders(orders);
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

  // Dynamic metrics calculator based on range selection
  const financeStats = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const rangeMs = filterRange === 'today' ? 1 * 86400000 : filterRange === '7days' ? 7 * 86400000 : 30 * 86400000;
    const sinceDate = new Date(Date.now() - rangeMs);

    const filtered = allOrders.filter((o: any) => {
      if (!o || !o.created_at) return false;
      if (filterRange === 'all') return true;
      
      const orderDate = new Date(o.created_at);
      const orderDateStr = o.created_at.split('T')[0];

      if (filterRange === 'today') {
        return orderDateStr === todayStr;
      }
      return orderDate >= sinceDate;
    });

    let totalCompletedRev = 0;
    let totalPendingRev = 0;
    let completedCount = 0;
    let pendingCount = 0;

    filtered.forEach((o: any) => {
      const amt = Number(o.total_amount || 0);
      if (o.status === 'completed' || o.status === 'selesai') {
        totalCompletedRev += amt;
        completedCount++;
      } else if (o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready' || o.status === 'diproses' || o.status === 'siap') {
        totalPendingRev += amt;
        pendingCount++;
      }
    });

    const averageOrderValue = completedCount > 0 ? Math.round(totalCompletedRev / completedCount) : 0;

    return {
      totalCompletedRev,
      totalPendingRev,
      completedCount,
      pendingCount,
      averageOrderValue,
      totalCount: filtered.length
    };
  }, [allOrders, filterRange]);

  // Top products calculator
  const bestsellerProducts = React.useMemo(() => {
    const productCounts: Record<string, { qty: number; revenue: number }> = {};
    
    allOrders.forEach((o: any) => {
      // Aggregate for successfully completed or confirmed items to show popularity safely
      if (o.status === 'completed' || o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready' || o.status === 'selesai') {
        const items = parseItems(o.items);
        items.forEach((item: any) => {
          if (item && item.name) {
            const name = item.name;
            const qty = Number(item.qty || 0);
            const price = Number(item.price || 0);
            if (productCounts[name]) {
              productCounts[name].qty += qty;
              productCounts[name].revenue += qty * price;
            } else {
              productCounts[name] = { qty, revenue: qty * price };
            }
          }
        });
      }
    });

    return Object.entries(productCounts)
      .map(([name, stats]) => ({
        name,
        qty: stats.qty,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5); // top 5
  }, [allOrders]);

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

  const handleExportCSV = () => {
    if (allOrders.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor!");
      return;
    }

    try {
      const headers = [
        "Nomor Invoice",
        "Nama Customer",
        "No WhatsApp",
        "Tanggal Transaksi",
        "Tanggal Pengiriman",
        "Jam Pengiriman",
        "Metode Pengiriman",
        "Alamat",
        "Item Pesanan",
        "Total Nominal (Rp)",
        "Status",
        "Catatan"
      ];

      const csvRows = [headers.join(",")];

      allOrders.forEach((o: any) => {
        const itemsStr = parseItems(o.items)
          .map((item: any) => `${item.name} (${item.qty}x)`)
          .join(" | ");

        const createdDate = o.created_at ? format(new Date(o.created_at), 'yyyy-MM-dd HH:mm') : '-';
        const deliveryDate = o.delivery_date ? format(new Date(o.delivery_date), 'yyyy-MM-dd') : '-';

        const row = [
          `"${o.order_number || o.id || ''}"`,
          `"${(o.customer_name || '').replace(/"/g, '""')}"`,
          `"${o.whatsapp_number || ''}"`,
          `"${createdDate}"`,
          `"${deliveryDate}"`,
          `"${o.delivery_time || ''}"`,
          `"${o.delivery_method || ''}"`,
          `"${(o.delivery_address || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${itemsStr.replace(/"/g, '""')}"`,
          o.total_amount || 0,
          `"${o.status || ''}"`,
          `"${(o.order_notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];

        csvRows.push(row.join(","));
      });

      const csvString = csvRows.join("\n");
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `laporan-penjualan-mornings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert("Gagal mengekspor laporan: " + String(e));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
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

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-brand-purple/10 cursor-pointer self-start sm:self-auto hover:scale-[1.01] active:scale-[0.99]"
        >
          <FileDown className="w-4 h-4 text-brand-neon animate-bounce" />
          Ekspor CSV
        </button>
      </div>

      {/* Financial & Best-Seller Analytics Row */}
      <div className="grid grid-cols-12 gap-6">
        {/* Financial Overview Card */}
        <div className="col-span-12 lg:col-span-8 glass-card p-6 sm:p-8 bg-white border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-purple/5 text-brand-purple rounded-xl">
                <BarChart2 className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <h3 className="font-serif font-black text-brand-purple text-sm sm:text-base">Kinerja Finansial</h3>
                <p className="text-[10px] text-slate-500 font-medium">Laporan omset & efisiensi keranjang belanja ritual pagi</p>
              </div>
            </div>

            {/* Date-Range Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              {(['today', '7days', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setFilterRange(range)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer",
                    filterRange === range 
                      ? "bg-white text-brand-purple shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {range === 'today' ? 'Hari Ini' :
                   range === '7days' ? 'H-7' :
                   range === 'month' ? 'Bulan Ini' : 'Semua'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Omset Selesai */}
            <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Omset Selesai (Nett)
                </span>
                <p className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight mt-3">
                  Rp {financeStats.totalCompletedRev.toLocaleString()}
                </p>
              </div>
              <p className="text-[9px] text-emerald-600 font-bold mt-2">
                ✓ {financeStats.completedCount} Pesanan Selesai
              </p>
            </div>

            {/* Pendapatan Tertunda */}
            <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Omset Antrean (Pipe)
                </span>
                <p className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight mt-3">
                  Rp {financeStats.totalPendingRev.toLocaleString()}
                </p>
              </div>
              <p className="text-[9px] text-amber-600 font-bold mt-2">
                ⏳ {financeStats.pendingCount} Pesanan Diproses
              </p>
            </div>

            {/* Rata-rata Keranjang */}
            <div className="p-5 bg-brand-purple/5 border border-brand-purple/10 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-purple flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-purple" /> Nilai Keranjang (AOV)
                </span>
                <p className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-tight mt-3">
                  Rp {financeStats.averageOrderValue.toLocaleString()}
                </p>
              </div>
              <p className="text-[9px] text-brand-purple font-bold mt-2">
                ★ Rata-rata nominal per transaksi
              </p>
            </div>
          </div>
        </div>

        {/* Top 5 Products Card */}
        <div className="col-span-12 lg:col-span-4 glass-card p-6 sm:p-8 bg-white border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2 bg-brand-neon/20 text-brand-purple rounded-xl">
                <Award className="w-5 h-5 text-brand-purple" />
              </div>
              <div>
                <h3 className="font-serif font-black text-brand-purple text-sm sm:text-base">Menu Terlaris</h3>
                <p className="text-[10px] text-slate-500 font-medium">Menu ritual sehat favorit pelanggan Anda</p>
              </div>
            </div>

            <div className="space-y-4">
              {bestsellerProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Belum ada komparasi penjualan.</div>
              ) : (
                bestsellerProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border",
                        idx === 0 ? "bg-brand-purple text-brand-neon border-brand-purple" : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700 truncate">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-brand-purple bg-brand-purple/5 px-2 py-0.5 rounded border border-brand-purple/10">
                      {p.qty} Cup
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center gap-2.5 mt-4">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <p className="text-[9px] text-slate-500 font-medium leading-tight">Dihitung otomatis secara realtime berdasarkan seluruh pesanan aktif dengan status valid.</p>
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
