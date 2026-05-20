import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  PlusCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { productService } from '../services/googleService';
import { cn, getGoogleDriveUrl } from '../lib/utils';
import ProductForm from '../components/ProductForm';

import { Product } from '../types';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'Beverages', name: 'Beverages' },
    { id: 'Snacks', name: 'Snacks' },
    { id: 'Overnight Oats', name: 'Overnight Oats' },
    { id: 'Meals', name: 'Meals' },
  ];

  const fetchProducts = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const data = await productService.getAll();
      if (Array.isArray(data)) {
        const mappedProducts: any[] = data.map((item: any, index: number) => ({
          id: String(item?.id ?? item?.ID ?? item?.Id ?? item?._id ?? `prod-${index}-${Date.now()}`), 
          name: item?.name || 'Produk Tanpa Nama',
          description: item?.description || '',
          price: Number(item?.price) || 0,
          harga_asli: Number(item?.harga_asli) || 0,
          status_produk: item?.status_produk || '',
          category: item?.category || 'Uncategorized',
          image: item?.image_url || '',
          isAvailable: item?.active === true || item?.active === 'TRUE',
          variants: item?.variants || '',
          gallery_images: item?.gallery_images || ''
        }));
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Gagal mengambil data katalog. Pastikan konfigurasi VITE_GAS_API_URL sudah benar di pengaturan.');
      setProducts([]);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const handleDelete = async (id: any) => {
    console.log('Handle delete triggered for ID:', id);
    if (!id || id === 'undefined' || id === 'null' || id === '') {
      alert('Error: ID produk tidak valid. Silakan muat ulang halaman.');
      return;
    }

    try {
      setDeletingId(id);
      console.log('Requesting delete from service for ID:', id);
      const res = await productService.delete(id);
      console.log('Delete successful, response:', res);
      
      alert('Produk berhasil dihapus secara permanen!');
      fetchProducts(false); // Refresh list
    } catch (error) {
      console.error('Delete error details:', error);
      alert('Gagal menghapus produk: ' + (error instanceof Error ? error.message : 'Silakan coba lagi.'));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleToggleAvailability = async (product: any) => {
    try {
      const newStatus = !product.isAvailable;
      await productService.update(product.id, { active: newStatus ? 'TRUE' : 'FALSE' });
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, isAvailable: newStatus } : p
      ));
    } catch (error) {
      alert('Gagal update status');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-brand-purple">Katalog Produk</h2>
          <p className="text-slate-600 text-[10px] sm:text-sm mt-0.5 font-medium">Kelola stok menu dan ketersediaan ritual harian Anda.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedProduct(undefined);
            setIsFormOpen(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 sm:py-3 text-[10px] sm:text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Produk Baru</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari katalog..."
            className="input-field pl-10 sm:pl-12 text-xs sm:text-base w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === 'all' ? 'all' : cat.name)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                (selectedCategory === 'all' && cat.id === 'all') || (selectedCategory === cat.name)
                  ? "bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20"
                  : "bg-white text-slate-500 border-slate-200 hover:border-brand-purple/30"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading && filteredProducts.length === 0 ? (
          <div className="p-10 sm:p-20 flex justify-center">
            <Loader2 className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-brand-purple" />
          </div>
        ) : (
          <>
            {/* Mobile View: Vertical List */}
            <div className="block sm:hidden divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 text-xs font-medium">
                    Tidak ada produk ditemukan.
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={product.id} 
                      className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors" 
                      onClick={() => handleEdit(product)}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                          {product.image ? (
                            <img src={getGoogleDriveUrl(product.image)} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                             <h4 className="font-serif font-black text-brand-purple text-sm leading-tight truncate">{product.name}</h4>
                             <span className={cn(
                               "px-1.5 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap",
                               product.isAvailable ? "bg-brand-neon text-brand-purple" : "bg-slate-100 text-slate-500"
                             )}>
                               {product.isAvailable ? 'INSTOCK' : 'HABIS'}
                             </span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{product.category}</p>
                          <div className="flex items-baseline gap-2 mt-1.5">
                             <span className="font-black text-slate-900 text-sm">Rp {product.price.toLocaleString()}</span>
                             {product.harga_asli > 0 && product.harga_asli > product.price && (
                               <span className="text-[9px] text-slate-400 line-through font-bold decoration-red-500/50">Rp {product.harga_asli.toLocaleString()}</span>
                             )}
                          </div>
                          {product.variants && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {product.variants.split(',').map((v: string, i: number) => {
                                const parts = v.trim().split(':');
                                const name = parts[0];
                                const price = parts[1];
                                return (
                                  <span key={i} className="px-1.5 py-0.5 bg-brand-purple/5 border border-brand-purple/10 rounded text-[7px] font-black text-brand-purple uppercase">
                                    {name}{price ? `: Rp ${Number(price).toLocaleString()}` : ''}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleAvailability(product); }}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95",
                            product.isAvailable ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}
                        >
                           <div className={cn("w-1 h-1 rounded-full", product.isAvailable ? "bg-emerald-600 animate-pulse" : "bg-rose-600")} />
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                           className="p-1.5 bg-slate-100 text-slate-600 rounded-lg active:scale-95 transition-all"
                        >
                           <Edit2 className="w-3 h-3" />
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(product.id); }}
                           className="p-1.5 bg-red-50 text-red-500 rounded-lg active:scale-95 transition-all"
                        >
                           <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 lg:px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 font-sans">Produk</th>
                <th className="hidden sm:table-cell px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 font-sans">Kategori</th>
                <th className="px-4 lg:px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 font-sans">Harga</th>
                <th className="hidden md:table-cell px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 font-sans">Status Produk</th>
                <th className="hidden lg:table-cell px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 font-sans">Ketersediaan</th>
                <th className="px-4 lg:px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 font-sans text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {loading ? (
                   [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8">
                        <div className="h-10 bg-slate-50 rounded-lg"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600 font-medium">
                      Tidak ada produk yang sesuai dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={product.id} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img src={getGoogleDriveUrl(product.image)} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-serif font-black text-brand-purple text-sm sm:text-base truncate">{product.name}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-700 font-bold uppercase tracking-widest truncate max-w-[120px] sm:max-w-[150px]">{product.category}</p>
                            {product.variants && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.variants.split(',').map((v: string, i: number) => {
                                  const parts = v.trim().split(':');
                                  const name = parts[0];
                                  const price = parts[1];
                                  return (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded-[4px] text-[7px] font-bold text-slate-500 uppercase">
                                      {name}{price ? `: Rp ${Number(price).toLocaleString()}` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 capitalize text-slate-700 font-medium">{product.category}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-sm sm:text-base whitespace-nowrap">Rp {product.price.toLocaleString()}</span>
                          {product.harga_asli > 0 && product.harga_asli > product.price && (
                            <span className="text-[9px] sm:text-[10px] text-slate-400 line-through font-bold decoration-red-500/50">Rp {product.harga_asli.toLocaleString()}</span>
                          )}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-wider">
                          {product.status_produk || '-'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAvailability(product);
                          }}
                          className={cn(
                            "group flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                            product.isAvailable ? "bg-brand-neon text-brand-purple shadow-sm" : "bg-slate-100 text-slate-600"
                          )}
                        >
                          <div className={cn("w-1.5 h-1.5 rounded-full", product.isAvailable ? "bg-brand-purple animate-pulse" : "bg-slate-500")} />
                          {product.isAvailable ? 'Available' : 'Sold Out'}
                        </button>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(product);
                            }}
                            className="p-1.5 sm:p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setConfirmDeleteId(product.id);
                              }}
                              disabled={deletingId === product.id}
                              className={cn(
                                "p-1.5 sm:p-2 rounded-lg transition-all group",
                                deletingId === product.id 
                                  ? "bg-slate-100 cursor-not-allowed" 
                                  : "hover:bg-red-50 text-slate-600 hover:text-red-500"
                              )}
                              title="Hapus Produk"
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-purple" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
                              )}
                            </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>


      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-purple/20 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-50 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border border-black/5"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-black text-brand-purple">Hapus Produk?</h3>
                <p className="text-slate-700 text-sm font-medium leading-relaxed">Tindakan ini tidak dapat dibatalkan. Produk akan dihapus permanen dari database.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 btn-outline py-3"
                >
                  Batal
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors py-3 shadow-lg shadow-red-500/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <ProductForm 
            onClose={() => {
              setIsFormOpen(false);
              setSelectedProduct(undefined);
            }} 
            onSave={() => {
              setIsFormOpen(false);
              setSelectedProduct(undefined);
              fetchProducts();
            }}
            initialData={selectedProduct}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
