import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { BRAND_LOGO, BRAND_NAME, CONTACT_INFO } from '../constants';
import { format } from 'date-fns';
import { Tag, Loader2, Heart } from 'lucide-react';
import { parseItems } from '../lib/utils';

interface LabelProps {
  order: any;
  variant?: 'button' | 'icon';
}

export default function LabelGenerator({ order, variant = 'button' }: LabelProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Normalize order items
  const items = Array.isArray(order.items) ? order.items : parseItems(order.items);
  const orderNumber = order.order_number || order.id?.toString().slice(-6) || 'INV-000';

  const downloadLabel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (labelRef.current === null) return;
    
    setIsGenerating(true);
    try {
      // Small timeout to allow images & fonts to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(labelRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Sharp printing resolution
      });
      
      const link = document.createElement('a');
      link.download = `label-kemasan-${orderNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Gagal mencetak label kemasan:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {variant === 'button' ? (
        <button 
          onClick={downloadLabel}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-3 bg-brand-purple/5 border border-brand-purple/10 rounded-2xl text-xs font-black uppercase tracking-widest text-brand-purple hover:bg-brand-purple hover:text-white disabled:opacity-50 transition-all shadow-sm group"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Tag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-brand-purple group-hover:text-current" />
          )}
          Cetak Label
        </button>
      ) : (
        <button 
          onClick={downloadLabel}
          disabled={isGenerating}
          title="Cetak Label Kemasan"
          className="p-2 bg-brand-purple/5 border border-brand-purple/10 rounded-xl text-brand-purple hover:bg-brand-purple hover:text-white disabled:opacity-50 transition-all shadow-sm"
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Tag className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Hidden Thermal/Box Label Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <div 
          ref={labelRef} 
          className="w-[380px] p-8 bg-white text-black font-sans relative border-4 border-black"
          style={{ minHeight: '480px' }}
        >
          {/* Label Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-brand-purple">{BRAND_NAME}</h1>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Healthy Customs & Real Food</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center p-1.5 shrink-0">
              <img 
                src={BRAND_LOGO} 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>

          {/* Delivery & Time Details */}
          <div className="bg-slate-100 p-3 rounded-xl mb-4 border border-slate-200">
            <div className="grid grid-cols-2 gap-y-1.5 text-xs font-bold">
              <div className="text-slate-500 uppercase text-[9px] tracking-wide">Penerima</div>
              <div className="text-right text-sm font-black uppercase text-slate-900 truncate">{order.customer_name || 'Pelanggan'}</div>
              
              <div className="text-slate-500 uppercase text-[9px] tracking-wide">Metode Kirim</div>
              <div className="text-right text-[11px] text-slate-900 uppercase font-black">{order.delivery_method || 'Delivery'}</div>
              
              <div className="text-slate-500 uppercase text-[9px] tracking-wide">Waktu Kirim</div>
              <div className="text-right text-[11px] text-brand-purple font-black">
                {order.delivery_time || 'Pagi'} ({order.delivery_date ? format(new Date(order.delivery_date), 'dd/MM/yyyy') : '-'})
              </div>
            </div>
          </div>

          {/* Address for Delivery */}
          {order.delivery_method?.toLowerCase() !== 'ambil sendiri' && order.delivery_method?.toLowerCase() !== 'takeaway' && order.delivery_address && (
            <div className="mb-4 border-b border-dashed border-slate-200 pb-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat Pengiriman:</p>
              <p className="text-xs font-bold text-slate-700 leading-snug">{order.delivery_address}</p>
            </div>
          )}

          {/* Order Items (Large text for Packers) */}
          <div className="space-y-2 border-b border-black pb-4 mb-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Daftar Item Anda:</p>
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start py-1 border-b border-slate-50 last:border-none">
                <span className="text-xs font-black text-slate-900 flex-1 pr-2">
                  {item.name}
                </span>
                <span className="text-sm font-black text-brand-purple bg-brand-purple/5 px-2 py-0.5 rounded border border-brand-purple/10 shrink-0">
                  x{item.qty}
                </span>
              </div>
            ))}
          </div>

          {/* Special Kitchen Notes */}
          {order.order_notes && order.order_notes !== '-' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 italic">
              <p className="text-[9px] font-black uppercase text-red-600 not-italic tracking-wide mb-1">Catatan Khusus:</p>
              <p className="text-xs font-black text-red-800 leading-tight">★ {order.order_notes}</p>
            </div>
          )}

          {/* Sticker Footer */}
          <div className="text-center pt-2">
            <div className="flex gap-1 justify-center items-center text-xs font-bold text-slate-500 mb-1">
              <span>Made with love for your rituals</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
            <p className="text-[9px] text-slate-400">Silakan simpan di kulkas demi kualitas terbaik ☀️ @morningsbysfc</p>
          </div>
        </div>
      </div>
    </>
  );
}
