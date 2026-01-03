
export interface UserProfile {
  uid: string;
  email: string;
  stellarId: string; // e.g. "alex@stellar"
  publicKey: string;
  encryptedSecret: string;
  isFamilyOwner: boolean;
  ownerId?: string; // For family members, points to the owner's UID
  displayName?: string;
  avatarSeed?: string;
}

export interface FamilyMember {
  id: string; // Firebase Doc ID
  stellarId: string;
  uid: string;
  dailyLimit: number;
  spentToday: number;
  lastSpentDate: string; // ISO date
  active: boolean;
}

export interface TransactionRecord {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  amount: number;
  currency: string;
  timestamp: any;
  status: 'SUCCESS' | 'FAILED';
  memo?: string;
  txHash?: string;
  isFamilySpend: boolean;
  spenderId?: string;
}
