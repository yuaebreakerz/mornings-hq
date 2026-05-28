/**
 * Mornings HQ - Dynamic Notification Service
 * Support: 
 * 1. Capacitor Native LocalNotifications (Android Phone/Tablet APK)
 * 2. Standard Web Browser / PWA Notification API
 * 3. Native Audio Synthesis (via Web Audio API) to ensure sound cues play reliably
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export type NotificationType = 'system' | 'new_order';

class NotificationService {
  private isNative: boolean;
  private hasPermission: boolean = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.checkInitialPermissions();
  }

  private async checkInitialPermissions() {
    try {
      if (this.isNative) {
        const status = await LocalNotifications.checkPermissions();
        this.hasPermission = status.display === 'granted';
      } else if ('Notification' in window) {
        this.hasPermission = Notification.permission === 'granted';
      }
    } catch (e) {
      console.warn('Initial permission check error:', e);
    }
  }

  /**
   * Request push/local notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        const permission = await LocalNotifications.requestPermissions();
        this.hasPermission = permission.display === 'granted';
        return this.hasPermission;
      } else if ('Notification' in window) {
        const status = await Notification.requestPermission();
        this.hasPermission = status === 'granted';
        return this.hasPermission;
      }
      return false;
    } catch (e) {
      console.error('Request permission failed:', e);
      return false;
    }
  }

  /**
   * Check if notifications are allowed
   */
  getPermissionStatus(): 'granted' | 'denied' | 'default' {
    if (this.isNative) {
      return this.hasPermission ? 'granted' : 'default';
    } else if ('Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  }

  /**
   * Plays a physical alert chime sound using Web Audio API synthesis
   * No external sound file is needed!
   */
  playAlertSound(type: NotificationType = 'system') {
    try {
      // Lazy load AudioContext
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;

      if (type === 'new_order') {
        // High attention dual-tone bell (chime)
        const playTone = (time: number, freq: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          
          gainNode.gain.setValueAtTime(0.3, time);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
          
          osc.start(time);
          osc.stop(time + duration);
        };

        const now = ctx.currentTime;
        // Chime melodis (ting, ting, tong!)
        playTone(now, 880, 0.25); // A5
        playTone(now + 0.15, 1046.5, 0.25); // C6
        playTone(now + 0.35, 1318.5, 0.4); // E6
      } else {
        // Subtle system double click notification
        const playSystemTone = () => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
          
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.18);
        };
        playSystemTone();
      }
    } catch (e) {
      console.warn('Silent fallback: Audio API not supported yet/user interaction needed', e);
    }
  }

  /**
   * Triggers a localized active notification modal/popup
   */
  async show(title: string, body: string, type: NotificationType = 'system') {
    // 1. Play alert sound automatically
    this.playAlertSound(type);

    // 2. Schedule push-notification banner
    try {
      if (this.isNative) {
        // Native APK local notifications (with sound settings config if loaded)
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 100000),
              title,
              body,
              schedule: { at: new Date(Date.now() + 50) },
              sound: 'beep.wav',
              attachments: [],
              actionTypeId: '',
              extra: { type }
            }
          ]
        });
        console.log(`[Native Notification] Sent: "${title}"`);
      } else if (this.hasPermission && 'Notification' in window) {
        // Standard PWA web browser banner notification
        const reg = await navigator.serviceWorker.ready.catch(() => null);
        const options = {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: type === 'new_order' ? [200, 100, 200, 100, 200] : [100, 50, 100],
          tag: type,
          renotify: true
        };

        if (reg) {
          await reg.showNotification(title, options);
        } else {
          new Notification(title, options);
        }
        console.log(`[Web Notification] Sent: "${title}"`);
      } else {
        console.log(`[In-App Notification Dialog] Title: "${title}", Body: "${body}"`);
      }
    } catch (e) {
      console.error('Failed to trigger notification:', e);
    }
  }
}

export const notificationService = new NotificationService();
