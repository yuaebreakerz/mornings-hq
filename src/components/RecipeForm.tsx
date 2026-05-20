import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X, Save, Loader2, Book } from 'lucide-react';
import { productService } from '../services/googleService';

interface RecipeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recipe?: any;
}

export default function RecipeForm({ isOpen, onClose, onSuccess, recipe }: RecipeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    category: ''
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        ingredients: recipe.ingredients || '',
        instructions: recipe.instructions || '',
        category: recipe.category || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        ingredients: '',
        instructions: '',
        category: ''
      });
    }
  }, [recipe, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        id: recipe?.id
      };
      await productService.saveRecipe(payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Gagal menyimpan resep. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-purple/40 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-brand-purple text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-black">{recipe ? 'Edit Resep' : 'Resep Baru'}</h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Detail Rahasia Dapur</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple/40">Nama Resep</label>
              <input
                required
                className="input-field"
                placeholder="Contoh: Nasi Goreng Gila"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple/40">Kategori</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Pilih Kategori</option>
                <option value="Main Course">Main Course</option>
                <option value="Drink">Drink</option>
                <option value="Dessert">Dessert</option>
                <option value="Side Dish">Side Dish</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple/40">Keterangan Singkat</label>
            <input
              className="input-field"
              placeholder="Deskripsi singkat tentang menu ini..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple/40">Bahan-Bahan</label>
            <textarea
              className="input-field min-h-[120px] py-3 leading-relaxed"
              placeholder="List bahan-bahan... (pisahkan dengan baris baru)"
              value={formData.ingredients}
              onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brand-purple/40">Instruksi Memasak</label>
            <textarea
              className="input-field min-h-[160px] py-3 leading-relaxed"
              placeholder="Langkah-langkah pembuatan..."
              value={formData.instructions}
              onChange={e => setFormData({ ...formData, instructions: e.target.value })}
            />
          </div>
        </form>

        <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 px-8"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Simpan Resep</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
