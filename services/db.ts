
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
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, FamilyMember, TransactionRecord } from '../types';

export const saveUser = async (profile: UserProfile) => {
  await setDoc(doc(db, 'upiAccounts', profile.uid), profile);
  // Also create a mapping for ID lookup
  await setDoc(doc(db, 'ids', profile.stellarId), { uid: profile.uid, publicKey: profile.publicKey });
};

export const getUserById = async (stellarId: string): Promise<{uid: string, publicKey: string} | null> => {
  const snap = await getDoc(doc(db, 'ids', stellarId));
  if (snap.exists()) return snap.data() as {uid: string, publicKey: string};
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
  const txs = [...s1.docs.map(d => ({id: d.id, ...d.data()})), ...s2.docs.map(d => ({id: d.id, ...d.data()}))];
  return (txs as TransactionRecord[]).sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
};

export const addFamilyMember = async (ownerUid: string, memberId: string, limit: number) => {
  const targetIdInfo = await getUserById(memberId);
  if (!targetIdInfo) throw new Error("Member ID not found");

  await addDoc(collection(db, 'family'), {
    ownerUid,
    stellarId: memberId,
    uid: targetIdInfo.uid,
    dailyLimit: limit,
    spentToday: 0,
    lastSpentDate: new Date().toISOString().split('T')[0],
    active: true
  });
};

export const getFamilyMembers = async (ownerUid: string) => {
  const q = query(collection(db, 'family'), where('ownerUid', '==', ownerUid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyMember));
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

export const updateUserDetails = async (uid: string, data: { displayName?: string, avatarSeed?: string }) => {
  await updateDoc(doc(db, 'upiAccounts', uid), data);
};
