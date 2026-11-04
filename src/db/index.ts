import Dexie, { type Table } from 'dexie';
import type { Wallet, Transaction, Budget, WishlistTarget, DebtMemo, Subscription } from '../types';

export class DiduitinDatabase extends Dexie {
  wallets!: Table<Wallet, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  wishlists!: Table<WishlistTarget, string>;
  debts!: Table<DebtMemo, string>;
  subscriptions!: Table<Subscription, string>;

  constructor() {
    super('diduitin_db_prod'); // Menggunakan nama database clean baru khusus rilis produksi
    this.version(1).stores({
      wallets: 'id, name, type, createdAt',
      transactions: 'id, type, walletId, category, date, timestamp, nature, mood',
      budgets: 'id, month',
      wishlists: 'id, title, targetAmount, savedAmount, createdAt',
      debts: 'id, personName, type, isSettled, createdAt',
      subscriptions: 'id, name, amount, billingDay, walletId, isActive, createdAt'
    });
  }
}

export const db = new DiduitinDatabase();

// Inisialisasi: Bersih total tanpa data dummy, tanpa pengeluaran, saldo 0
export async function seedInitialDataIfNeeded() {
  const count = await db.wallets.count();
  if (count === 0) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Otomatisasi budget awal diset 0
    await db.budgets.add({
      id: `b-${currentMonth}`,
      month: currentMonth,
      monthlyLimit: 0
    });
  }
}
