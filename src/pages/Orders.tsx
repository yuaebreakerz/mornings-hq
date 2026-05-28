import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Search, 
  Filter,
  MoreVertical,
  ExternalLink,
  MessageCircle,
  Loader2,
  MapPin,
  Calendar as CalendarIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn, parseItems, formatTime } from '../lib/utils';
import { productService } from '../services/googleService';
import ReceiptGenerator from '../components/ReceiptGenerator';
import LabelGenerator from '../components/LabelGenerator';
import ManualOrderModal from '../components/ManualOrderModal';

interface Order {
  id: string | number;
  order_number: string;
  customer_name: string;
  whatsapp_number: string;
  delivery_date: string;
  delivery_time: string;
  delivery_method: string;
  delivery_address?: string;
  order_notes: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: { name: string; qty: number, price: number }[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState<{ id: string, name: string } | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | number | null>(null);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 60000); // 1 minute refresh

    return () => {
      clearInterval(interval);
    };
  }, [filter]); // Refresh when filter changes

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await productService.getOrders();
      if (Array.isArray(data)) {
        let mappedData = data.filter(o => o).map((o: any, index: number) => {
          const items = parseItems(o.items);
          const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
          
          return {
            ...o,
            id: o.id || o.ID || `order-${index}-${Date.now()}`,
            customer_name: o.customer_name || 'Tanpa Nama',
            whatsapp_number: o.whatsapp_number || '',
            delivery_date: o.delivery_date || '',
            total_amount: Number(o.total_amount) || calculatedTotal,
            items,
            delivery_time: formatTime(o.delivery_time),
            delivery_method: o.delivery_method || 'Delivery',
            delivery_address: o.delivery_address || '',
            order_notes: o.order_notes || '-'
          };
        });

        if (filter !== 'all') {
          mappedData = mappedData.filter((o: any) => o.status === filter);
        }
        
        setOrders(mappedData);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string | number, status: string) {
    try {
      await productService.update(orderId, { status }, 'orders');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert('Gagal mengupdate status');
    }
  }

  async function handleDeleteOrder(orderId: string | number) {
    setIsDeletingId(orderId);
    try {
      await productService.delete(orderId, 'orders');
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Gagal menghapus pesanan');
    } finally {
      setIsDeletingId(null);
    }
  }

  const filteredOrders = orders.filter(order => 
    (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(order.whatsapp_number || '').includes(searchTerm)
  );

  const handleOpenManualOrder = () => {
    setOrderToEdit(null);
    setIsManualModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setOrderToEdit(order);
    setIsManualModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm"
          >
            <div className="bg-brand-purple text-white p-4 rounded-2xl shadow-2xl border-4 border-brand-neon flex items-center gap-4">
              <div className="bg-brand-neon p-2 rounded-full">
                <Package className="w-5 h-5 text-brand-purple" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-neon">Pesanan Baru Masuk!</p>
                <p className="font-serif font-black">{newOrderAlert.name}</p>
              </div>
              <button 
                onClick={() => setNewOrderAlert(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-serif font-black text-brand-purple">Manajemen Order</h1>
          <p className="text-slate-600 text-[10px] sm:text-sm font-medium">Pantau dan kelola ritual pre-order pelanggan Anda.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleOpenManualOrder}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-purple text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Order Manual
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setFilter('all')}
              className={cn("px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm", 
                filter === 'all' ? "bg-brand-purple text-white shadow-brand-purple/20" : "bg-white text-slate-600 hover:bg-slate-50 border border-transparent")}
            >
              Semua
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={cn("px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm", 
                filter === 'pending' ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-white text-slate-600 hover:bg-black/5 border border-transparent")}
            >
              Menunggu
            </button>
            <button 
              onClick={() => setFilter('confirmed')}
              className={cn("px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm", 
                filter === 'confirmed' ? "bg-brand-neon text-brand-purple shadow-brand-neon/20" : "bg-white text-slate-600 hover:bg-black/5 border border-transparent")}
            >
              Confirmed
            </button>
          </div>
        </div>
      </div>

      <ManualOrderModal 
        isOpen={isManualModalOpen} 
        onClose={() => {
          setIsManualModalOpen(false);
          setOrderToEdit(null);
        }} 
        onSuccess={fetchOrders}
        initialData={orderToEdit}
      />

      {/* Search & Filter Bar */}
      <div className="glass-card p-3 sm:p-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
          <input 
            type="text"
            placeholder="Cari nama..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl text-sm focus:ring-4 focus:ring-brand-purple/5 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-brand-purple" />
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <motion.div 
              layout
              key={order.id}
              className="glass-card p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Status & Info Side */}
                <div className="lg:w-1/4 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between lg:block lg:space-y-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">#{order.order_number}</span>
                    <div className={cn(
                      "px-2 sm:px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                      order.status === 'pending' ? "bg-amber-100 text-amber-700" :
                      order.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                      order.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {order.status === 'pending' ? 'MENUNGGU' :
                       order.status === 'confirmed' ? 'DIKONFIRMASI' :
                       order.status === 'preparing' ? 'DIPROSES' :
                       order.status === 'ready' ? 'SIAP KIRIM' :
                       order.status === 'shipping' ? 'DIKIRIM' :
                       order.status === 'completed' ? 'SELESAI' :
                       order.status === 'cancelled' ? 'DIBATALKAN' : order.status}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-serif font-black text-brand-purple text-sm sm:text-base leading-none">{order.customer_name}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700">
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <a href={`https://wa.me/${String(order.whatsapp_number || '').replace(/[^0-9]/g, '')}`} target="_blank" className="text-[10px] sm:text-xs font-bold tracking-tight hover:text-brand-purple hover:underline transition-colors uppercase">
                        {order.whatsapp_number}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Items & Logistics */}
                <div className="flex-1 bg-slate-50 rounded-xl p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Item Pesanan</span>
                      <ul className="space-y-1">
                        {order.items?.map((item, idx) => (
                          <li key={idx} className="text-sm text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 py-1 border-b border-white/50 last:border-0">
                            <span className="flex-1">{item.name}</span>
                            <div className="flex items-center gap-4">
                              {item.price > 0 && (
                                <span className="text-slate-500 text-[10px] font-bold">
                                  Rp {item.price.toLocaleString()}
                                </span>
                              )}
                              <span className="font-black text-brand-purple">x{item.qty}</span>
                              {item.price > 0 && (
                                <span className="text-slate-900 text-[11px] font-black min-w-[80px] text-right">
                                  Rp {(item.price * item.qty).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">
                          {(() => {
                            try {
                              return order.delivery_date ? format(new Date(order.delivery_date), 'EEE, dd MMM yyyy') : '-';
                            } catch (e) {
                              return order.delivery_date || '-';
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">Jam: {order.delivery_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Truck className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">Metode: {order.delivery_method}</span>
                      </div>
                      {order.delivery_address && (
                        <div className="flex items-start gap-2 text-slate-600">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <span className="text-xs sm:text-sm font-medium leading-tight">Alamat: {order.delivery_address}</span>
                        </div>
                      )}
                      {order.order_notes && order.order_notes !== '-' && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                          <MoreVertical className="w-3 h-3 text-amber-600 mt-1" />
                          <p className="text-[10px] text-amber-800 leading-tight">
                            <span className="font-bold uppercase tracking-wider block not-italic mb-1">Catatan:</span>
                            {order.order_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:w-1/5 flex lg:flex-col justify-between items-start gap-4 border-l border-slate-200 lg:pl-6 pl-0">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">Total Bayar</span>
                    <p className="text-base sm:text-lg font-serif font-black text-brand-purple tracking-tight">Rp {order.total_amount?.toLocaleString()}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      Edit Pesanan
                    </button>
                    <ReceiptGenerator order={order} />
                    <LabelGenerator order={order} />
                    {order.status === 'completed' && (
                      <div className="w-full">
                        {deleteConfirmId === order.id ? (
                          <div className="flex flex-col gap-2 p-3 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200 w-full">
                            <p className="text-[10px] text-rose-800 font-bold uppercase tracking-wider text-center">
                              anda yakin akan menghapus data ini?
                            </p>
                            <div className="flex gap-2 w-full">
                              <button
                                type="button"
                                disabled={isDeletingId === order.id}
                                onClick={() => handleDeleteOrder(order.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                              >
                                {isDeletingId === order.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                disabled={isDeletingId === order.id}
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm duration-200 hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus Pesanan
                          </button>
                        )}
                      </div>
                    )}
                    <select 
                      className="text-xs font-black bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-brand-purple/5 shadow-sm transition-all uppercase tracking-tight w-full"
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                    >
                      <option value="pending">Menunggu</option>
                      <option value="confirmed">Konfirmasi</option>
                      <option value="preparing">Diproses</option>
                      <option value="ready">Siap Kirim</option>
                      <option value="shipping">Dikirim</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Batal</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 glass-card">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No orders found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
