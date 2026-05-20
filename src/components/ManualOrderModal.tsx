import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Minus,
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  StickyNote,
  Loader2,
  CheckCircle2,
  Package,
  Search,
  ShoppingCart,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { productService } from '../services/googleService';
import { cn, getGoogleDriveUrl } from '../lib/utils';

import ReceiptGenerator from './ReceiptGenerator';

interface Product {
  id: string;
  name: string;
  price: number;
  variants: string;
  category: string;
  image: string;
}

interface OrderItem {
  productId: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
}

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function ManualOrderModal({ isOpen, onClose, onSuccess, initialData }: ManualOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    whatsapp_number: '',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '08:00',
    delivery_method: 'Delivery',
    delivery_address: '',
    order_notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData && products.length > 0) {
      setFormData({
        customer_name: initialData.customer_name || '',
        whatsapp_number: initialData.whatsapp_number || '',
        delivery_date: initialData.delivery_date || new Date().toISOString().split('T')[0],
        delivery_time: initialData.delivery_time || '08:00',
        delivery_method: initialData.delivery_method || 'Delivery',
        delivery_address: initialData.delivery_address || '',
        order_notes: initialData.order_notes || '',
      });

      const items = initialData.items || [];
      const mappedItems: OrderItem[] = items.map((item: any) => {
        let name = item.name;
        let variant = '';
        if (name.includes(' (') && name.endsWith(')')) {
          const parts = name.split(' (');
          name = parts[0];
          variant = parts[1].slice(0, -1);
        }

        const product = products.find(p => p.name === name);
        return {
          productId: product?.id || '',
          name: name,
          variant: variant,
          price: item.price,
          qty: item.qty
        };
      });
      setSelectedItems(mappedItems);
    } else if (isOpen && !initialData) {
      // Reset logic for new order
      setSelectedItems([]);
      setFormData({
        customer_name: '',
        whatsapp_number: '',
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time: '08:00',
        delivery_method: 'Delivery',
        delivery_address: '',
        order_notes: '',
      });
    }
  }, [isOpen, initialData, products]);

  async function fetchProducts() {
    try {
      const data = await productService.getAll();
      if (Array.isArray(data)) {
        const mapped = data.filter(p => p).map((item: any, index: number) => ({
          id: item.id || item.ID || `prod-${index}-${Date.now()}`,
          name: item.name || 'Produk Tanpa Nama',
          price: Number(item.price) || 0,
          variants: String(item.variants || ''),
          category: item.category || 'Uncategorized',
          image: item.image_url || item.image || '',
          active: item.active
        }));
        setProducts(mapped.filter(p => p.active === true || p.active === 'TRUE' || p.active === 'true'));
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }

  const categories = useMemo(() => {
    const caps = new Set(products.map(p => p.category));
    return ['All', ...Array.from(caps)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product, variantName: string = '', variantPrice?: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.productId === product.id && item.variant === variantName);
      if (existing) {
        return prev.map(item => 
          (item.productId === product.id && item.variant === variantName)
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        variant: variantName,
        price: variantPrice ?? product.price,
        qty: 1
      }];
    });
    setShowVariantPicker(null);
  };

  const updateQty = (productId: string, variant: string, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.productId === productId && item.variant === variant) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Pilih minimal satu produk');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        ...formData,
        order_number: initialData?.order_number || `POS-${Date.now().toString().slice(-6)}`,
        items: selectedItems.map(item => ({
          name: item.variant ? `${item.name} (${item.variant})` : item.name,
          qty: item.qty,
          price: item.price
        })),
        total_amount: totalAmount,
        status: initialData?.status || 'confirmed',
        created_at: initialData?.created_at || new Date().toISOString(),
      };

      if (initialData?.id) {
        await productService.update(initialData.id, orderData, 'orders');
      } else {
        const result = await productService.createOrder(orderData);
        setSuccessData(result.data || orderData);
      }
      
      onSuccess();
      
      if (initialData?.id) {
        onClose();
      }
    } catch (err) {
      alert('Gagal menyimpan order manual');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-6 bg-brand-purple/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-50 md:rounded-[40px] shadow-2xl w-full max-w-6xl h-full md:h-[90vh] overflow-hidden flex flex-col md:flex-row border border-white"
      >
        {/* Main Content Area (Now Single Wide Column) */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Header POS */}
          <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-brand-purple flex items-center justify-center text-brand-neon">
                  <ShoppingCart className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-2xl font-serif font-black text-brand-purple italic leading-none">
                    {initialData ? 'Edit Order' : 'Mornings POS'}
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mt-1">
                    {initialData ? `Order: #${initialData.order_number}` : 'Sistem Ritual Pesanan'}
                  </p>
               </div>
            </div>
            <button 
              onClick={() => {
                setSuccessData(null);
                onClose();
              }} 
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
               <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filters & Search */}
          <div className="px-6 md:px-8 py-4 space-y-4">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari menu ritual..."
                  className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-brand-purple/20 transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             
             <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                      selectedCategory === cat 
                        ? "bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20" 
                        : "bg-white text-slate-400 border-slate-100 hover:border-brand-purple/30 hover:text-brand-purple"
                    )}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          {/* Scrollable Container (Products + Cart) */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-12 scrollbar-hide flex flex-col space-y-12">
             {/* Product Grid */}
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
               {filteredProducts.map(product => (
                 <motion.button
                   whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                   whileTap={{ scale: 0.95 }}
                   key={product.id}
                   onClick={() => {
                     if (product.variants) {
                        setShowVariantPicker(product);
                     } else {
                        addToCart(product);
                     }
                   }}
                   className="group bg-white rounded-2xl md:rounded-3xl p-2.5 md:p-3 border border-slate-100 shadow-sm transition-all text-left flex flex-col h-full"
                 >
                   <div className="aspect-square rounded-xl md:rounded-2xl bg-slate-50 overflow-hidden mb-2.5 relative flex-shrink-0">
                      {product.image ? (
                        <img src={getGoogleDriveUrl(product.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                      {product.variants && (
                         <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-brand-neon rounded-full text-[6px] md:text-[7px] font-black uppercase text-brand-purple z-10">
                            Multi
                         </div>
                      )}
                   </div>
                   <div className="px-0.5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[8px] font-black text-brand-purple/50 uppercase tracking-widest mb-0.5">{product.category}</p>
                        <h3 className="font-serif font-black text-slate-900 text-xs md:text-sm italic line-clamp-2 leading-tight mb-1">{product.name}</h3>
                      </div>
                      <p className="text-[10px] md:text-xs font-black text-brand-purple mt-auto">Rp {product.price.toLocaleString()}</p>
                   </div>
                 </motion.button>
               ))}
             </div>

             {filteredProducts.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                     <Search className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menu tidak ditemukan</p>
               </div>
             )}

             {/* Ritual Cart Section - MOVED UNDER PRODUCT LIST */}
             <div id="ritual-cart-pos" className="bg-slate-50 rounded-[32px] p-6 md:p-10 border border-slate-200/50 shadow-inner">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-purple flex items-center justify-center text-brand-neon shadow-lg shadow-brand-purple/20">
                         <ShoppingCart className="w-6 h-6" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-serif font-black text-slate-900 italic">Ritual Cart</h3>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Item: {selectedItems.length}</p>
                      </div>
                   </div>
                   {selectedItems.length > 0 && (
                      <button 
                        onClick={() => setSelectedItems([])}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                      >
                         Bersihkan Semua
                      </button>
                   )}
                </div>

                {selectedItems.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                      {selectedItems.map((item, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={`${item.productId}-${item.variant}-${idx}`}
                          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group"
                        >
                           <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                              {item.variant && (
                                 <p className="text-[8px] font-black text-brand-purple uppercase tracking-widest mt-1">{item.variant}</p>
                              )}
                              <p className="text-xs font-black text-slate-400 mt-2">Rp {item.price.toLocaleString()}</p>
                           </div>
                           <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                              <button 
                                onClick={() => updateQty(item.productId, item.variant, -1)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-purple hover:bg-white rounded-lg transition-all"
                              >
                                 <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center text-sm font-black text-slate-900">{item.qty}</span>
                              <button 
                                onClick={() => updateQty(item.productId, item.variant, 1)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-purple hover:bg-white rounded-lg transition-all"
                              >
                                 <Plus className="w-4 h-4" />
                              </button>
                           </div>
                           <button 
                              onClick={() => updateQty(item.productId, item.variant, -item.qty)}
                              className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </motion.div>
                      ))}
                   </div>
                ) : (
                   <div className="py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-40">
                      <ShoppingCart className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keranjang Masih Kosong</p>
                   </div>
                )}

                {selectedItems.length > 0 && (
                   <div className="bg-white rounded-3xl p-8 border border-white shadow-xl shadow-brand-purple/5 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Ritual Pesanan</p>
                         <h3 className="text-4xl font-serif font-black text-brand-purple italic">Rp {totalAmount.toLocaleString()}</h3>
                      </div>
                      <button 
                        onClick={() => setIsCheckoutView(true)}
                        className="w-full md:w-auto px-12 py-5 bg-brand-purple text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4"
                      >
                         <CheckCircle2 className="w-6 h-6" />
                         Proses Ritual Sekarang
                         <ChevronRight className="w-5 h-5 opacity-50" />
                      </button>
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* Variant Picker Overlay */}
        <AnimatePresence>
          {showVariantPicker && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-white"
               >
                  <div className="flex items-center justify-between mb-6">
                     <div>
                        <h4 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-1">Pilih Varian</h4>
                        <h3 className="text-xl font-serif font-black text-brand-purple italic">{showVariantPicker.name}</h3>
                     </div>
                     <button onClick={() => setShowVariantPicker(null)} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-400" />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                     {showVariantPicker.variants.split(',').map((v, i) => {
                        const parts = v.trim().split(':');
                        const name = parts[0];
                        const price = parts[1] ? Number(parts[1]) : showVariantPicker.price;
                        return (
                          <button
                            key={i}
                            onClick={() => addToCart(showVariantPicker, name, price)}
                            className="bg-slate-50 hover:bg-brand-neon hover:text-brand-purple p-4 rounded-2xl flex items-center justify-between group transition-all"
                          >
                             <span className="font-bold text-sm">{name}</span>
                             <span className="text-xs font-black opacity-60">Rp {price.toLocaleString()}</span>
                          </button>
                        );
                     })}
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Checkout Detail Modal */}
        <AnimatePresence>
          {isCheckoutView && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
               >
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                     <div>
                        <h3 className="text-2xl font-serif font-black text-brand-purple italic">
                          {initialData ? 'Update Ritual Detail' : 'Final Ritual Detail'}
                        </h3>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                          {initialData ? 'Simpan perubahan instruksi ritual' : 'Lengkapi Instruksiritual Pesanan'}
                        </p>
                     </div>
                     <button onClick={() => setIsCheckoutView(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-6 h-6 text-slate-400" />
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 scrollbar-hide flex-1">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                required
                                type="text"
                                placeholder="Nama Ritual Pelanggan"
                                className="input-field pl-12 font-bold"
                                value={formData.customer_name}
                                onChange={e => setFormData(p => ({...p, customer_name: e.target.value}))}
                              />
                           </div>
                           <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                required
                                type="text"
                                placeholder="WhatsApp (628...)"
                                className="input-field pl-12 font-bold"
                                value={formData.whatsapp_number}
                                onChange={e => setFormData(p => ({...p, whatsapp_number: e.target.value}))}
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <input 
                                required
                                type="date"
                                className="input-field font-bold py-3 px-4"
                                value={formData.delivery_date}
                                onChange={e => setFormData(p => ({...p, delivery_date: e.target.value}))}
                              />
                              <input 
                                required
                                type="time"
                                className="input-field font-bold py-3 px-4"
                                value={formData.delivery_time}
                                onChange={e => setFormData(p => ({...p, delivery_time: e.target.value}))}
                              />
                           </div>
                        </div>

                        <div className="space-y-4">
                           <select 
                              className="input-field font-bold bg-slate-50"
                              value={formData.delivery_method}
                              onChange={e => setFormData(p => ({...p, delivery_method: e.target.value}))}
                           >
                              <option value="Delivery">Delivery (Ojol)</option>
                              <option value="Pickup">Pickup (Ambil Sendiri)</option>
                           </select>
                           <textarea 
                              placeholder="Alamat Ritual Lengkap..."
                              className="input-field font-bold min-h-[100px] py-3"
                              value={formData.delivery_address}
                              onChange={e => setFormData(p => ({...p, delivery_address: e.target.value}))}
                           />
                        </div>
                     </div>
                     
                     <div className="relative">
                        <StickyNote className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                        <textarea 
                           placeholder="Catatan Ritual Pesanan (Opsional)..."
                           className="input-field font-bold min-h-[80px] py-4 pl-12"
                           value={formData.order_notes}
                           onChange={e => setFormData(p => ({...p, order_notes: e.target.value}))}
                        />
                     </div>
                  </form>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Ritual Bayar</p>
                        <p className="text-3xl font-serif font-black text-brand-purple">Rp {totalAmount.toLocaleString()}</p>
                     </div>
                     <button 
                       onClick={handleSubmit}
                       disabled={loading}
                       className="px-12 py-5 bg-brand-purple text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-brand-purple/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-3"
                     >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                           <>
                              <CheckCircle2 className="w-5 h-5" />
                              {initialData ? 'Simpan Perubahan' : 'Selesaikan Order'}
                           </>
                        )}
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success / Receipt View Overlay */}
        <AnimatePresence>
          {successData && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl border border-white flex flex-col items-center text-center"
               >
                  <div className="w-24 h-24 bg-brand-neon rounded-full flex items-center justify-center text-brand-purple shadow-xl shadow-brand-neon/20 mb-8">
                     <CheckCircle2 className="w-12 h-12" />
                  </div>
                  
                  <h3 className="text-3xl font-serif font-black text-slate-900 italic mb-2">Ritual Berhasil!</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Pesanan #{successData.order_number} telah tercatat</p>

                  <div className="space-y-4 w-full">
                     <ReceiptGenerator order={successData} />
                     <button 
                        onClick={() => {
                           setSuccessData(null);
                           onClose();
                        }}
                        className="w-full py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                     >
                        Tutup POS
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
