import { useState, useEffect } from 'react';
import { Save, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { productService } from '../services/googleService';
import { METADATA } from '../constants';
import { compressImage } from '../lib/imageUtils';
import { getGoogleDriveUrl } from '../lib/utils';

import { HeroContent } from '../types';

export default function Hero() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hero, setHero] = useState<HeroContent>({
    tagline: 'Mornings by SFC | HEALTHY RITUALS',
    title: 'Ritual Pagi',
    title_Italic: 'Yang Sempurna.',
    description: 'Menghadirkan ritual pagi yang lebih bermakna melalui koleksi real food overnight oats dan beverages fungsional.',
    image_url: 'https://drive.google.com/file/d/1rvwT1kJGKRcCfGGZarA40yCLkxvbOylv/view?usp=drive_link',
    primary_Button_Text: 'Lihat Menu',
    secondary_Button_Text: 'Hubungi Kami',
    toko_buka: true,
    teks_buka: 'BUKA',
    teks_libur: 'LIBUR'
  });
  const [newImage, setNewImage] = useState<File | null>(null);

  useEffect(() => {
    async function fetchHero() {
      try {
        const data = await productService.getHero();
        
        if (data) {
          setHero({
            tagline: data.tagline || '',
            title: data.title || '',
            title_Italic: data.title_Italic || '',
            description: data.description || '',
            image_url: data.image_url || '',
            primary_Button_Text: data.primary_Button_Text || '',
            secondary_Button_Text: data.secondary_Button_Text || '',
            toko_buka: String(data.toko_buka).toUpperCase() === 'TRUE',
            teks_buka: data.teks_buka || 'BUKA',
            teks_libur: data.teks_libur || 'LIBUR'
          });
        }
      } catch (err: any) {
        console.error('Error fetching hero:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHero();
  }, []);

  const handleToggleToko = async () => {
    const nextStatus = !hero.toko_buka;
    setHero((prev: any) => ({ ...prev, toko_buka: nextStatus }));
    
    // Auto-save the status change
    try {
      const payload: any = {
        tagline: hero.tagline,
        title: hero.title,
        title_Italic: hero.title_Italic,
        description: hero.description,
        image_url: hero.image_url,
        primary_Button_Text: hero.primary_Button_Text,
        secondary_Button_Text: hero.secondary_Button_Text,
        toko_buka: nextStatus ? 'TRUE' : 'FALSE',
        teks_buka: hero.teks_buka,
        teks_libur: hero.teks_libur,
        updated_at: new Date().toISOString()
      };
      
      await productService.saveHeroContent(payload);
    } catch (err) {
      console.error('Auto-save toggle status failed:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        tagline: hero.tagline,
        title: hero.title,
        title_Italic: hero.title_Italic,
        description: hero.description,
        primary_Button_Text: hero.primary_Button_Text,
        secondary_Button_Text: hero.secondary_Button_Text,
        toko_buka: hero.toko_buka ? 'TRUE' : 'FALSE',
        teks_buka: hero.teks_buka,
        teks_libur: hero.teks_libur,
        updated_at: new Date().toISOString()
      };

      if (newImage) {
        try {
          const base64 = await compressImage(newImage);
          payload.image_file = {
            base64,
            filename: newImage.name,
            mimeType: 'image/jpeg'
          };
        } catch (compressErr) {
          console.error('Compression failed, falling back to original:', compressErr);
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.readAsDataURL(newImage);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
          });
          payload.image_file = {
            base64,
            filename: newImage.name,
            mimeType: newImage.type
          };
        }
      } else if (hero.image_url) {
        payload.image_url = hero.image_url;
      }

      const res = await productService.saveHeroContent(payload);
      
      const returnedUrl = res?.image_url || res?.image || res?.data?.image_url || res?.data?.image;
      if (returnedUrl) {
        setHero((prev: any) => ({ ...prev, image_url: returnedUrl }));
        setNewImage(null);
      }
      
      alert('Halaman Hero berhasil diperbarui!');
    } catch (err: any) {
      console.error('Save failed:', err);
      alert('Gagal menyimpan: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-brand-purple" /></div>;

  return (
    <div className="max-w-4xl space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-serif font-black text-brand-purple">Bagian Hero</h1>
          <p className="text-slate-600 text-[10px] sm:text-xs font-medium mt-0.5">Kontrol kesan pertama pengunjung di halaman utama Anda.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Simpan Perubahan
        </button>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Tagline (Small Text)</label>
            <input 
              className="input-field" 
              value={hero.tagline || ''} 
              onChange={e => setHero((prev: any) => ({ ...prev, tagline: e.target.value }))} 
              placeholder="YOUR HEALTHY MORNING RITUAL"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Main Title (Bold)</label>
              <input 
                className="input-field font-bold" 
                value={hero.title || ''} 
                onChange={e => setHero((prev: any) => ({ ...prev, title: e.target.value }))} 
                placeholder="Good Morning,"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Subtitle (Italic)</label>
              <input 
                className="input-field font-serif" 
                value={hero.title_Italic || ''} 
                onChange={e => setHero((prev: any) => ({ ...prev, title_Italic: e.target.value }))} 
                placeholder="Sunshine!"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Description Text</label>
            <textarea 
              className="input-field h-32 leading-relaxed" 
              value={hero.description || ''} 
              onChange={e => setHero((prev: any) => ({ ...prev, description: e.target.value }))} 
              placeholder="Mornings by SFC menghadirkan kurasi menu sehat yang dirancang khusus untuk mengoptimalkan hari Anda..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-brand-green-muted flex flex-col gap-4">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Primary CTA Text</label>
               <input className="input-field" value={hero.primary_Button_Text || ''} onChange={e => setHero((prev: any) => ({ ...prev, primary_Button_Text: e.target.value }))} placeholder="Pesan Sekarang" />
            </div>
            <div className="space-y-2 text-brand-green-muted flex flex-col gap-4">
               <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Secondary CTA Text</label>
               <input className="input-field" value={hero.secondary_Button_Text || ''} onChange={e => setHero((prev: any) => ({ ...prev, secondary_Button_Text: e.target.value }))} placeholder="Lihat Menu" />
            </div>
          </div>
        </div>
 
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Background Hero Image</label>
          <div className="aspect-[4/5] lg:aspect-square rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden group relative shadow-2xl">
             {(newImage || hero.image_url) ? (
               <img 
                 src={newImage ? URL.createObjectURL(newImage) : getGoogleDriveUrl(hero.image_url)} 
                 alt="Hero" 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer" 
               />
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center p-6 text-brand-green-muted">
                 <ImageIcon className="w-12 h-12 mb-2" />
                 <p className="text-xs">Gambar hero belum diatur</p>
               </div>
             )}
             <label className="absolute inset-0 bg-brand-green-dark/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
               <input type="file" hidden onChange={e => setNewImage(e.target.files?.[0] || null)} />
               <div className="flex items-center gap-2 text-white">
                 <Upload className="w-4 h-4" />
                 <span className="text-sm font-medium">Perbarui Gambar Hero</span>
               </div>
             </label>
          </div>
          {newImage && (
            <p className="text-xs text-brand-accent font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
              Gambar baru dipilih: {newImage.name} (Klik simpan untuk unggah)
            </p>
          )}
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-black text-brand-purple">Status Toko</h3>
            <p className="text-slate-600 text-[10px] sm:text-xs font-medium">Atur status buka/tutup toko Anda.</p>
          </div>
          <button 
            onClick={handleToggleToko}
            className={`w-9 h-5 shrink-0 rounded-full transition-all relative ${hero.toko_buka ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${hero.toko_buka ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-purple/40">Teks Saat Buka</label>
            <input 
              className="input-field" 
              value={hero.teks_buka || ''} 
              onChange={e => setHero((prev: any) => ({ ...prev, teks_buka: e.target.value }))} 
              placeholder="BUKA"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-purple/40">Teks Saat Tutup / Libur</label>
            <input 
              className="input-field" 
              value={hero.teks_libur || ''} 
              onChange={e => setHero((prev: any) => ({ ...prev, teks_libur: e.target.value }))} 
              placeholder="LIBUR"
            />
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 glass-card border-none bg-brand-green-dark/5">
        <h3 className="font-serif font-bold text-base sm:text-lg mb-1">Tips Dashboard</h3>
        <p className="text-[10px] sm:text-sm text-brand-green-muted">
          Perubahan Anda akan langsung muncul di {METADATA.url ? new URL(METADATA.url).hostname : 'web'} setelah mengeklik simpan. 
          Pastikan judul Anda singkat (maks 10 kata) untuk dampak visual terbaik.
        </p>
      </div>
    </div>
  );
}
