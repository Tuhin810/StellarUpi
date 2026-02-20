
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  updateDoc,
  increment,
  deleteDoc,
  deleteField,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, FamilyMember, TransactionRecord, SubscriptionPlan, UserSubscription } from '../types';
import { getNetworkConfig } from '../context/NetworkContext';

export const saveUser = async (profile: UserProfile) => {
  const data = {
    ...profile,
    createdAt: profile.createdAt || new Date().toISOString()
  };
  await setDoc(doc(db, 'upiAccounts', profile.uid), data);
  // Also create a mapping for ID lookup
  await setDoc(doc(db, 'ids', profile.stellarId), { uid: profile.uid, publicKey: profile.publicKey });
};

export const getUserById = async (stellarId: string): Promise<{ uid: string, publicKey: string } | null> => {
  const snap = await getDoc(doc(db, 'ids', stellarId));
  if (snap.exists()) return snap.data() as { uid: string, publicKey: string };
  return null;
};

export const getProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'upiAccounts', uid));
  if (snap.exists()) return snap.data() as UserProfile;
  return null;
};

export const getProfileByStellarId = async (stellarId: string): Promise<UserProfile | null> => {
  const idInfo = await getUserById(stellarId);
  if (!idInfo) return null;
  return getProfile(idInfo.uid);
};

export const recordTransaction = async (tx: Partial<TransactionRecord>) => {
  const network = localStorage.getItem('stellar_network') === 'mainnet' ? 'mainnet' : 'testnet';
  await addDoc(collection(db, 'transactions'), {
    ...tx,
    network,
    timestamp: serverTimestamp()
  });
};

export const getTransactions = async (stellarId: string) => {
  const network = localStorage.getItem('stellar_network') || 'testnet';

  try {
    // We remove orderBy from the Firestore query to avoid the need for composite indexes.
    // Instead, we sort the results in memory.
    const q1 = query(
      collection(db, 'transactions'),
      where('fromId', '==', stellarId),
      limit(100)
    );
    const q2 = query(
      collection(db, 'transactions'),
      where('toId', '==', stellarId),
      limit(100)
    );

    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    // Deduplicate in case a user sent a transaction to themselves
    const txMap = new Map<string, TransactionRecord>();

    s1.docs.forEach(d => txMap.set(d.id, { id: d.id, ...d.data() } as TransactionRecord));
    s2.docs.forEach(d => txMap.set(d.id, { id: d.id, ...d.data() } as TransactionRecord));

    const allTxs = Array.from(txMap.values());

    // Filter by network and then sort by timestamp descending
    return allTxs
      .filter(tx => (tx.network || 'testnet') === network)
      .sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

  } catch (err) {
    console.error("Firestore Error in getTransactions:", err);
    return [];
  }
};

export const addFamilyMember = async (ownerUid: string, memberId: string, limit: number, encryptedOwnerSecret?: string) => {
  const targetIdInfo = await getUserById(memberId);
  if (!targetIdInfo) throw new Error("Member ID not found");

  await addDoc(collection(db, 'family'), {
    ownerUid,
    stellarId: memberId,
    uid: targetIdInfo.uid,
    dailyLimit: limit,
    spentToday: 0,
    lastSpentDate: new Date().toISOString().split('T')[0],
    active: true,
    sharedSecret: encryptedOwnerSecret || null
  });
};

export const getFamilyMembers = async (ownerUid: string) => {
  const q = query(collection(db, 'family'), where('ownerUid', '==', ownerUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyMember));
};

export const getTransactionById = async (id: string): Promise<TransactionRecord | null> => {
  const snap = await getDoc(doc(db, 'transactions', id));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as TransactionRecord;
  }
  return null;
};

export const removeFamilyMember = async (memberDocId: string) => {
  await deleteDoc(doc(db, 'family', memberDocId));
};

export const updateFamilySpend = async (memberDocId: string, amount: number) => {
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'family', memberDocId);
  const snap = await getDoc(ref);
  const data = snap.data() as FamilyMember;

  if (data.lastSpentDate !== today) {
    await updateDoc(ref, {
      spentToday: amount,
      lastSpentDate: today
    });
  } else {
    await updateDoc(ref, {
      spentToday: increment(amount)
    });
  }
};

export const updateUserDetails = async (uid: string, data: Partial<UserProfile>) => {
  await updateDoc(doc(db, 'upiAccounts', uid), data);
};

export const updatePersonalSpend = async (uid: string, amount: number) => {
  const today = new Date().toISOString().split('T')[0];
  const ref = doc(db, 'upiAccounts', uid);
  const snap = await getDoc(ref);
  const data = snap.data() as UserProfile;

  if (data.lastSpentDate !== today) {
    await updateDoc(ref, {
      spentToday: amount,
      lastSpentDate: today
    });
  } else {
    await updateDoc(ref, {
      spentToday: increment(amount)
    });
  }
};

export const createGroup = async (groupData: any) => {
  const network = localStorage.getItem('stellar_network') || 'testnet';
  const docRef = await addDoc(collection(db, 'groups'), {
    ...groupData,
    network,
    timestamp: serverTimestamp()
  });
  return docRef.id;
};

export const updateGroupMembers = async (groupId: string, members: string[]) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { members });
};

export const getGroups = async (stellarId: string) => {
  const network = localStorage.getItem('stellar_network') || 'testnet';
  const q = query(
    collection(db, 'groups'),
    where('members', 'array-contains', stellarId),
    where('network', '==', network)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const recordSplitExpense = async (expense: any) => {
  const network = localStorage.getItem('stellar_network') || 'testnet';
  await addDoc(collection(db, 'splitExpenses'), {
    ...expense,
    network,
    timestamp: serverTimestamp()
  });
};

export const getGroupExpenses = async (groupId: string) => {
  const q = query(
    collection(db, 'splitExpenses'),
    where('groupId', '==', groupId),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const searchUsers = async (searchTerm: string): Promise<UserProfile[]> => {
  if (!searchTerm) return [];
  const term = searchTerm.toLowerCase();

  // 1. Check exact stellarId
  const qId = query(collection(db, 'upiAccounts'), where('stellarId', '==', term));
  const sId = await getDocs(qId);
  if (!sId.empty) return sId.docs.map(d => d.data() as UserProfile);

  // 2. Check exact publicKey
  const qPk = query(collection(db, 'upiAccounts'), where('publicKey', '==', searchTerm));
  const sPk = await getDocs(qPk);
  if (!sPk.empty) return sPk.docs.map(d => d.data() as UserProfile);

  // 3. Prefix search on displayName
  // Note: This matches "John" with "John Doe", but is case sensitive in Firestore
  const qName = query(
    collection(db, 'upiAccounts'),
    where('displayName', '>=', searchTerm),
    where('displayName', '<=', searchTerm + '\uf8ff'),
    limit(5)
  );
  const sName = await getDocs(qName);
  return sName.docs.map(d => d.data() as UserProfile);
};

export const getUsersByPhones = async (phoneNumbers: string[]): Promise<UserProfile[]> => {
  if (!phoneNumbers || phoneNumbers.length === 0) return [];

  // Firestore 'in' query supports up to 10 elements. 
  // For larger contact lists, we need to batch the requests.
  const users: UserProfile[] = [];
  const batchSize = 10;

  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    const batch = phoneNumbers.slice(i, i + batchSize);
    const q = query(collection(db, 'upiAccounts'), where('phoneNumber', 'in', batch));
    const snap = await getDocs(q);
    snap.docs.forEach(d => users.push(d.data() as UserProfile));
  }

  return users;
};

export const updateSplitPayment = async (splitId: string, payerStellarId: string) => {
  const ref = doc(db, 'splitExpenses', splitId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const participants = data.participants.map((p: any) =>
      p.stellarId === payerStellarId ? { ...p, status: 'PAID' } : p
    );
    await updateDoc(ref, { participants });
  }
};

export const updateRequestStatus = async (requestId: string, status: 'PAID' | 'REJECTED') => {
  const ref = doc(db, 'chats', requestId);
  await updateDoc(ref, { status });
};

// Subscriptions & Autopay
export const createUserSubscription = async (sub: Partial<UserSubscription>) => {
  const id = `${sub.userId}_${sub.planId}`;
  await setDoc(doc(db, 'userSubscriptions', id), {
    ...sub,
    status: 'active',
    createdAt: serverTimestamp()
  });
};

export const getUserSubscriptions = async (userId: string): Promise<UserSubscription[]> => {
  const q = query(
    collection(db, 'userSubscriptions'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as UserSubscription))
    .filter(s => s.status !== 'cancelled');
};

export const cancelSubscription = async (subId: string) => {
  await updateDoc(doc(db, 'userSubscriptions', subId), {
    status: 'cancelled'
  });
};

export const getSubscriptionPlan = async (planId: string): Promise<SubscriptionPlan | null> => {
  const snap = await getDoc(doc(db, 'subscriptionPlans', planId));
  if (snap.exists()) return { id: snap.id, ...snap.data() } as SubscriptionPlan;
  return null;
};

export const getRealCoupons = async () => {
  const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Records a Chillar deposit to Gullak in Firebase
 */
export const recordGullakDeposit = async (uid: string, amountINR: number) => {
  const userRef = doc(db, 'upiAccounts', uid);
  await updateDoc(userRef, {
    totalSavingsINR: increment(amountINR)
  });
};

/**
 * Calculates and applies "Protocol Yield" to the Gullak
 * No smart contracts needed - logic based growth.
 */
export const applyGullakYield = async (uid: string) => {
  const userRef = doc(db, 'upiAccounts', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const profile = snap.data() as UserProfile;
  if (!profile.totalSavingsINR || profile.totalSavingsINR <= 0) return;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const lastDate = profile.lastYieldDate;

  // If already processed today, skip
  if (lastDate === today) return;

  // Calculate days passed (capped at 30 days to prevent runaway yielding if they disappear)
  const lastDateObj = lastDate ? new Date(lastDate) : new Date();
  const diffDays = Math.min(30, Math.floor((now.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24)));

  if (diffDays <= 0 && lastDate) return;

  // Define Daily Yield Rates based on Streak Level
  // Orange: ~3.6% APR | Blue: ~11% APR | Purple: ~18% APR
  const rates = {
    orange: 0.0001,
    blue: 0.0003,
    purple: 0.0005
  };

  const dailyRate = rates[profile.streakLevel || 'orange'];
  const yieldAmount = profile.totalSavingsINR * dailyRate * (diffDays || 1);

  if (yieldAmount > 0) {
    await updateDoc(userRef, {
      totalSavingsINR: increment(yieldAmount),
      totalYieldEarnedINR: increment(yieldAmount),
      lastYieldDate: today
    });
    return yieldAmount;
  } else {
    // Just update the date if amount is too small
    await updateDoc(userRef, { lastYieldDate: today });
  }
};

/**
 * Updates the user's daily savings streak.
 * Called after a successful Chillar transaction.
 */
export const updateStreak = async (uid: string) => {
  const userRef = doc(db, 'upiAccounts', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const profile = snap.data() as UserProfile;
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // If already saved today, don't increment streak again but update date
  if (profile.lastChillarDate === today) return;

  let newStreak = 1;
  if (profile.lastChillarDate) {
    const lastDate = new Date(profile.lastChillarDate);
    const diffInDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 1) {
      // Consecutive day
      newStreak = (profile.currentStreak || 0) + 1;
    } else if (diffInDays === 0) {
      // Same day (should be caught by string check above but safer)
      newStreak = profile.currentStreak || 1;
    } else {
      // Missed a day
      newStreak = 1;
    }
  }

  // Determine level
  let level: 'orange' | 'blue' | 'purple' = 'orange';
  if (newStreak >= 15) level = 'purple';
  else if (newStreak >= 5) level = 'blue';

  await updateDoc(userRef, {
    currentStreak: newStreak,
    lastChillarDate: today,
    streakHistory: arrayUnion(today),
    streakLevel: level
  });

  return { newStreak, level };
};

