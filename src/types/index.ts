export type TransactionType = 'expense' | 'income' | 'transfer';
export type SpendingNature = 'need' | 'want'; // Kebutuhan vs Keinginan/Fomo
export type SpendingMood = 'worth' | 'neutral' | 'regret'; // 🤩 Worth it, 😐 B aja, 😭 Nyesel

export interface Wallet {
  id: string;
  name: string;
  type: 'bank' | 'ewallet' | 'cash' | 'other';
  balance: number;
  color: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  targetWalletId?: string; // Khusus transfer
  category: string;
  note?: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  // Fitur Jurnaling Emosi
  nature?: SpendingNature;
  mood?: SpendingMood;
  // Fitur Bukti Struk / Invoice (Base64 WebP/JPEG terkompresi)
  receiptImage?: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  monthlyLimit: number;
}

// 1. Tabungan Impian / Kantong Target
export interface WishlistTarget {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  itemUrl?: string; // Link barang/keinginan (misal: Tokopedia, Shopee, website)
  categoryIcon?: string;
  isCompleted?: boolean;
  cooldownUntil?: number; // Timestamp waktu penahanan diri (Cooldown timer anti-FOMO)
  createdAt: number;
}

// 2. Catatan Hutang / Piutang Teman
export interface DebtMemo {
  id: string;
  personName: string;
  type: 'lent' | 'borrowed'; // lent = kita minjemin, borrowed = kita yang ngutang
  amount: number;
  description: string;
  isSettled: boolean;
  dueDate?: string;
  createdAt: number;
}

// 3. Detektor Langganan Rutin (Subscription Tracker)
export interface Subscription {
  id: string;
  name: string; // e.g. "Spotify Family", "Netflix", "iCloud 200GB"
  amount: number;
  billingDay: number; // Tanggal tagihan (1 - 31)
  walletId: string; // Dompet pembayaran default
  category?: string;
  isActive: boolean;
  createdAt: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  iconName: string;
  type: 'expense' | 'income';
}
