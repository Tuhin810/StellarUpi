
import { getToken, onMessage } from "firebase/messaging";
import { messaging, db } from "./firebase";
import { doc, updateDoc, collection, query, where, onSnapshot, limit, orderBy, getDocs } from "firebase/firestore";

export const NotificationService = {
  /**
   * Request permission for notifications and get the FCM token
   */
  async requestPermission(uid: string) {
    if (!messaging) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BD2eeczB-UOqN16mh7QgoKrERRHYVheswpnCqQpU5-qXT2ik4DVAU5ga3maYv-NfBwEv43160Z6ACK-tkhWyR2E'
        });

        if (token) {
          console.log('FCM Token generated:', token);
          await updateDoc(doc(db, 'upiAccounts', uid), {
            fcmToken: token,
            notificationsEnabled: true
          });
          return token;
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    return null;
  },

  /**
   * Listener for incoming payments and group splits
   */
  setupRealtimeNotifications(stellarId: string) {
    if (!("Notification" in window)) return;

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
          this.sendLocalNotification(
            "Payment Received! 💰",
            `You received ₹${tx.amount} from ${tx.fromName || tx.fromId}`,
            '/icon-192.png'
          );
        }
      });
    });

    // 2. Listen for new group expenses (splits)
    const groupQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', stellarId)
    );

    const groupSubs: (() => void)[] = [];
    const unsubGroups = onSnapshot(groupQuery, (snap) => {
      // For each group, listen to expenses
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
    });

    return () => {
      unsubTx();
      unsubGroups();
      groupSubs.forEach(u => u());
    };
  },

  onForegroundMessage(callback: (payload: any) => void) {
    if (!messaging) return;
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  },

  /**
   * Manually trigger a remote push notification via Netlify Functions
   */
  async triggerRemoteNotification(targetStellarId: string, title: string, body: string, extraData: any = {}) {
    try {
      if (!db) return;
      // 1. Get the target user's token from Firestore
      const userDoc = await getDocs(query(collection(db, 'upiAccounts'), where('stellarId', '==', targetStellarId), limit(1)));
      
      if (userDoc.empty) return;
      const userData = userDoc.docs[0].data();
      
      if (!userData.fcmToken || !userData.notificationsEnabled) return;

      // 2. Call the Netlify function
      const response = await fetch('/.netlify/functions/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: userData.fcmToken,
          title,
          body,
          data: extraData
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to trigger remote notification:', error);
    }
  },

  async sendLocalNotification(title: string, body: string, icon: string = '/icon-192.png') {
    if (Notification.permission === "granted") {
      try {
        // Try SW notification first (better experience)
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          // @ts-ignore - vibrate is supported in SW notifications but not in all Notification types
          registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            vibrate: [200, 100, 200],
            tag: 'stellarpay-update'
          } as any);
        } else {
          // Fallback to basic notification
          new Notification(title, { body, icon });
        }
      } catch (e) {
        new Notification(title, { body, icon });
      }
    }
  }
};
