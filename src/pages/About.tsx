import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  BookOpen, 
  Plus, 
  Trash2,
  Layout
} from 'lucide-react';
import { AboutContent } from '../types';
import { productService } from '../services/googleService';

export default function About() {
  const [content, setContent] = useState<any>({
    tagline: '',
    title: '',
    subtitle: '',
    description: '',
  });
  const [cards, setCards] = useState<any[]>([
    { id: 'card_001', title_card: '', description_card: '' },
    { id: 'card_002', title_card: '', description_card: '' },
    { id: 'card_003', title_card: '', description_card: '' },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [fetchedId, setFetchedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  async function fetchAboutContent() {
    setLoading(true);
    try {
      const allData = await productService.getAboutAll();
      if (Array.isArray(allData)) {
        // Find main narrative
        const narrative = allData.find(d => d.id === 'about_001' || d.tagline || d.description);
        if (narrative) {
          setHasData(true);
          setFetchedId(narrative.id || 'about_001');

          setContent({
            tagline: narrative.tagline || '',
            title: narrative.title || '',
            subtitle: narrative.subtitle || '',
            description: narrative.description || '',
          });
        }

        // Find cards
        const fetchedCards = allData.filter(d => d.id && String(d.id).includes('card'));
        if (fetchedCards.length > 0) {
          // Map to our 3 cards structure
          const updatedCards = cards.map(c => {
            const found = fetchedCards.find(fc => fc.id === c.id);
            return found ? { ...c, title_card: found.title_card || '', description_card: found.description_card || '' } : c;
          });
          setCards(updatedCards);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      // 1. Save Main Narrative
      const payload = {
        tagline: content?.tagline || '',
        title: content?.title || '',
        subtitle: content?.subtitle || '',
        description: content?.description || '',
      };
      
      await productService.saveAboutNarrative(payload);
      setHasData(true);
      setFetchedId('about_001');

      // 2. Save Cards
      for (const card of cards) {
        // We always try to update/create based on existence check here is simple 
        // In a real app, you might want to check if they exist first, but let's assume they might need creating
        try {
          await productService.update(card.id, card, 'about_content');
        } catch (e) {
          // If update fails, maybe it doesn't exist yet
          await productService.create(card, 'about_content');
        }
      }

      alert('Seluruh konten About Us & Keunggulan berhasil diperbarui!');
    } catch (err: any) {
      console.error('Update failed:', err);
      alert('Gagal memperbarui: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  const updateCard = (index: number, field: string, value: string) => {
    const nextCards = [...cards];
    nextCards[index] = { ...nextCards[index], [field]: value };
    setCards(nextCards);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-brand-purple" /></div>;

  return (
    <div className="max-w-4xl space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-black text-brand-purple">About Us Manager</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola narasi brand dan nilai-nilai Mornings.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Update Content
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-purple/5 rounded-lg">
              <BookOpen className="w-5 h-5 text-brand-purple" />
            </div>
            <h3 className="text-xl font-bold font-serif text-brand-purple">Brand Narrative</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tagline</label>
              <input className="input-field" value={content.tagline || ''} onChange={e => setContent((prev: any) => ({...(prev || {}), tagline: e.target.value}))} placeholder="Ritual Pagi Kamu" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Main Title</label>
              <input className="input-field" value={content.title || ''} onChange={e => setContent((prev: any) => ({...(prev || {}), title: e.target.value}))} placeholder="Tentang Mornings" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Subtitle</label>
              <input className="input-field" value={content.subtitle || ''} onChange={e => setContent((prev: any) => ({...(prev || {}), subtitle: e.target.value}))} placeholder="Lebih dari sekedar sarapan..." />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
              <textarea 
                className="input-field h-32 resize-none" 
                value={content.description || ''} 
                onChange={e => setContent((prev: any) => ({...(prev || {}), description: e.target.value}))} 
                placeholder="Kami percaya bahwa setiap pagi adalah awal yang baru..." 
              />
            </div>
          </div>
        </section>

        <section className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-purple/5 rounded-lg">
              <Plus className="w-5 h-5 text-brand-purple" />
            </div>
            <h3 className="text-xl font-bold font-serif text-brand-purple">3 Keunggulan (Cards)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
              <div key={card.id} className="p-5 bg-black/5 rounded-2xl space-y-4 border border-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-purple bg-slate-100 px-2 py-1 rounded-md uppercase">Keunggulan 0{idx + 1}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Card Title</label>
                  <input 
                    className="input-field" 
                    value={card.title_card || ''} 
                    onChange={e => updateCard(idx, 'title_card', e.target.value)} 
                    placeholder="e.g. Bahan Segar" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Card Description</label>
                  <textarea 
                    className="input-field h-24 resize-none" 
                    value={card.description_card || ''} 
                    onChange={e => updateCard(idx, 'description_card', e.target.value)} 
                    placeholder="Kami hanya menggunakan bahan berkualitas tinggi..." 
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
