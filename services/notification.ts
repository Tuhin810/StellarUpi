
/// <reference types="vite/client" />
import OneSignal from 'react-onesignal';
import { db } from "./firebase";
import { collection, query, where, onSnapshot, limit, orderBy, updateDoc, doc } from "firebase/firestore";
import axios from 'axios';

export const NotificationService = {
  _isInitialized: false,

  /**
   * Initialize OneSignal
   */
  async init(uid?: string) {
    try {
      if (!this._isInitialized) {
        await OneSignal.init({
          appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "28cc51dc-70f9-4f27-b879-53cf2c9fa84f",
          safari_web_id: "web.onesignal.auto.12f40fc9-13d7-4ca9-8e4a-0a7d50f473bf",
          allowLocalhostAsSecureOrigin: true,
        });
        this._isInitialized = true;
        console.log('OneSignal initialized successfully');
      }

      if (uid) {
        console.log('Logging in to OneSignal with UID:', uid);
        await OneSignal.login(uid);
      }
    } catch (error) {
      console.error('Error initializing OneSignal:', error);
    }
  },

  async checkStatus() {
    try {
      return {
        permission: OneSignal.Notifications?.permission || 'unknown',
        subscriptionId: OneSignal.User?.PushSubscription?.id || null,
        isLoaded: true,
      };
    } catch (e) {
      return { permission: 'error', isLoaded: false };
    }
  },

  /**
   * Request permission for notifications
   */
  async requestPermission() {
    try {
      console.log('Requesting notification permission...');
      await OneSignal.Slidedown.promptPush();
      console.log('Permission prompt shown');
    } catch (error) {
      console.error('Error in NotificationService.requestPermission:', error);
    }
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
      console.log(`Triggering remote push for ${targetStellarId}...`);

      const response = await axios.post('/api/notify', {
        recipientUserId: targetStellarId,
        amount,
        senderName,
        title,
        message
      });

      console.log('Notification API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to trigger remote notification:', error);
      return { success: false, error: (error as any).message };
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
            tag: 'stellarpay-update'
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

