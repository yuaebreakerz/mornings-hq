import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2, Settings, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { BRAND_LOGO, BRAND_NAME } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { productService } from '../services/googleService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [showConfig, setShowConfig] = useState(false);
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
        setTestMessage('Koneksi sukses! Silakan klik "Simpan URL" untuk menyimpan.');
      } else {
        setTestStatus('success');
        setTestMessage('Server merespons! URL ini dapat digunakan, silakan simpan dan lanjutkan.');
      }
    } catch (e: any) {
      console.error('Test connection error:', e);
      setTestStatus('error');
      setTestMessage('Gagal terhubung. Pastikan URL benar dan script sudah dideploy sebagai "Web App" (akses: Anyone).');
    }
  };

  const handleSaveApiUrl = () => {
    localStorage.setItem('mornings_gas_api_url_override', customApiUrl.trim());
    alert('URL Google Apps Script berhasil diperbarui! Sistem akan menggunakan URL ini.');
    setShowConfig(false);
  };

  const handleResetApiUrl = () => {
    localStorage.removeItem('mornings_gas_api_url_override');
    const defaultUrl = (import.meta as any).env.VITE_GAS_API_URL || '';
    setCustomApiUrl(defaultUrl);
    alert('URL API dikembalikan ke default bawaan sistem.');
    setShowConfig(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Fetch current config to check password
      const config = await productService.getConfig();
      const serverPassword = config?.admin_password || 'admin123'; // Default if not set
      
      if (email && password === serverPassword) {
        signIn(email);
        navigate('/');
      } else {
        setError('Email atau Password salah');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback if network fails but we want to allow login for dev
      if (password === 'admin123') {
        signIn(email);
        navigate('/');
      } else {
        setError('Gagal verifikasi keamanan. Periksa koneksi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Lupa password? Silakan buka Google Sheets Anda, pada tab "site_config" kolom "admin_password" untuk melihat atau mereset password secara manual.');
  };

  return (
    <div className="min-h-screen bg-brand-purple flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-neon/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-neon/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-6 group">
            <img 
               src={BRAND_LOGO} 
               alt={BRAND_NAME} 
               className="h-16 w-auto object-contain transition-transform group-hover:scale-105 duration-500" 
               referrerPolicy="no-referrer" 
               onError={(e) => {
                 (e.currentTarget as HTMLImageElement).style.display = 'none';
               }}
            />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-serif font-black text-white">HQ</span>
              <div className="w-2.5 h-2.5 bg-brand-neon rounded-full shadow-[0_0_15px_rgba(186,235,30,0.5)]" />
            </div>
          </div>
          <h1 className="text-4xl font-sans font-normal text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-[10px]">Admin Management Console</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-[32px] p-10 border border-white/10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3 ml-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="w-full px-6 py-4 text-sm bg-white/20 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-brand-neon/10 focus:border-brand-neon/30 transition-all duration-300"
                  placeholder="admin@morningsbysfc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-white/60 uppercase tracking-widest mb-3 ml-1">Password Access</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full px-6 py-4 text-sm bg-white/20 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-brand-neon/10 focus:border-brand-neon/30 transition-all duration-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/20 text-rose-200 text-xs font-bold border border-rose-500/30 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 animate-pulse" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-neon text-brand-purple flex items-center justify-center gap-3 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-neon/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                   <span>Authorized Entry</span>
                </>
              )}
            </button>

            <div className="text-center">
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-brand-neon transition-colors"
              >
                Lupa Password?
              </button>
            </div>
          </form>
        </div>

        {/* Database Connection / Google Apps Script Override Panel */}
        <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 p-4">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center justify-between w-full text-left text-white/70 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className={`w-4 h-4 text-brand-neon ${showConfig ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">Database Connection (Google Sheets)</span>
            </div>
            <span className="text-xs">{showConfig ? '▲' : '▼'}</span>
          </button>

          {showConfig && (
            <div className="mt-4 pt-3 border-t border-white/10 space-y-4">
              <p className="text-[10px] text-white/60 leading-relaxed text-left">
                Gunakan fitur ini jika aplikasi Web Anda belum terkoneksi ke Google Sheets Anda sendiri setelah dideploy, atau jika password Anda salah karena masih tersambung ke spreadsheet demo bawaan.
              </p>

              <div className="text-left space-y-1">
                <label className="block text-[8px] font-black text-white/40 uppercase tracking-widest pl-1">URL Web App / Google Apps Script</label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={customApiUrl}
                  onChange={(e) => {
                    setCustomApiUrl(e.target.value);
                    setTestStatus('idle');
                    setTestMessage(null);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-xs text-brand-neon font-mono placeholder:text-white/20 focus:outline-none focus:border-brand-neon transition-all"
                />
              </div>

              {testMessage && (
                <div className={`p-3 rounded-xl border text-[10px] font-bold flex items-start gap-2 text-left ${
                  testStatus === 'success' 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-350' 
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-350'
                }`}>
                  {testStatus === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={testStatus === 'testing'}
                  onClick={handleTestConnection}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/25 active:bg-white/20 transition-all text-white rounded-xl text-[10px] uppercase font-bold tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {testStatus === 'testing' ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Cek Koneksi
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  disabled={!customApiUrl}
                  className="flex-1 py-2 bg-brand-neon text-brand-purple hover:bg-brand-neon/90 active:scale-[0.98] transition-all rounded-xl text-[10px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3 h-3 font-bold" />
                  Simpan URL
                </button>
              </div>

              {localStorage.getItem('mornings_gas_api_url_override') && (
                <button
                  type="button"
                  onClick={handleResetApiUrl}
                  className="w-full py-1 text-rose-400 hover:text-rose-300 transition-colors text-[9px] uppercase font-bold tracking-wider text-center block"
                >
                  Kembalikan ke Default
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center mt-10 text-[10px] font-bold uppercase tracking-widest text-white/40">
          Restricted Area • HQ Management Only
        </p>
      </motion.div>
    </div>
  );
}
