import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  MessageSquare, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Truck,
  Megaphone,
  Package,
  BookOpen,
  Book
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn, getGoogleDriveUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BRAND_NAME, METADATA, BRAND_LOGO } from '../constants';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'POS & Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Production', href: '/production', icon: Truck },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Menu Recipes', href: '/recipes', icon: Book },
  { name: 'Promo & Banners', href: '/banners', icon: Megaphone },
  { name: 'Hero Section', href: '/hero', icon: ImageIcon },
  { name: 'About Us', href: '/about', icon: BookOpen },
  { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  { name: 'Site Config', href: '/settings', icon: Settings },
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 sm:w-72 sidebar-glass flex flex-col transform transition-transform duration-500 lg:relative lg:translate-x-0 outline-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-4 sm:p-8">
          <div className="flex items-center gap-2 mb-6 sm:mb-10 px-2 group">
            <img 
               src={getGoogleDriveUrl(BRAND_LOGO)} 
               alt={BRAND_NAME} 
               className="h-8 sm:h-12 w-auto object-contain" 
               referrerPolicy="no-referrer"
               onError={(e) => {
                 (e.currentTarget as HTMLImageElement).style.display = 'none';
               }}
            />
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-black text-white">HQ</span>
              <div className="w-1.5 h-1.5 bg-brand-neon rounded-full" />
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "sidebar-link",
                  isActive && "active"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 transition-colors" />
                <span className="text-xs sm:text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-6">
            <div className="p-3 rounded-lg bg-white/10 flex items-center gap-3 overflow-hidden">
               <div className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0" />
               <div className="overflow-hidden">
                 <p className="text-xs font-bold truncate text-white">Admin User</p>
                 <p className="text-[10px] text-white/60 truncate">{user?.email}</p>
               </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-10 bg-slate-50 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 sm:p-3 bg-white shadow-sm text-slate-900 rounded-xl sm:rounded-2xl"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-brand-purple" />
          </button>
          
          <div className="flex flex-col lg:block flex-1 ml-3 lg:ml-0 overflow-hidden">
            <h2 className="text-sm sm:text-xl lg:text-3xl font-serif font-black text-black tracking-tight truncate">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
            <p className="hidden md:block text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">Live Sync • {METADATA.url ? new URL(METADATA.url).hostname : 'web'}</p>
          </div>

          <div className="flex items-center gap-2 lg:gap-5 relative">
            <button 
              onClick={() => setShowStatus(!showStatus)}
              className="relative p-2 sm:p-3 bg-white shadow-sm border border-slate-200 rounded-xl sm:rounded-2xl text-slate-600 hover:text-brand-purple hover:scale-105 transition-all outline-none"
            >
               <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
               <span className="absolute top-2 right-2 w-2 h-2 bg-brand-neon rounded-full border border-white" />
            </button>

            <AnimatePresence>
              {showStatus && (
                <>
                  <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setShowStatus(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 glass-card p-4 shadow-xl z-50 overflow-hidden"
                  >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">System Health</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm border border-slate-50">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase text-slate-900 leading-none">Google Sheets Sync</p>
                          <p className="text-[10px] text-slate-500 font-medium tracking-tight">Stable • Latency 140ms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm border border-slate-50">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="flex-1">
                           <p className="text-[10px] font-black uppercase text-slate-900 leading-none">Database Engine</p>
                           <p className="text-[10px] text-slate-500 font-medium tracking-tight">All systems operational</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm border border-slate-50">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="flex-1">
                           <p className="text-[10px] font-black uppercase text-slate-900 leading-none">POS Ready</p>
                           <p className="text-[10px] text-slate-500 font-medium tracking-tight">Wait for incoming orders</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
