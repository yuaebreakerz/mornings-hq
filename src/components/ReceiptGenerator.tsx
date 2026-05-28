import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { BRAND_LOGO, BRAND_NAME, CONTACT_INFO } from '../constants';
import { format } from 'date-fns';
import { Printer, Loader2 } from 'lucide-react';
import { parseItems } from '../lib/utils';

interface ReceiptProps {
  order: any;
  variant?: 'button' | 'icon';
}

export default function ReceiptGenerator({ order, variant = 'button' }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Normalize order data to handle differences between pages
  const items = Array.isArray(order.items) ? order.items : parseItems(order.items);
  const orderNumber = order.order_number || order.id?.toString().slice(-6) || 'INV-000';
  const totalAmount = Number(order.total_amount) || items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 0)), 0);

  const downloadReceipt = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (receiptRef.current === null) return;
    
    setIsGenerating(true);
    try {
      // Ensure all images are loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Higher quality
      });
      
      const link = document.createElement('a');
      link.download = `struk-${orderNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Ops, gagal mencetak struk:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {variant === 'button' ? (
        <button 
          onClick={downloadReceipt}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm group"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          )}
          Cetak Struk
        </button>
      ) : (
        <button 
          onClick={downloadReceipt}
          disabled={isGenerating}
          title="Cetak Struk"
          className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand-purple hover:border-brand-purple/20 disabled:opacity-50 transition-all shadow-sm"
        >
          {isGenerating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Printer className="w-3 h-3" />
          )}
        </button>
      )}

      {/* Hidden Receipt Template - only render when generating to avoid heavy DOM during list scrolls, 
          actually html-to-image needs it to be in DOM, so we keep it absolute/hidden */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
        <div 
          ref={receiptRef} 
          className="w-[400px] p-10 bg-white text-black font-sans relative"
          style={{ minHeight: '600px' }}
        >
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-dashed border-slate-200 pb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-brand-purple/5 rounded-full flex items-center justify-center p-4">
              <img 
                src={BRAND_LOGO} 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-brand-purple">{BRAND_NAME}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Healthy Rituals & Real Food</p>
            <div className="mt-4 space-y-0.5">
              <p className="text-[10px] text-slate-600 font-bold">{CONTACT_INFO.location.address}</p>
              <p className="text-[9px] text-slate-400 font-medium">WhatsApp: {CONTACT_INFO.whatsapp.number}</p>
            </div>
          </div>

          {/* Info Details */}
          <div className="grid grid-cols-2 gap-y-3 mb-8 text-[11px] font-bold">
            <div className="text-slate-400 uppercase tracking-widest text-[9px]">Nomor Pesanan</div>
            <div className="text-right text-brand-purple">#{orderNumber}</div>
            
            <div className="text-slate-400 uppercase tracking-widest text-[9px]">Tanggal Transaksi</div>
            <div className="text-right">{format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
            
            <div className="text-slate-400 uppercase tracking-widest text-[9px]">Nama Pelanggan</div>
            <div className="text-right truncate ml-4">{order.customer_name || 'Pelanggan'}</div>
            
            <div className="text-slate-400 uppercase tracking-widest text-[9px]">Metode</div>
            <div className="text-right">{order.delivery_method || 'Delivery'}</div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-4">
            <div className="col-span-7">Deskripsi Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-3 text-right">Subtotal</div>
          </div>

          {/* Table Content */}
          <div className="space-y-4 mb-10">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="grid grid-cols-12 gap-2 text-[11px] font-bold items-start">
                <div className="col-span-7 pr-4">
                  <div className="text-slate-900 leading-tight">{item.name}</div>
                  <div className="text-[9px] text-slate-400 mt-1 font-medium italic">Rp {Number(item.price || 0).toLocaleString()}</div>
                </div>
                <div className="col-span-2 text-center text-brand-purple">x{item.qty}</div>
                <div className="col-span-3 text-right text-slate-900">
                  Rp {(Number(item.price || 0) * Number(item.qty || 0)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-slate-200 pt-8 mb-12">
            <div className="flex justify-between items-center bg-brand-purple/5 p-4 rounded-2xl">
              <span className="text-xs font-black uppercase tracking-widest text-brand-purple">Total Bayar</span>
              <span className="text-xl font-black text-brand-purple">Rp {totalAmount.toLocaleString()}</span>
            </div>
            {order.order_notes && order.order_notes !== '-' && (
              <div className="mt-4 p-3 border border-slate-100 rounded-xl italic">
                <p className="text-[9px] font-black uppercase text-slate-400 not-italic mb-1">Catatan:</p>
                <p className="text-[10px] text-slate-600 leading-tight">{order.order_notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <div className="flex items-center gap-2 justify-center">
               <div className="h-px bg-slate-200 flex-1"></div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-purple">Terima Kasih</p>
               <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            <p className="text-[9px] text-slate-500 font-medium italic leading-relaxed px-8">
              "Semoga harimu secerah Mornings by SFC. Sampai jumpa di ritual pagi berikutnya!"
            </p>
            <div className="flex justify-center gap-6 pt-2">
               <div className="text-[8px] font-black text-slate-300">MORNINGSBYSFC.MY.ID</div>
               <div className="text-[8px] font-black text-slate-300">@MORNINGSBYSFC</div>
            </div>
          </div>

          {/* Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-neon"></div>
        </div>
      </div>
    </>
  );
}
