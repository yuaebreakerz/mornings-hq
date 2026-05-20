import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Calendar as CalendarIcon, 
  ChefHat, 
  TrendingUp, 
  Loader2, 
  PackageCheck,
  Book,
  Plus,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn, parseItems, formatTime } from '../lib/utils';
import { productService } from '../services/googleService';

const PRODUCT_CHECKLISTS: Record<string, { ingredients: string[]; packaging: string[] }> = {
  'oatshine overnight oats': {
    ingredients: ['Gandum', 'Susu', 'Mornings Blend Essence', 'Chia', 'Topping'],
    packaging: ['Wadah 400ml/300ml', 'Sticker Label Atas dan Samping', 'Sendok Kayu', 'Label Tanggal Produksi']
  },
  'ube cheese cake': {
    ingredients: ['Adonan Ubi', 'Krim Cheese', 'Adonan Biskuit'],
    packaging: ['Wadah 200ml', 'Sticker Label Atas', 'Sendok Kayu', 'Label Tanggal Produksi']
  },
  'arcane turmericalatte': {
    ingredients: ['Kunyit Bubuk', 'Susu', 'Gula Aren Bubuk', 'Air Panas'],
    packaging: ['Wadah 250ml', 'Sticker Label Samping', 'Label Tanggal Produksi']
  }
};

export default function Production() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [needs, setNeeds] = useState<{ name: string; qty: number; ready: number; remaining: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [orderSource, setOrderSource] = useState<Record<string, { customer: string; qty: number; time: string; notes: string; status: string; price: number }[]>>({});

  // Local state for checklists
  const [checklists, setChecklists] = useState<Record<string, Record<string, boolean>>>({});

  const getChecklistForProduct = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('oatshine')) return PRODUCT_CHECKLISTS['oatshine overnight oats'];
    if (lowerName.includes('ube')) return PRODUCT_CHECKLISTS['ube cheese cake'];
    if (lowerName.includes('turmerica')) return PRODUCT_CHECKLISTS['arcane turmericalatte'];
    return PRODUCT_CHECKLISTS[lowerName];
  };

  const toggleCheck = (productName: string, item: string) => {
    setChecklists(prev => ({
      ...prev,
      [productName]: {
        ...(prev[productName] || {}),
        [item]: !(prev[productName]?.[item])
      }
    }));
  };

  useEffect(() => {
    fetchProductionNeeds();
  }, [selectedDate]);

  async function fetchProductionNeeds() {
    setLoading(true);
    try {
      const orders = await productService.getOrders();
      if (orders && Array.isArray(orders)) {
        const productionStatuses = ['confirmed', 'preparing', 'ready', 'dikonfirmasi', 'konfirmasi', 'diproses', 'siap kirim', 'siap'];
        const readyStatuses = ['ready', 'siap kirim', 'siap', 'selesai', 'completed'];
        
        const dateOrders = orders.filter((o: any) => {
          if (!o || !o.delivery_date || !o.status) return false;
          
          let orderDate = '';
          try {
            orderDate = format(new Date(o.delivery_date), 'yyyy-MM-dd');
          } catch (e) {
            orderDate = String(o.delivery_date);
          }

          return (
            orderDate === selectedDate && 
            productionStatuses.includes(o.status.toLowerCase())
          );
        });

        const itemsMap: Record<string, { total: number; ready: number; price: number }> = {};
        const sourceMap: Record<string, { customer: string; qty: number; time: string; notes: string; status: string; price: number }[]> = {};
        
        dateOrders.forEach((o: any) => {
          if (!o || !o.items) return;
          const items = parseItems(o.items);
          const isReady = readyStatuses.includes(o.status.toLowerCase());
          
          items.forEach((item: any) => {
            if (item && item.name) {
              if (!itemsMap[item.name]) {
                itemsMap[item.name] = { total: 0, ready: 0, price: item.price || 0 };
                sourceMap[item.name] = [];
              }
              itemsMap[item.name].total += (item.qty || 0);
              if (isReady) {
                itemsMap[item.name].ready += (item.qty || 0);
              }
              
              sourceMap[item.name].push({
                customer: o.customer_name || 'Tanpa Nama',
                qty: item.qty || 0,
                time: formatTime(o.delivery_time),
                notes: o.order_notes || '-',
                status: o.status,
                price: item.price || 0
              });
            }
          });
        });

        setOrderSource(sourceMap);
        setNeeds(Object.entries(itemsMap || {}).map(([name, stats]) => ({ 
          name: String(name), 
          qty: stats.total,
          ready: stats.ready,
          remaining: stats.total - stats.ready
        })));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-serif font-black text-brand-purple">Rekap Produksi</h1>
            <p className="text-slate-600 text-[10px] sm:text-sm font-medium">Perencanaan ritual produksi H-1 untuk kepuasan pelanggan.</p>
          </div>
          <button 
            onClick={() => navigate('/recipes')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-brand-purple/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-purple hover:bg-brand-purple hover:text-white transition-all shadow-sm"
          >
            <Book className="w-4 h-4" />
            Lihat Resep
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white shadow-lg shadow-brand-purple/5 w-fit">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-purple ml-1 sm:ml-2" />
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none bg-transparent font-black text-brand-purple text-xs sm:text-base focus:ring-0 outline-none pr-2 sm:pr-4"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Needs List */}
        <div className="col-span-12 lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-4 sm:p-8 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-brand-purple/5 rounded-xl sm:rounded-2xl">
                  <ChefHat className="w-5 h-5 sm:w-8 sm:h-8 text-brand-purple" />
                </div>
                <h3 className="font-serif font-black text-brand-purple text-sm sm:text-lg">Daftar Persiapan</h3>
              </div>
              <span className="text-[8px] sm:text-[10px] font-black text-brand-purple bg-brand-neon px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl uppercase tracking-widest shadow-sm">
                {(() => {
                  try {
                    return format(new Date(selectedDate), 'EEEE, MMM dd');
                  } catch (e) {
                    return selectedDate;
                  }
                })()}
              </span>
            </div>

            <div className="p-0">
              {loading ? (
                <div className="p-10 sm:p-20 flex justify-center">
                    <Loader2 className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-brand-purple" />
                </div>
              ) : needs.length > 0 ? (
                <>
                  {/* Mobile View */}
                  <div className="block sm:hidden divide-y divide-slate-100">
                    {needs.map((item, idx) => (
                      <div key={idx} className="p-0 transition-colors">
                        <div 
                          className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/50" 
                          onClick={() => setExpandedProduct(expandedProduct === item.name ? null : item.name)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                               {expandedProduct === item.name ? <Circle className="w-3 h-3 fill-brand-purple text-brand-purple" /> : <TrendingUp className="w-3 h-3 text-brand-purple" />}
                               <span className="font-serif font-black text-slate-900 text-sm">{item.name}</span>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                              item.remaining > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                              {item.remaining === 0 ? '✓ BERES' : `${item.remaining} LAGI`}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                             <span>Total: {item.qty}</span>
                             <span>Siap: {item.ready}</span>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedProduct === item.name && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-slate-50 overflow-hidden"
                            >
                              <div className="p-4 space-y-6">
                                {getChecklistForProduct(item.name) && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-brand-purple">Bahan Baku</p>
                                      <div className="space-y-1.5">
                                        {getChecklistForProduct(item.name)!.ingredients.map(ing => (
                                          <div key={ing} onClick={() => toggleCheck(item.name, ing)} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                                            {checklists[item.name]?.[ing] ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Circle className="w-3 h-3 text-slate-300" />}
                                            <span className={cn(checklists[item.name]?.[ing] && "line-through opacity-50")}>{ing}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[9px] font-black uppercase tracking-widest text-brand-purple">Packaging</p>
                                      <div className="space-y-1.5">
                                        {getChecklistForProduct(item.name)!.packaging.map(pkg => (
                                          <div key={pkg} onClick={() => toggleCheck(item.name, pkg)} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                                            {checklists[item.name]?.[pkg] ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Circle className="w-3 h-3 text-slate-300" />}
                                            <span className={cn(checklists[item.name]?.[pkg] && "line-through opacity-50")}>{pkg}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Daftar Customer</p>
                                  {orderSource[item.name]?.map((source, sIdx) => (
                                    <div key={sIdx} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                                       <div className="flex justify-between font-bold text-slate-900 text-xs text-brand-purple italic">
                                          <span>{source.customer}</span>
                                          <span className="font-black">x{source.qty}</span>
                                       </div>
                                       {source.notes !== '-' && (
                                         <div className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                                            Note: {source.notes}
                                         </div>
                                       )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <table className="hidden sm:table w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Nama Menu</th>
                        <th className="px-4 py-5 text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] text-center">Total</th>
                        <th className="px-4 py-5 text-[10px] font-black text-brand-purple uppercase tracking-[0.2em] text-center">Siap</th>
                        <th className="px-8 py-5 text-[10px] font-black text-brand-purple uppercase tracking-[0.2em] text-right">Sisa Produksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-lg">
                      {needs.map((item, idx) => (
                        <React.Fragment key={idx}>
                          <tr 
                            onClick={() => setExpandedProduct(expandedProduct === item.name ? null : item.name)}
                            className="hover:bg-brand-purple/[0.02] transition-colors group cursor-pointer"
                          >
                            <td className="px-8 py-6 font-serif font-black text-brand-purple text-lg">
                              <div className="flex items-center gap-3">
                                {expandedProduct === item.name ? <Circle className="w-4 h-4 fill-brand-purple text-brand-purple" /> : <TrendingUp className="w-4 h-4" />}
                                {item.name}
                              </div>
                            </td>
                            <td className="px-4 py-6 text-center font-bold text-slate-400">
                              {item.qty}
                            </td>
                            <td className="px-4 py-6 text-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-black",
                                item.ready > 0 ? "bg-brand-neon text-brand-purple" : "bg-slate-100 text-slate-400"
                              )}>
                                {item.ready}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className={cn(
                                "font-black text-xl",
                                item.remaining > 0 ? "text-slate-900" : "text-emerald-500"
                              )}>
                                {item.remaining === 0 ? '✓' : item.remaining}
                              </span>
                              {item.remaining > 0 && (
                                <span className="ml-2 text-xs font-bold text-slate-700 uppercase tracking-widest font-sans">Unit</span>
                              )}
                            </td>
                          </tr>
                          {expandedProduct === item.name && (
                            <tr>
                              <td colSpan={4} className="px-8 pb-8 bg-slate-50/50">
                                <div className="grid grid-cols-12 gap-8">
                                  {/* Checklist Column */}
                                  <div className="col-span-5 space-y-6">
                                    {getChecklistForProduct(item.name) ? (
                                      <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple flex items-center gap-2">
                                            <ChefHat className="w-3 h-3" /> Bahan Komposisi
                                          </p>
                                          <div className="space-y-2.5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            {getChecklistForProduct(item.name)!.ingredients.map(ing => (
                                              <div 
                                                key={ing} 
                                                onClick={() => toggleCheck(item.name, ing)}
                                                className="flex items-center gap-3 text-xs font-bold text-slate-600 cursor-pointer group"
                                              >
                                                {checklists[item.name]?.[ing] ? (
                                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                                                ) : (
                                                  <Circle className="w-4 h-4 text-slate-300 group-hover:text-brand-purple transition-colors" />
                                                )}
                                                <span className={cn("transition-all", checklists[item.name]?.[ing] && "line-through opacity-40")}>{ing}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-purple flex items-center gap-2">
                                            <PackageCheck className="w-3 h-3" /> Standarisasi Packaging
                                          </p>
                                          <div className="space-y-2.5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                            {getChecklistForProduct(item.name)!.packaging.map(pkg => (
                                              <div 
                                                key={pkg} 
                                                onClick={() => toggleCheck(item.name, pkg)}
                                                className="flex items-center gap-3 text-xs font-bold text-slate-600 cursor-pointer group"
                                              >
                                                {checklists[item.name]?.[pkg] ? (
                                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                                                ) : (
                                                  <Circle className="w-4 h-4 text-slate-300 group-hover:text-brand-purple transition-colors" />
                                                )}
                                                <span className={cn("transition-all", checklists[item.name]?.[pkg] && "line-through opacity-40")}>{pkg}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-8 bg-white/40 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center h-full">
                                        <Book className="w-6 h-6 text-slate-300 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gunakan Tombol 'Lihat Resep' untuk Detail Bumbu</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Orders Column */}
                                  <div className="col-span-7 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logistik Pesanan:</p>
                                    <div className="space-y-2 bg-white/50 p-4 rounded-2xl border border-slate-100">
                                      {orderSource[item.name]?.map((source, sIdx) => (
                                        <div key={sIdx} className="flex flex-col md:flex-row md:items-center justify-between text-sm py-4 border-b border-white last:border-0 hover:bg-white/30 px-3 rounded-xl transition-colors">
                                          <div className="flex flex-col">
                                            <span className="font-black text-slate-900">{source.customer}</span>
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-tight opacity-60">Jam: {source.time} • {source.status}</span>
                                          </div>
                                          <div className="flex items-center gap-6 mt-2 md:mt-0">
                                            {source.notes !== '-' && (
                                              <span className="text-[11px] bg-brand-purple/5 text-brand-purple px-3 py-1 rounded-full border border-brand-purple/10 font-black italic">
                                                ★ {source.notes}
                                              </span>
                                            )}
                                            <div className="flex flex-col items-end">
                                              <span className="font-black text-2xl text-brand-purple leading-none">
                                                x{source.qty}
                                              </span>
                                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Units</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="p-10 sm:p-20 text-center">
                  <PackageCheck className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-bold font-serif text-base sm:text-lg">Hening... Tidak ada antrean produksi untuk tanggal ini.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-8">
           {/* Manual Log Card */}
           <div className="glass-card p-6 sm:p-8 bg-white border-brand-purple/20 shadow-xl shadow-brand-purple/5">
              <h4 className="font-serif font-black text-brand-purple text-base sm:text-lg flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-purple/10 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                Input Task Manual
              </h4>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nama Produk</label>
                  <input type="text" placeholder="Contoh: Batch Bonus Oat.." className="input-field py-2.5 text-xs sm:text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jumlah Pesanan</label>
                    <input type="number" placeholder="10" className="input-field py-2.5 text-xs sm:text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tanggal Kirim</label>
                    <input type="date" className="input-field py-2.5 text-xs sm:text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Keterangan Tambahan</label>
                  <textarea placeholder="Catatan internal produksi..." className="input-field py-3 text-xs sm:text-sm min-h-[80px]" />
                </div>
                <button className="btn-primary w-full py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-purple/20">
                  <Plus className="w-5 h-5" /> Simpan Produksi
                </button>
              </div>
           </div>

           <div className="bg-brand-purple rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl shadow-brand-purple/20">
              <div className="relative z-10">
                <div className="p-3 sm:p-4 bg-brand-neon/10 rounded-xl sm:rounded-2xl w-fit mb-4 sm:mb-6">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-brand-neon" />
                </div>
                <h4 className="text-lg sm:text-xl font-serif font-black mb-2 sm:mb-3 text-brand-neon">Status Kapasitas</h4>
                <p className="text-white/90 text-[10px] sm:text-sm leading-relaxed font-medium mb-6 sm:mb-8">
                  Angka otomatis dihitung dari pesanan dengan status 'Konfirmasi', 'Diproses', atau 'Siap Kirim'. Gunakan data ini untuk belanja bahan baku Real Food Anda.
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                    <span>Target Realisasi</span>
                    <span>94%</span>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-[94%] h-full bg-brand-neon rounded-full shadow-[0_0_15px_rgba(186,235,30,0.5)]" />
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-brand-purple/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] sm:blur-[80px]" />
           </div>

           <div className="glass-card p-6 sm:p-8 border-brand-purple/10 bg-white">
              <h4 className="font-serif font-black text-brand-purple text-base sm:text-lg flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-brand-purple/10 rounded-lg sm:rounded-xl">
                  <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                Pengecekan Akhir
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {['Sterilisasi kemasan', 'Kualitas buah grade-A', 'Estimasi rute kurir', 'Inventarisasi harian'].map((check, i) => (
                  <li key={i} className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-sm font-bold text-slate-700 group cursor-pointer">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl border-2 border-slate-200 flex items-center justify-center flex-shrink-0 transition-all group-hover:border-brand-purple group-hover:bg-brand-purple">
                      <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-brand-neon rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
