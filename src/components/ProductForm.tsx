import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { productService } from '../services/googleService';
import { compressImage } from '../lib/imageUtils';
import { getGoogleDriveUrl } from '../lib/utils';

import { Product } from '../types';

interface ProductFormProps {
  onClose: () => void;
  onSave: () => void;
  initialData?: any;
}

const CATEGORIES: string[] = ['Overnight Oats', 'Meals', 'Beverages', 'Snacks'];

export default function ProductForm({ onClose, onSave, initialData }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [galleryItems, setGalleryItems] = useState<{ url: string, file?: File }[]>(
    initialData?.gallery_images 
      ? initialData.gallery_images.split(',').map((u: string) => ({ url: u.trim() })) 
      : []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    harga_asli: initialData?.harga_asli || 0,
    status_produk: initialData?.status_produk || '',
    category: initialData?.category || 'Overnight Oats',
    is_available: initialData?.isAvailable ?? true,
    variants: initialData?.variants || '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const newItems: { url: string, file: File }[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file) {
          newItems.push({
            url: URL.createObjectURL(file),
            file: file
          });
        }
      }
      setGalleryItems(prev => [...prev, ...newItems]);
    }
  };

  const removeGalleryItem = (index: number) => {
    setGalleryItems(prev => prev.filter((_, i) => i !== index));
  };
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        harga_asli: formData.harga_asli,
        status_produk: formData.status_produk,
        category: formData.category,
        variants: formData.variants,
        image_url: initialData?.image_url || '',
        active: formData.is_available ? 'TRUE' : 'FALSE'
      };

      if (imageFile) {
        try {
          const base64 = await compressImage(imageFile);
          payload.image_file = {
            base64,
            filename: imageFile.name,
            mimeType: 'image/jpeg'
          };
        } catch (compressErr) {
          console.error('Compression failed:', compressErr);
          const base64 = await fileToBase64(imageFile);
          payload.image_file = {
            base64,
            filename: imageFile.name,
            mimeType: imageFile.type
          };
        }
      }

      // Handle Gallery reconcile
      const existingUrls = galleryItems.filter(item => !item.file).map(item => item.url);
      const newFiles = galleryItems.filter(item => item.file).map(item => item.file!);
      
      payload.gallery_images = existingUrls.join(', ');

      if (newFiles.length > 0) {
        const galleryPayload = [];
        for (const file of newFiles) {
          try {
            const base64 = await compressImage(file);
            galleryPayload.push({
              base64,
              filename: file.name,
              mimeType: 'image/jpeg'
            });
          } catch (err) {
            const base64 = await fileToBase64(file);
            galleryPayload.push({
              base64,
              filename: file.name,
              mimeType: file.type
            });
          }
        }
        if (galleryPayload.length > 0) {
          payload.gallery_files = galleryPayload;
        }
      }

      if (initialData?.id) {
        // Update existing
        const res = await productService.update(initialData.id, payload);
        const returnedUrl = res?.data?.image_url || res?.image_url;
        if (returnedUrl) {
          setImagePreview(returnedUrl);
        }
        alert('Produk berhasil diperbarui!');
      } else {
        // Create new
        const res = await productService.create({
          id: Date.now().toString(),
          ...payload
        }, 'products');
        const returnedUrl = res?.data?.image_url || res?.image_url;
        if (returnedUrl) {
          setImagePreview(returnedUrl);
        }
        alert('Produk baru berhasil ditambahkan!');
      }
      onSave();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      alert('Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 lg:p-10 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-green-dark/30 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-brand-beige rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-4 lg:p-6 border-b border-brand-green-dark/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl lg:text-2xl font-serif font-bold text-brand-green-dark">
              {initialData ? 'Edit Produk' : 'Buat Produk Baru'}
            </h2>
            <p className="hidden sm:flex text-sm text-brand-green-muted mt-1 uppercase tracking-widest font-semibold items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
               Draft Produk
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white text-brand-green-muted rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form 
          id="product-form"
          onSubmit={handleSubmit} 
          className="flex-1 overflow-auto p-4 sm:p-8 lg:p-10 space-y-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            {/* Left: Image Upload */}
            <div className="lg:col-span-5 space-y-4">
              <label className="block text-sm font-semibold text-brand-green-muted uppercase tracking-wider">Gambar Produk</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square relative rounded-3xl bg-white border-2 border-dashed border-brand-green-dark/10 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-green-dark/5 transition-all group overflow-hidden"
              >
                {imagePreview ? (
                  <>
                    <img src={getGoogleDriveUrl(imagePreview)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-brand-green-dark/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-bold uppercase tracking-widest">Ganti Gambar</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 bg-brand-white/50 w-full h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 text-brand-purple shadow-xl shadow-brand-purple/10 border border-brand-purple/5">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-brand-purple font-black text-lg">Upload Foto</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Format JPG/PNG • Max 2MB</p>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={handleImageChange}
                accept="image/*"
              />
            </div>

            {/* Right: Form Information */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-brand-green-muted uppercase tracking-wider font-sans">Detail Produk</label>
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Nama Produk</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pistachio Morning"
                      className="input-field text-lg font-serif font-black placeholder:text-slate-300"
                      value={formData.name || ''}
                      onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Harga (IDR)</label>
                      <input
                        type="number"
                        required
                        placeholder="35000"
                        className="input-field font-black"
                        value={formData.price || ''}
                        onChange={e => setFormData(prev => ({...prev, price: Number(e.target.value)}))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Kategori</label>
                      <select
                        className="input-field capitalize font-bold"
                        value={formData.category || ''}
                        onChange={e => setFormData(prev => ({...prev, category: e.target.value as any}))}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Harga Asli (Sebelum Diskon)</label>
                      <input
                        type="number"
                        placeholder="e.g. 40000"
                        className="input-field font-black shadow-inner bg-slate-50/50"
                        value={formData.harga_asli || ''}
                        onChange={e => setFormData(prev => ({...prev, harga_asli: Number(e.target.value)}))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Status Produk</label>
                      <select
                        className="input-field font-bold bg-slate-50/50"
                        value={formData.status_produk || ''}
                        onChange={e => setFormData(prev => ({...prev, status_produk: e.target.value}))}
                      >
                        <option value="">Pilih Status</option>
                        <option value="Ready">Ready</option>
                        <option value="PO H-1">PO H-1</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Deskripsi</label>
                    <textarea
                      required
                      placeholder="Ceritakan tentang keunikan produk ini..."
                      className="input-field h-40 resize-none leading-relaxed font-medium"
                      value={formData.description || ''}
                      onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Varian Produk (Format: Nama:Harga, Nama:Harga)</label>
                      <input
                        type="text"
                        placeholder="e.g. 400ml:25000, 300ml:15000"
                        className="input-field font-bold bg-slate-50/50"
                        value={formData.variants || ''}
                        onChange={e => setFormData(prev => ({...prev, variants: e.target.value}))}
                      />
                      <p className="text-[9px] text-slate-400 mt-1 ml-1 font-medium">*Jika harga tidak diisi, akan menggunakan harga utama produk.</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Galeri Gambar</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {galleryItems.map((item, index) => (
                          <div key={index} className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden group">
                            <img src={getGoogleDriveUrl(item.url)} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removeGalleryItem(index)}
                              className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-brand-purple hover:text-brand-purple transition-all"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        hidden 
                        ref={galleryInputRef} 
                        onChange={handleGalleryChange}
                        accept="image/*"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 bg-white/50 p-6 rounded-3xl border border-white">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-6 h-6 rounded-xl border-slate-200 text-brand-purple focus:ring-brand-purple/20 transition-all cursor-pointer"
                    checked={formData.is_available}
                    onChange={e => setFormData(prev => ({...prev, is_available: e.target.checked}))}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-brand-purple uppercase tracking-tight group-hover:text-brand-purple/80 transition-colors">Tersedia untuk Dipesan</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktifkan untuk Muncul di Web</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 sm:p-8 border-t border-brand-green-dark/5 flex flex-col sm:flex-row items-center justify-end gap-4 bg-brand-beige/50">
          <button 
            type="button" 
            onClick={onClose}
            className="btn-outline border-none hover:bg-slate-100 w-full sm:w-auto order-2 sm:order-1"
          >
            Batal
          </button>
          <button 
            form="product-form"
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-fit sm:min-w-[200px] flex items-center justify-center gap-2 h-12 order-1 sm:order-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{initialData ? 'Simpan Perubahan' : 'Terbitkan Produk'}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
