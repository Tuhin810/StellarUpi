
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
  deleteField
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, FamilyMember, TransactionRecord } from '../types';

export const saveUser = async (profile: UserProfile) => {
  await setDoc(doc(db, 'upiAccounts', profile.uid), profile);
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
  await addDoc(collection(db, 'transactions'), {
    ...tx,
    timestamp: serverTimestamp()
  });
};

export const getTransactions = async (stellarId: string) => {
  const q = query(
    collection(db, 'transactions'),
    where('fromId', '==', stellarId),
    orderBy('timestamp', 'desc'),
    limit(20)
  );
  const q2 = query(
    collection(db, 'transactions'),
    where('toId', '==', stellarId),
    orderBy('timestamp', 'desc'),
    limit(20)
  );

  const [s1, s2] = await Promise.all([getDocs(q), getDocs(q2)]);
  const txs = [...s1.docs.map(d => ({ id: d.id, ...d.data() })), ...s2.docs.map(d => ({ id: d.id, ...d.data() }))];
  return (txs as TransactionRecord[]).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
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
  const docRef = await addDoc(collection(db, 'groups'), {
    ...groupData,
    timestamp: serverTimestamp()
  });
  return docRef.id;
};

export const updateGroupMembers = async (groupId: string, members: string[]) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { members });
};

export const getGroups = async (stellarId: string) => {
  const q = query(
    collection(db, 'groups'),
    where('members', 'array-contains', stellarId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const recordSplitExpense = async (expense: any) => {
  await addDoc(collection(db, 'splitExpenses'), {
    ...expense,
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

