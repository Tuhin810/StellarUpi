
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
  pin?: string;
  dailyLimit?: number;
  spentToday?: number;
  lastSpentDate?: string;
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
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  memo?: string;
  txHash?: string;
  isFamilySpend: boolean;
  spenderId?: string;
  category?: 'Shopping' | 'Food' | 'Travel' | 'Bills' | 'Entertainment' | 'Other';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  amount?: number;
  type: 'text' | 'payment' | 'request';
  timestamp: any;
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  txHash?: string;
  groupId?: string; // If this belongs to a group context
}

export interface SplitGroup {
  id: string;
  name: string;
  members: string[]; // List of stellarIds
  createdBy: string;
  avatarSeed: string;
  timestamp: any;
}

export interface SplitExpense {
  id: string;
  groupId: string;
  description: string;
  totalAmount: number;
  paidBy: string; // stellarId
  splitType: 'equal' | 'percentage';
  participants: {
    stellarId: string;
    amount: number;
    status: 'PENDING' | 'PAID';
    txHash?: string;
  }[];
  timestamp: any;
}
