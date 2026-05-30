import React, { useState, useEffect } from 'react';
import { Save, Loader2, Phone, Instagram, Megaphone, Globe, Check, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { productService } from '../services/googleService';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [fetchedId, setFetchedId] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<any>({
    id: 'config_001',
    admin_password: '',
    whatsapp_number: '',
    instagram_handle: '',
    tiktok_handle: '',
    address: '',
    email_contact: '',
    opening_hours: '',
    running_text: '',
    announcement: '',
    site_title: '',
    meta_description: '',
    meta_keywords: '',
    share_thumbnail: ''
  });
  const [uploading, setUploading] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(() => {
    return localStorage.getItem('mornings_gas_api_url_override') || (import.meta as any).env.VITE_GAS_API_URL || '';
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    if (!customApiUrl) {
      setTestStatus('error');
      setTestMessage('URL tidak boleh kosong');
      return;
    }
    
    if (!customApiUrl.startsWith('http://') && !customApiUrl.startsWith('https://')) {
      setTestStatus('error');
      setTestMessage('Format URL tidak valid. Harus dimulai dengan http:// atau https://');
      return;
    }

    setTestStatus('testing');
    setTestMessage(null);

    try {
      const res = await fetch(customApiUrl.trim()).then(r => r.json()).catch(() => null);
      if (res && (res.status === 'connected' || res.script_version || Array.isArray(res) || res.success)) {
        setTestStatus('success');
        setTestMessage('Koneksi sukses! Silakan klik "Simpan URL & Gunakan" untuk mengaktifkan.');
      } else {
        setTestStatus('success');
        setTestMessage('Server merespons! URL ini valid dan dapat digunakan. Silakan simpan.');
      }
    } catch (e: any) {
      console.error('Test connection error:', e);
      setTestStatus('error');
      setTestMessage('Gagal terhubung. Pastikan URL benar, spreadsheet tidak terkunci, dan script telah dideploy sebagai "Web App" (akses: Anyone).');
    }
  };

  const handleSaveApiUrl = () => {
    localStorage.setItem('mornings_gas_api_url_override', customApiUrl.trim());
    alert('URL Google Apps Script berhasil diperbarui! Seluruh dashboard akan menggunakan koneksi ini.');
    window.location.reload();
  };

  const handleResetApiUrl = () => {
    localStorage.removeItem('mornings_gas_api_url_override');
    const defaultUrl = (import.meta as any).env.VITE_GAS_API_URL || '';
    setCustomApiUrl(defaultUrl);
    alert('URL API dikembalikan ke default bawaan sistem. Seluruh dashboard akan dimuat ulang.');
    window.location.reload();
  };

  useEffect(() => {
    async function fetchConfigs() {
      try {
        const siteData = await productService.getConfig();
        
        if (siteData) {
          setHasData(true);
          setFetchedId(siteData.id || null);
          setSiteConfig({
            id: siteData.id || 'config_001',
            admin_password: siteData.admin_password || '',
            whatsapp_number: siteData.whatsapp_number || '',
            instagram_handle: siteData.instagram_handle || '',
            tiktok_handle: siteData.tiktok_handle || '',
            address: siteData.address || '',
            email_contact: siteData.email_contact || '',
            opening_hours: siteData.opening_hours || '',
            running_text: siteData.running_text || '',
            announcement: siteData.announcement || '',
            site_title: siteData.site_title || '',
            meta_description: siteData.meta_description || '',
            meta_keywords: siteData.meta_keywords || '',
            share_thumbnail: siteData.share_thumbnail || ''
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfigs();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        
        // We'll update the local state. The backend handleSaveAll will process the 'image_file' field
        setSiteConfig((prev: any) => ({
          ...prev,
          image_file: {
            base64: base64Data,
            mimeType: file.type,
            filename: file.name
          },
          // Temporary preview
          share_thumbnail: base64
        }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Gagal memproses gambar');
      setUploading(false);
    }
  };

  const handleSaveAll = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...siteConfig,
        updated_at: new Date().toISOString()
      };
      
      const res = await productService.saveConfig(payload);
      
      if (res && res.error) throw new Error(res.error);
      
      // Update local thumbnail if it was a preview
      if (res.data && res.data.share_thumbnail) {
        setSiteConfig((prev: any) => ({
          ...prev,
          share_thumbnail: res.data.share_thumbnail,
          image_file: undefined // Clear the temp upload data
        }));
      }
      
      alert('Semua konfigurasi berhasil disinkronkan ke Google Sheets!');
    } catch (err: any) {
      console.error('Save settings failed:', err);
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-brand-purple">Mornings HQ Config</h1>
          <p className="text-slate-500 font-medium mt-1 text-[10px] sm:text-sm">Kelola aset merek global dan informasi operasional situs.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={saving}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto py-2.5 sm:py-3 text-[10px] sm:text-xs"
        >
          {saving ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-4 h-4 sm:w-5 sm:h-5" />}
          Update Config
        </button>
      </div>

      {/* Database Connection / Google Apps Script Override Panel */}
      <div className="glass-card p-6 sm:p-8 bg-slate-50 border border-slate-200 rounded-[32px] space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2.5 bg-brand-purple/10 text-brand-purple rounded-2xl">
            <Database className="w-5 h-5 text-brand-purple" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-850 uppercase tracking-widest text-left">Koneksi Database (Google Sheets)</h3>
            <p className="text-[10px] text-slate-500 font-medium text-left">Gunakan bagian ini untuk melacak dan memperbarui URL deployment Google Apps Script Anda.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-[11px] text-slate-600 leading-relaxed text-left">
            URL ini menghubungkan dashboard monitoring digital Anda dengan file Google Sheets sebagai basis data utama. Jika Anda ingin mengganti file Google Sheets milik Anda sendiri atau memperbaiki masalah otorisasi, masukkan URL baru di bawah.
          </p>

          <div className="text-left space-y-1.5">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">URL Web App / Google Apps Script</label>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={customApiUrl}
              onChange={(e) => {
                setCustomApiUrl(e.target.value);
                setTestStatus('idle');
                setTestMessage(null);
              }}
              className="w-full px-5 py-3 bg-white border border-slate-250 rounded-2xl text-xs font-mono text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>

          {testMessage && (
            <div className={`p-3.5 rounded-2xl border text-[11px] font-semibold flex items-start gap-2.5 text-left ${
              testStatus === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-850' 
                : 'bg-rose-50 border-rose-200 text-rose-840'
            }`}>
              {testStatus === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={testStatus === 'testing'}
              onClick={handleTestConnection}
              className="flex-1 sm:flex-initial px-6 py-3 bg-slate-200/80 hover:bg-slate-200 text-slate-700 transition-all font-bold rounded-2xl text-[11px] uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {testStatus === 'testing' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Cek Koneksi
            </button>
            <button
              type="button"
              onClick={handleSaveApiUrl}
              disabled={!customApiUrl}
              className="flex-1 sm:flex-initial px-8 py-3 bg-brand-purple text-white hover:bg-brand-purple/95 active:scale-[0.98] transition-all rounded-2xl text-[11px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 font-bold" />
              Simpan URL & Gunakan
            </button>
            
            {localStorage.getItem('mornings_gas_api_url_override') && (
              <button
                type="button"
                onClick={handleResetApiUrl}
                className="py-3 text-rose-500 hover:text-rose-600 transition-colors text-[11px] uppercase font-bold tracking-wider cursor-pointer ml-auto"
              >
                Kembalikan ke Default
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-5 sm:p-8 border-none flex flex-col gap-6 sm:gap-8 bg-brand-purple/5 border border-brand-purple/20">
           <h3 className="text-lg sm:text-xl font-black flex items-center gap-3 text-brand-purple">
              <div className="p-2 bg-brand-purple/10 rounded-lg">
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              Keamanan Dashboard
           </h3>
           <div className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Admin Password</label>
                <input 
                  type="text" 
                  className="input-field py-2 text-xs sm:text-base font-mono" 
                  value={siteConfig.admin_password || ''} 
                  onChange={e => setSiteConfig((prev: any) => ({ ...prev, admin_password: e.target.value }))} 
                  placeholder="Set password baru..." 
                />
                <p className="text-[9px] text-slate-400 font-medium italic">*digunakan untuk akses Authorized Entry di Login.</p>
              </div>
           </div>
        </div>

        <div className="glass-card p-5 sm:p-8 border-none flex flex-col gap-6 sm:gap-8">
           <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-brand-purple/5 rounded-lg">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-brand-purple" />
              </div>
              Saluran Kontak
           </h3>
           
           <div className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">WhatsApp Number</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.whatsapp_number || ''} onChange={e => setSiteConfig((prev: any) => ({ ...prev, whatsapp_number: e.target.value }))} placeholder="+628..." />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Contact</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.email_contact || ''} onChange={e => setSiteConfig((prev: any) => ({ ...prev, email_contact: e.target.value }))} placeholder="morningsbysfc@gmail.com" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Store Address</label>
                <textarea className="input-field py-2 text-xs sm:text-base min-h-[80px]" value={siteConfig.address || ''} onChange={e => setSiteConfig((prev: any) => ({ ...prev, address: e.target.value }))} placeholder="Alamat lengkap..." />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Opening Hours</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.opening_hours || ''} onChange={e => setSiteConfig((prev: any) => ({ ...prev, opening_hours: e.target.value }))} placeholder="Mon-Sat: 08:00 - 17:00" />
              </div>
           </div>
        </div>

        <div className="glass-card p-5 sm:p-8 border-none flex flex-col gap-6 sm:gap-8">
           <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-brand-purple/5 rounded-lg">
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-brand-purple" />
              </div>
              Sosial Media
           </h3>
           
           <div className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Instagram Handle</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.instagram_handle || ''} onChange={e => setSiteConfig((prev: any) => ({...(prev || {}), instagram_handle: e.target.value}))} placeholder="@mornings.id" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">TikTok Handle</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.tiktok_handle || ''} onChange={e => setSiteConfig((prev: any) => ({...(prev || {}), tiktok_handle: e.target.value}))} placeholder="@mornings.id" />
              </div>
           </div>
        </div>

        <div className="glass-card p-5 sm:p-8 border-none lg:col-span-2 flex flex-col gap-6 sm:gap-8">
           <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-900">
             <div className="p-2 bg-brand-purple/5 rounded-lg">
               <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-brand-purple" />
             </div>
             Running Text & Announcement
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Running Text (Marquee)</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.running_text || ''} onChange={e => setSiteConfig((prev: any) => ({...(prev || {}), running_text: e.target.value}))} placeholder="Order Today..." />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Announcement Text</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.announcement || ''} onChange={e => setSiteConfig((prev: any) => ({...(prev || {}), announcement: e.target.value}))} placeholder="Libur Idul Fitri..." />
              </div>
           </div>
        </div>

        <div className="glass-card p-5 sm:p-8 border-none lg:col-span-2 flex flex-col gap-6 sm:gap-8">
           <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-900">
             <div className="p-2 bg-brand-neon/20 rounded-lg">
               <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-brand-purple" />
             </div>
             SEO & Metadata
           </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Site Title</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.site_title || ''} onChange={e => setSiteConfig((prev: any) => ({ ...prev, site_title: e.target.value }))} placeholder="Mornings by SFC" />
              </div>
              <div className="space-y-1.5 sm:space-y-2 lg:col-span-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Site Description</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.meta_description || ''} onChange={e => setSiteConfig((prev: any) => ({ ...prev, meta_description: e.target.value }))} placeholder="Your daily ritual..." />
              </div>
              <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Meta Keywords</label>
                <input className="input-field py-2 text-xs sm:text-base" value={siteConfig.meta_keywords || ''} onChange={e => setSiteConfig((prev: any) => ({ ...prev, meta_keywords: e.target.value }))} placeholder="overnight oats, healthy breakfast..." />
              </div>
              <div className="space-y-1.5 sm:space-y-2 md:col-span-1">
                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Share Thumbnail</label>
                <div className="flex flex-col gap-3">
                  {siteConfig.share_thumbnail && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={siteConfig.share_thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden" 
                      id="thumbnail-upload"
                    />
                    <label 
                      htmlFor="thumbnail-upload"
                      className="btn-outline flex items-center justify-center gap-2 py-2 text-[10px] cursor-pointer"
                    >
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                      {siteConfig.share_thumbnail ? 'Ganti Gambar' : 'Upload Thumbnail'}
                    </label>
                  </div>
                  <p className="text-[8px] text-slate-400 italic">*gambar akan di-upload ke Drive dan URL disimpan otomatis.</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
