
/// <reference types="vite/client" />
import OneSignal from 'react-onesignal';
import { db } from "./firebase";
import { collection, query, where, onSnapshot, limit, orderBy, updateDoc, doc } from "firebase/firestore";
import axios from 'axios';

export const NotificationService = {
  _isInitialized: false,
  _isInitializing: false,

  /**
   * Initialize OneSignal
   */
  async init(uid?: string) {
    if (this._isInitializing) return;
    this._isInitializing = true;

    try {
      // @ts-ignore
      window.OneSignalDeferred = window.OneSignalDeferred || [];

      return new Promise<void>((resolve) => {
        // @ts-ignore
        window.OneSignalDeferred.push(async (OneSignal) => {
          try {
            // @ts-ignore
            if (!OneSignal.initialized) {
              await OneSignal.init({
                appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "03d252b2-074b-4d2d-866e-5560da7cb094",
                safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_ID || "web.onesignal.auto.36762c33-c595-4251-8e66-ea9a822d3713",
                allowLocalhostAsSecureOrigin: true,
                // @ts-ignore
                notifyButton: { enable: true }
              });
              console.log('OneSignal init success');
            }

            this._isInitialized = true;
            this._isInitializing = false;

            if (uid) {
              console.log('Syncing OneSignal User:', uid);
              await OneSignal.login(uid);
            }
            resolve();
          } catch (err: any) {
            console.error('OneSignal Deferred Error:', err);
            this._isInitializing = false;
            resolve();
          }
        });
      });
    } catch (error: any) {
      this._isInitializing = false;
      console.error('OneSignal Init Wrapper Error:', error);
    }
  },

  async checkStatus() {
    return new Promise((resolve) => {
      // @ts-ignore
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      // @ts-ignore
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          // @ts-ignore
          const permission = Notification.permission;
          const subscriptionId = OneSignal.User?.PushSubscription?.id;
          resolve({
            permission: permission,
            subscriptionId: subscriptionId || null,
            isLoaded: true,
          });
        } catch (e) {
          resolve({ permission: 'error', isLoaded: false });
        }
      });
    });
  },

  /**
   * Request permission for notifications
   */
  async requestPermission(force: boolean = false) {
    // @ts-ignore
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    // @ts-ignore
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        console.log('Requesting notification permission...');
        // @ts-ignore
        if (Notification.permission === 'denied') {
          console.warn('Notifications are denied by the browser.');
          return;
        }
        await OneSignal.Slidedown.promptPush({ force });
      } catch (error) {
        console.error('Error in Slidedown prompt:', error);
      }
    });
  },

  /**
   * Listener for incoming payments and group splits
   * (Keeping this as it uses Firestore for real-time UI updates/local notifications)
   */
  setupRealtimeNotifications(stellarId: string) {
    if (!("Notification" in window)) return;
    console.log(`Setting up realtime notifications for: ${stellarId}`);

    // 1. Listen for new incoming transactions
    const txQuery = query(
      collection(db, 'transactions'),
      where('toId', '==', stellarId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    let initialTxLoad = true;
    const unsubTx = onSnapshot(txQuery, (snap) => {
      if (initialTxLoad) {
        initialTxLoad = false;
        return;
      }
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const tx = change.doc.data();
          console.log('Incoming transaction detected via Firestore listener');
          this.sendLocalNotification(
            "Payment Received! 💰",
            `You received ₹${tx.amount} from ${tx.fromName || tx.fromId}`,
            '/icon-192.png'
          );
        }
      });
    }, (error) => {
      console.error('Firestore TX listener error:', error);
    });

    // 2. Listen for new group expenses (splits)
    const groupQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', stellarId)
    );

    const groupSubs: (() => void)[] = [];
    const unsubGroups = onSnapshot(groupQuery, (snap) => {
      snap.docs.forEach((groupDoc) => {
        const expenseQuery = query(
          collection(db, 'splitExpenses'),
          where('groupId', '==', groupDoc.id),
          orderBy('timestamp', 'desc'),
          limit(1)
        );

        let initialExpenseLoad = true;
        const unsubExpense = onSnapshot(expenseQuery, (expenseSnap) => {
          if (initialExpenseLoad) {
            initialExpenseLoad = false;
            return;
          }
          expenseSnap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const expense = change.doc.data();
              if (expense.paidBy !== stellarId) {
                console.log('New split detected via Firestore listener');
                this.sendLocalNotification(
                  `New Split in ${groupDoc.data().name} 👥`,
                  `${expense.description}: Total ₹${expense.totalAmount} split by ${expense.paidBy.split('@')[0]}`,
                  '/icon-192.png'
                );
              }
            }
          });
        });
        groupSubs.push(unsubExpense);
      });
    }, (error) => {
      console.error('Firestore Group listener error:', error);
    });

    return () => {
      unsubTx();
      unsubGroups();
      groupSubs.forEach(u => u());
    };
  },

  /**
   * Trigger a remote push notification via Vercel Serverless Function
   */
  async triggerRemoteNotification(
    targetStellarId: string | string[],
    amount?: string,
    senderName?: string,
    title?: string,
    message?: string
  ) {
    try {
      console.log(`Attempting to trigger remote push for ${targetStellarId}...`);

      // Avoid 404 errors during local development if the backend isn't running
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('pinggy.link')) {
        console.warn('Remote notification skipped: Backend API (/api/notify) is only available when deployed to Netlify.');
        return { success: true, mocked: true };
      }

      const response = await axios.post('/api/notify', {
        recipientUserId: targetStellarId,
        amount,
        senderName,
        title,
        message
      });

      console.log('Notification API response:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('Notification API not found (404). This is expected in local dev unless you are running Netlify Dev.');
      } else {
        console.error('Failed to trigger remote notification:', error);
      }
      return { success: false, error: error.message };
    }
  },


  async sendLocalNotification(title: string, body: string, icon: string = '/icon-192.png') {
    console.log('Sending local notification:', title);
    if (Notification.permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          // @ts-ignore
          registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            vibrate: [200, 100, 200],
            tag: 'Ching Pay-update'
          } as any);
        } else {
          new Notification(title, { body, icon });
        }
      } catch (e) {
        console.error('Local notification error:', e);
        new Notification(title, { body, icon });
      }
    } else {
      console.warn('Local notification suppressed: Permission not granted');
    }
  }
};

