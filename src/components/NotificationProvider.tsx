import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { notificationService, NotificationType } from '../services/notificationService';
import { productService } from '../services/googleService';
import { parseItems } from '../lib/utils';

interface NotificationContextProps {
  permissionStatus: 'granted' | 'denied' | 'default';
  isPWAInstalled: boolean;
  requestPermission: () => Promise<boolean>;
  triggerTestNotification: (type: NotificationType) => void;
  lastNotifications: Array<{ id: string; title: string; body: string; time: Date; type: NotificationType }>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [lastNotifications, setLastNotifications] = useState<Array<{ id: string; title: string; body: string; time: Date; type: NotificationType }>>([]);
  const [isPWAInstalled, setIsPWAInstalled] = useState<boolean>(false);
  
  // Track known orders in React memory and localStorage
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef<boolean>(false);

  useEffect(() => {
    // 1. Set initial permission status
    setPermissionStatus(notificationService.getPermissionStatus());

    // 2. Load cached known order IDs from localStorage
    try {
      const cached = localStorage.getItem('known_order_ids');
      if (cached) {
        const list = JSON.parse(cached);
        knownOrderIdsRef.current = new Set(list);
      }
    } catch (e) {
      console.warn('Failed to parse cached known orders:', e);
    }

    // 3. Check if running inside installed standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsPWAInstalled(isStandalone);

    // 4. Perform initial fetch of orders to warm up the database
    const initKnownOrders = async () => {
      try {
        const orders = await productService.getOrders().catch(() => []);
        if (orders && Array.isArray(orders)) {
          console.log(`[Notification Engine] Warming up database with ${orders.length} orders...`);
          // Warm up ID list
          orders.forEach((o: any) => {
            const id = o.id ? o.id.toString() : '';
            if (id) {
              knownOrderIdsRef.current.add(id);
            }
          });
          // Cache to localStorage
          localStorage.setItem('known_order_ids', JSON.stringify(Array.from(knownOrderIdsRef.current)));
        }
        initialFetchDone.current = true;
      } catch (err) {
        console.error('[Notification Engine] Initial fetch warm-up failed:', err);
        // Fallback: don't block
        initialFetchDone.current = true;
      }
    };

    initKnownOrders();

    // 5. Setup periodic background order poller (runs every 35 seconds)
    const pollerInterval = setInterval(async () => {
      if (!initialFetchDone.current) return;

      try {
        const currentOrders = await productService.getOrders().catch(() => []);
        if (!currentOrders || !Array.isArray(currentOrders)) return;

        let detectedNew = false;
        
        currentOrders.forEach((order: any) => {
          const id = order.id ? order.id.toString() : '';
          if (!id) return;

          // If this is a completely brand new order ID
          if (!knownOrderIdsRef.current.has(id)) {
            knownOrderIdsRef.current.add(id);
            detectedNew = true;

            const orderNumber = order.order_number || id.slice(-6).toUpperCase() || 'NEW';
            const customerName = order.customer_name || 'Pelanggan';
            const totalAmount = order.total_amount ? Number(order.total_amount) : 0;
            
            const title = `🛒 Pesanan Baru Masuk! #${orderNumber}`;
            const body = `Pesanan dari ${customerName} senilai Rp ${totalAmount.toLocaleString()} siap diproses.`;

            // Trigger notification banner + sound
            notificationService.show(title, body, 'new_order');

            // Save to internal notifications log
            setLastNotifications(prev => [
              { id, title, body, time: new Date(), type: 'new_order' },
              ...prev.slice(0, 9) // Limit to 10 logs
            ]);
          }
        });

        if (detectedNew) {
          // Save updated list to localStorage
          localStorage.setItem('known_order_ids', JSON.stringify(Array.from(knownOrderIdsRef.current)));
        }
      } catch (err) {
        console.warn('Notification poller failed to retrieve new orders:', err);
      }
    }, 35000); // 35 seconds interval matches safe Apps Script quota usage

    return () => clearInterval(pollerInterval);
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(notificationService.getPermissionStatus());
    
    // Play test system sound if granted to celebrate
    if (granted) {
      notificationService.playAlertSound('system');
    }
    
    return granted;
  };

  const triggerTestNotification = (type: NotificationType) => {
    if (type === 'new_order') {
      const mockId = Math.floor(Math.random() * 999).toString();
      const title = `🛒 [TEST] Orderan Masuk #${mockId}`;
      const body = `Mornings Ritual Smoothie Bowl pesanan dari Pelanggan Baru (Rp 85.000)`;
      notificationService.show(title, body, 'new_order');
      
      setLastNotifications(prev => [
        { id: 'test_' + mockId, title, body, time: new Date(), type: 'new_order' },
        ...prev.slice(0, 9)
      ]);
    } else {
      const title = `🔔 [TEST] Notifikasi Sistem`;
      const body = `Koneksi Google Sheets stabil. Semua pemicu IoT dapur siaga.`;
      notificationService.show(title, body, 'system');

      setLastNotifications(prev => [
        { id: 'test_sys_' + Date.now(), title, body, time: new Date(), type: 'system' },
        ...prev.slice(0, 9)
      ]);
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        permissionStatus, 
        isPWAInstalled,
        requestPermission, 
        triggerTestNotification,
        lastNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
