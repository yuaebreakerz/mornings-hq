/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './components/NotificationProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Testimonials from './pages/Testimonials';
import Hero from './pages/Hero';
import Orders from './pages/Orders';
import Production from './pages/Production';
import Settings from './pages/Settings';
import PromoBanners from './pages/PromoBanners';
import About from './pages/About';
import Recipes from './pages/Recipes';
import DevTracker from './pages/DevTracker';
import SocialPlanner from './pages/SocialPlanner';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/production" element={<Production />} />
                <Route path="/products" element={<Products />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/testimonials" element={<Testimonials />} />
                <Route path="/hero" element={<Hero />} />
                <Route path="/banners" element={<PromoBanners />} />
                <Route path="/about" element={<About />} />
                <Route path="/dev-tracker" element={<DevTracker />} />
                <Route path="/social-planner" element={<SocialPlanner />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}


