import { useState, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  PlusCircle,
  Loader2,
  Book,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  UtensilsCrossed
} from 'lucide-react';
import { productService } from '../services/googleService';
import { cn } from '../lib/utils';
import RecipeForm from '../components/RecipeForm';

export default function Recipes() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'Beverages', name: 'Beverages' },
    { id: 'Snacks', name: 'Snacks' },
    { id: 'Overnight Oats', name: 'Overnight Oats' },
    { id: 'Meals', name: 'Meals' },
  ];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fetchRecipes = async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    setErrorStatus(null);
    try {
      const data = await productService.getRecipes();
      if (Array.isArray(data)) {
        setRecipes(data.map((r: any, index: number) => ({
          ...r,
          id: String(r.id || r.ID || `recipe-${index}-${Date.now()}`)
        })));
      } else {
        setRecipes([]);
      }
    } catch (error: any) {
      console.error('Fetch recipes error:', error);
      if (error.message?.includes('Sheet tidak ditemukan') || error.message?.includes('Sheet not found')) {
        setErrorStatus('script_update_required');
      }
      setRecipes([]);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleDelete = async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Hapus resep ini secara permanen?')) return;
    
    setDeletingId(id);
    try {
      await productService.deleteRecipe(id);
      await fetchRecipes(false);
    } catch (error) {
      alert('Gagal menghapus resep');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (e: MouseEvent, recipe: any) => {
    e.stopPropagation();
    setSelectedRecipe(recipe);
    setIsFormOpen(true);
  };

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (r.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-brand-purple">Resep Menu</h2>
          <p className="text-slate-600 text-[10px] sm:text-sm mt-0.5 font-medium">Penyimpanan rahasia bumbu dan instruksi ritual memasak Anda.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedRecipe(undefined);
            setIsFormOpen(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2.5 sm:py-3 text-[10px] sm:text-sm"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Tambah Resep</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari by nama menu atau kategori..."
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

      <div className="space-y-4">
        {loading ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Menghubungkan ke Dapur...</p>
          </div>
        ) : errorStatus === 'script_update_required' ? (
          <div className="glass-card p-10 bg-rose-50 border-rose-100 flex flex-col items-center text-center gap-6">
            <div className="p-4 bg-rose-100 rounded-3xl text-rose-600">
              <Loader2 className="w-10 h-10" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="font-serif font-black text-rose-900 text-lg">Update Script Diperlukan</h3>
              <p className="text-sm text-rose-700 leading-relaxed">
                Fitur Resep Menu memerlukan backend versi terbaru. Silakan buka file <b>INSTRUCTIONS_FOR_USER.md</b> untuk panduan singkat cara update Google Apps Script Anda ke v3.6.
              </p>
            </div>
            <button 
              onClick={() => fetchRecipes()}
              className="px-6 py-2 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
              <Book className="w-8 h-8" />
            </div>
            <div>
              <p className="font-serif font-black text-slate-900">Belum ada resep</p>
              <p className="text-xs text-slate-500 max-w-[200px] mt-1">Mulai simpan resep menu Anda agar kualitas tetap terjaga.</p>
            </div>
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <div 
              key={recipe.id}
              className={cn(
                "glass-card overflow-hidden transition-all duration-300",
                expandedId === recipe.id ? "ring-2 ring-brand-purple" : "hover:border-brand-purple/30"
              )}
            >
              <div 
                onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                className="p-4 sm:p-6 cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-purple/5 flex items-center justify-center text-brand-purple flex-shrink-0">
                    <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-serif font-black text-slate-900 text-sm sm:text-base truncate">{recipe.title}</h3>
                      {recipe.category && (
                        <span className="px-2 py-0.5 bg-brand-neon text-brand-purple text-[8px] font-black uppercase tracking-widest rounded-md shrink-0">
                          {recipe.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">{recipe.description || 'Tidak ada deskripsi'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => handleEdit(e, recipe)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-purple transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, recipe.id)}
                      disabled={deletingId === recipe.id}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                    >
                      {deletingId === recipe.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-slate-300">
                    {expandedId === recipe.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === recipe.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 bg-slate-50/50"
                  >
                    <div className="p-6 sm:p-8 space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-brand-purple">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Bahan-Bahan</h4>
                          </div>
                          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <pre className="text-xs sm:text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                              {recipe.ingredients || 'Belum ada data bahan.'}
                            </pre>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-brand-purple">
                            <UtensilsCrossed className="w-4 h-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Langkah-Langkah</h4>
                          </div>
                          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <pre className="text-xs sm:text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                              {recipe.instructions || 'Belum ada instruksi pembuatan.'}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      <RecipeForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => fetchRecipes(false)}
        recipe={selectedRecipe}
      />
    </div>
  );
}
