
import { db } from "./firebase";
import { collection, query, where, onSnapshot, limit, orderBy, addDoc, serverTimestamp } from "firebase/firestore";

export type InAppNotificationType = 'success' | 'error' | 'info' | 'payment' | 'split';

export const NotificationService = {
  /**
   * Send an in-app notification to another user via Firestore
   */
  async sendInAppNotification(
    targetStellarId: string,
    title: string,
    message: string,
    type: InAppNotificationType = 'info'
  ) {
    try {
      console.log(`Sending in-app notification to ${targetStellarId}...`);
      await addDoc(collection(db, 'notifications'), {
        toId: targetStellarId,
        title,
        message,
        type,
        read: false,
        timestamp: serverTimestamp()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Failed to send in-app notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Listener for incoming events (Payments, Splits, and In-App Notifications)
   */
  setupRealtimeNotifications(stellarId: string, onNotify: (title: string, message: string, type: InAppNotificationType) => void) {
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
          console.log('Incoming transaction detected');
          onNotify(
            "Payment Received! 💰",
            `You received ₹${tx.amount} from ${tx.fromName || tx.fromId}`,
            'payment'
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
                onNotify(
                  `New Split in ${groupDoc.data().name} 👥`,
                  `${expense.description}: Total ₹${expense.totalAmount} split by ${expense.paidBy.split('@')[0]}`,
                  'split'
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

    // 3. Listen for specific In-App Notifications
    const notifyQuery = query(
      collection(db, 'notifications'),
      where('toId', '==', stellarId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    let initialNotifyLoad = true;
    const unsubNotify = onSnapshot(notifyQuery, (snap) => {
      if (initialNotifyLoad) {
        initialNotifyLoad = false;
        return;
      }
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          onNotify(data.title, data.message, data.type as InAppNotificationType);
        }
      });
    }, (error) => {
      console.error('Firestore Notifications listener error:', error);
    });

    return () => {
      unsubTx();
      unsubGroups();
      unsubNotify();
      groupSubs.forEach(u => u());
    };
  }
};

