import React, { useState, useEffect } from 'react';
import { Megaphone, Layout, Loader2, Save, Trash2, Plus } from 'lucide-react';
import { productService } from '../services/googleService';
import { compressImage } from '../lib/imageUtils';
import { getGoogleDriveUrl } from '../lib/utils';

export default function PromoBanners() {
  const [urgent, setUrgent] = useState<any>({
    enabled: false,
    image_url: '',
    title: '',
    description: '',
    cta_text: '',
    cta_link: ''
  });
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUrgentData, setHasUrgentData] = useState(false);
  const [fetchedUrgentId, setFetchedUrgentId] = useState<string | null>(null);
  const [urgentImage, setUrgentImage] = useState<File | null>(null);
  const [highlightForm, setHighlightForm] = useState<any>(null);
  const [highlightImage, setHighlightImage] = useState<File | null>(null);
  const [deletingHighlightId, setDeletingHighlightId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const uData = await productService.getUrgentPromo();
        if (uData) {
          setHasUrgentData(true);
          setFetchedUrgentId(uData.id || null);
          setUrgent({
            ...uData,
            enabled: uData.enabled === true || uData.enabled === 'TRUE'
          });
        }
        
        const hData = await productService.getPromoHighlights();
        if (Array.isArray(hData)) {
          setHighlights(hData.map((h: any, index: number) => ({
            ...h,
            id: h.id || h.ID || `highlight-${index}-${Date.now()}`
          })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSaveUrgent = async () => {
    setLoading(true);
    try {
      const payload: any = {
        id: fetchedUrgentId || 'urgent_001',
        ...urgent,
        enabled: urgent.enabled ? 'TRUE' : 'FALSE'
      };

      if (urgentImage) {
        try {
          const base64 = await compressImage(urgentImage);
          payload.image_file = {
            base64,
            filename: urgentImage.name,
            mimeType: 'image/jpeg'
          };
        } catch (compressErr) {
          console.error('Compression failed, falling back to original:', compressErr);
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.readAsDataURL(urgentImage);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
          });
          payload.image_file = {
            base64,
            filename: urgentImage.name,
            mimeType: urgentImage.type
          };
        }
      }

      const res = await productService.saveUrgentPromo(payload);
      
      const returnedUrl = res?.image_url || res?.image || res?.data?.image_url || res?.data?.image;
      if (returnedUrl) {
        setUrgent((prev: any) => ({ ...prev, image_url: returnedUrl }));
        setUrgentImage(null);
      }
      setFetchedUrgentId(res?.id || fetchedUrgentId || 'urgent_001');
      alert('Promo darurat berhasil diperbarui!');
    } catch (err) {
      alert('Gagal update promo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    setDeletingHighlightId(id);
  };

  const confirmDeleteHighlight = async () => {
    if (!deletingHighlightId) return;
    
    setLoading(true);
    try {
      await productService.delete(deletingHighlightId, 'promo_highlights');
      setHighlights(prev => prev.filter(h => h.id !== deletingHighlightId));
      alert('Highlight dihapus');
    } catch (err) {
      alert('Gagal menghapus highlight');
    } finally {
      setDeletingHighlightId(null);
      setLoading(false);
    }
  };

  const handleSaveHighlight = async () => {
    if (!highlightForm.title) return alert('Judul wajib diisi');
    setLoading(true);
    try {
      const payload = { ...highlightForm };
      
      if (highlightImage) {
        try {
          const base64 = await compressImage(highlightImage);
          payload.image_file = {
            base64,
            filename: highlightImage.name,
            mimeType: 'image/jpeg'
          };
        } catch (compressErr) {
          console.error('Compression failed, falling back to original:', compressErr);
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.readAsDataURL(highlightImage);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
          });
          payload.image_file = {
            base64,
            filename: highlightImage.name,
            mimeType: highlightImage.type
          };
        }
      }

      if (highlightForm.id) {
        await productService.update(highlightForm.id, payload, 'promo_highlights');
      } else {
        await productService.create(payload, 'promo_highlights');
      }

      const hData = await productService.getPromoHighlights();
      setHighlights(hData);
      setHighlightForm(null);
      setHighlightImage(null);
      alert('Highlight berhasil disimpan!');
    } catch (err) {
      alert('Gagal menyimpan highlight');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-brand-purple" /></div>;

  return (
    <div className="max-w-4xl space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-serif font-black text-brand-purple">Promo & Highlights</h1>
          <p className="text-slate-600 text-[10px] sm:text-sm font-medium mt-0.5">Kelola banner promo darurat dan highlight produk.</p>
        </div>
      </div>

      {/* MODAL / FORM FOR HIGHLIGHTS */}
      {highlightForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-bold font-serif text-brand-purple">
              {highlightForm.id ? 'Edit Highlight' : 'Tambah Highlight'}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Title</label>
                <input 
                  className="input-field" 
                  value={highlightForm.title || ''} 
                  onChange={e => setHighlightForm({...highlightForm, title: e.target.value})} 
                  placeholder="Promo Spesial"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  className="input-field h-24" 
                  value={highlightForm.description || ''} 
                  onChange={e => setHighlightForm({...highlightForm, description: e.target.value})} 
                  placeholder="Detail promo..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Thumbnail</label>
                <input 
                  type="file" 
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-brand-neon file:text-brand-purple hover:file:bg-brand-neon/80"
                  onChange={e => setHighlightImage(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setHighlightForm(null)} className="btn-outline flex-1">Batal</button>
              <button onClick={handleSaveHighlight} className="btn-primary flex-1">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <section className="glass-card p-10 space-y-8">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-neon/20 rounded-lg text-brand-purple">
               <Megaphone className="w-6 h-6" />
             </div>
             <h3 className="text-lg font-bold font-serif text-brand-purple">Urgent Promo Banner</h3>
           </div>
           <button 
             onClick={() => setUrgent({...urgent, enabled: !urgent.enabled})}
             className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
               urgent.enabled ? 'bg-brand-neon text-brand-purple' : 'bg-slate-100 text-slate-400'
             }`}
           >
             {urgent.enabled ? 'Aktif' : 'Nonaktif'}
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Promo Title</label>
               <input className="input-field font-bold" value={urgent.title || ''} onChange={e => setUrgent({...urgent, title: e.target.value})} placeholder="Free Delivery Today" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Promo Description</label>
               <textarea className="input-field h-24" value={urgent.description || ''} onChange={e => setUrgent({...urgent, description: e.target.value})} placeholder="Get free delivery for orders above 100k." />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">CTA Text</label>
                   <input className="input-field" value={urgent.cta_text || ''} onChange={e => setUrgent({...urgent, cta_text: e.target.value})} placeholder="Order Now" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">CTA Link</label>
                   <input className="input-field" value={urgent.cta_link || ''} onChange={e => setUrgent({...urgent, cta_link: e.target.value})} placeholder="/menu" />
                </div>
             </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Promo Image</label>
            <div className="aspect-video rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden relative group">
              {(urgentImage || urgent.image_url) ? (
                <img 
                  src={urgentImage ? URL.createObjectURL(urgentImage) : getGoogleDriveUrl(urgent.image_url)} 
                  alt="Urgent Promo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                   <Megaphone className="w-8 h-8 opacity-20" />
                </div>
              )}
              <label className="absolute inset-0 bg-brand-purple/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={e => setUrgentImage(e.target.files?.[0] || null)}
                />
                <span className="text-[10px] font-black text-white uppercase tracking-widest bg-brand-purple/20 px-4 py-2 rounded-xl backdrop-blur-sm">Unggah Gambar</span>
              </label>
            </div>
            {urgentImage && (
              <p className="text-[10px] font-black text-brand-purple uppercase tracking-widest ml-1 animate-pulse">File dipilih: {urgentImage.name}</p>
            )}
          </div>
        </div>

        <button onClick={handleSaveUrgent} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          Update Urgent Promo
        </button>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-neon/20 rounded-lg text-brand-purple">
               <Layout className="w-6 h-6" />
             </div>
             <h3 className="text-lg font-bold font-serif text-brand-purple">Promo Highlights</h3>
           </div>
           <button onClick={() => setHighlightForm({ title: '', description: '' })} className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
              <Plus className="w-3.5 h-3.5" />
              Tambah Highlight
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <div key={h.id || i} className="glass-card overflow-hidden group">
               <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                 {h.image_url && <img src={getGoogleDriveUrl(h.image_url)} alt={h.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                 <div className="absolute inset-0 bg-brand-purple/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => setHighlightForm(h)}
                      className="p-3 bg-white rounded-full text-brand-purple shadow-xl transform scale-90 group-hover:scale-100 transition-all hover:bg-brand-neon"
                    >
                      <Layout className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteHighlight(h.id)}
                      className="p-3 bg-white rounded-full text-red-500 shadow-xl transform scale-90 group-hover:scale-100 transition-all hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                 </div>
               </div>
               <div className="p-6">
                  <h4 className="font-serif font-black text-brand-purple text-base">{h.title}</h4>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">ID: {h.id}</p>
               </div>
            </div>
          ))}
          {highlights.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Belum ada promo highlights</p>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal for Highlights */}
      {deletingHighlightId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-purple/20 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border border-black/5">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-black text-brand-purple">Hapus Highlight?</h3>
              <p className="text-slate-700 text-sm font-medium leading-relaxed">Tindakan ini tidak dapat dibatalkan. Highlight akan dihapus permanen.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingHighlightId(null)}
                className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDeleteHighlight}
                className="flex-1 px-6 py-3 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
