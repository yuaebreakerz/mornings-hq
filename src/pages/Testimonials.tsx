import React, { useState, useEffect } from 'react';
import { Quote, Loader2, Star, Trash2, Plus, X, Pencil } from 'lucide-react';
import { productService } from '../services/googleService';
import { compressImage } from '../lib/imageUtils';
import { getGoogleDriveUrl } from '../lib/utils';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    content: '',
    image_url: ''
  });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
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

  async function fetchData() {
    setLoading(true);
    try {
      const data = await productService.getTestimonials();
      if (Array.isArray(data)) {
        const mapped = data.map((t: any, index: number) => ({
          ...t,
          id: String(t.id || t.ID || t.Id || t._id || `testi-${index}-${Date.now()}`)
        }));
        setTestimonials(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setFormData({
      name: t.name || '',
      role: t.role || '',
      content: t.content || '',
      image_url: t.image_url || ''
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      role: '',
      content: '',
      image_url: ''
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      await productService.delete(deletingId, 'testimonials');
      alert('Testimoni berhasil dihapus!');
      setDeletingId(null);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus testimoni');
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...formData };
      
      if (imageFile) {
        try {
          const base64 = await compressImage(imageFile);
          payload.image_file = {
            base64,
            filename: imageFile.name,
            mimeType: 'image/jpeg'
          };
        } catch (compressErr) {
          console.error('Compression failed, falling back to original:', compressErr);
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.readAsDataURL(imageFile);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
          });
          payload.image_file = {
            base64,
            filename: imageFile.name,
            mimeType: imageFile.type
          };
        }
      }

      let res;
      if (editingId) {
        res = await productService.update(editingId, payload, 'testimonials');
      } else {
        res = await productService.create({
          id: Date.now().toString(),
          ...payload
        }, 'testimonials');
      }

      // Check for returned URL
      const returnedUrl = res?.data?.image_url || res?.image_url || res?.data?.image || res?.image;
      if (returnedUrl) {
        console.log('Image uploaded successfully:', returnedUrl);
      }

      setShowModal(false);
      setImageFile(null);
      alert('Testimoni berhasil disimpan!');
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan testimoni');
    } finally {
      setSaving(false);
    }
  };

  if (loading && testimonials.length === 0) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-brand-purple" /></div>;

  return (
    <div className="max-w-4xl space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-serif font-black text-brand-purple">Testimonials</h1>
          <p className="text-slate-500 text-[10px] sm:text-sm font-medium mt-0.5">Dengarkan apa kata pelanggan setia Mornings.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Testimoni
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {testimonials.map((t, i) => (
          <div key={t.id || i} className="glass-card p-8 relative overflow-hidden group">
            <Quote className="absolute top-4 right-4 w-12 h-12 text-brand-purple/5" />
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                  {t.image_url ? (
                    <img src={getGoogleDriveUrl(t.image_url)} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                       <Star className="w-5 h-5" />
                    </div>
                  )}
               </div>
               <div>
                  <h4 className="font-serif font-black text-brand-purple text-base sm:text-lg leading-tight">{t.name}</h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.role}</p>
               </div>
            </div>
            <p className="text-slate-700 font-medium leading-relaxed">"{t.content}"</p>
            
            <div className="mt-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex gap-4">
                 <button 
                   onClick={() => handleEdit(t)}
                   className="text-[10px] font-black text-slate-500 hover:text-brand-purple uppercase tracking-widest flex items-center gap-2"
                 >
                   <Pencil className="w-3 h-3" />
                   Edit
                 </button>
                 <button 
                   onClick={() => handleDelete(t.id)}
                   className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2"
                 >
                   <Trash2 className="w-3 h-3" />
                   Hapus
                 </button>
               </div>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <Quote className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada testimoni pelanggan</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-purple/20 backdrop-blur-md text-slate-900">
          <div className="bg-slate-50 rounded-[32px] p-8 w-full max-w-md shadow-2xl relative border border-black/5">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-serif font-black text-brand-purple mb-6">
              {editingId ? 'Edit Testimoni' : 'Tambah Testimoni'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Nama Pelanggan</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Pekerjaan / Label</label>
                <input 
                  type="text"
                  placeholder="e.g. Mahasiswa, Ibu Rumah Tangga"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Isi Testimoni</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="input-field h-32 resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Foto Pelanggan (Optional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-black/5 overflow-hidden flex-shrink-0 border border-black/5">
                    {(imageFile || formData.image_url) ? (
                      <img 
                        src={imageFile ? URL.createObjectURL(imageFile) : getGoogleDriveUrl(formData.image_url)} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <label className="flex-1">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={e => setImageFile(e.target.files?.[0] || null)}
                    />
                    <div className="w-full bg-black/5 border border-dashed border-black/10 rounded-2xl p-3 text-center cursor-pointer hover:bg-black/10 transition-colors">
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        {imageFile ? imageFile.name : 'Pilih File Foto'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={saving}
                className="btn-primary w-full h-14 flex justify-center items-center gap-2 mt-4"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="uppercase tracking-widest text-[10px] font-black">
                    {editingId ? 'Simpan Perubahan' : 'Publish Testimoni'}
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-purple/20 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border border-black/5">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-black text-brand-purple">Hapus Testimoni?</h3>
              <p className="text-slate-700 text-sm font-medium leading-relaxed">Tindakan ini tidak dapat dibatalkan. Testimoni akan dihapus permanen.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
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
