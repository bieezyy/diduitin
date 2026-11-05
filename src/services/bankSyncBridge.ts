/**
 * Skema Arsitektur Integrasi Mobile Banking & E-Wallet pada Aplikasi "diduitin"
 * 
 * Flow / Diagram Alur:
 * 
 * [Android Notification / SMS]
 *          |
 *          v
 * [NotificationListenerService (Android Native)]
 *          |
 *          v (Filter Package: com.bca, com.bankmandiri.livin, id.co.bri.brimo, com.gojek.app, id.dana, dsb)
 * [Capacitor Bridge Event: 'onBankNotification']
 *          |
 *          v
 * [bankSyncService.ts -> parseBankNotificationText()]
 *          |
 *          +---> Ekstrak: Bank, Tipe (Expense/Income), Nominal (Rp), Nama Merchant
 *          |
 *          v
 * [Auto-Assign ke Wallet Terkait] (Cocokkan nama dompet seperti "BCA", "GoPay", dsb)
 *          |
 *          v
 * [Simpan Transaksi Otomatis ke Dexie DB] -> Update Saldo Dompet Real-time
 *          |
 *          v
 * [Notifikasi Lokal / Toast]: "Transaksi BCA Rp 45.000 (Kopi Kenangan) berhasil dicatat otomatis!"
 */

import { parseBankNotificationText, type ParsedBankNotification } from '../services/bankSyncService';
import { db } from '../db';
import type { Wallet } from '../types';

export interface BankSyncResult {
  success: boolean;
  message: string;
  parsed?: ParsedBankNotification;
}

/**
 * Mencatat transaksi dari hasil parsing bank/e-wallet ke Dexie DB
 */
export async function syncBankTransactionToDb(
  parsed: ParsedBankNotification,
  wallets: Wallet[],
  targetWalletId?: string
): Promise<BankSyncResult> {
  if (!parsed.amount || parsed.amount <= 0) {
    return {
      success: false,
      message: 'Nominal transaksi tidak valid atau 0.',
      parsed
    };
  }

  // Cari dompet yang cocok berdasarkan providerId atau nama dompet
  let wallet = wallets.find(w => w.id === targetWalletId);
  if (!wallet) {
    const pName = parsed.providerName.toLowerCase();
    wallet = wallets.find(w => w.name.toLowerCase().includes(pName)) || wallets[0];
  }

  if (!wallet) {
    return {
      success: false,
      message: 'Belum ada dompet di aplikasi. Silakan buat dompet terlebih dahulu.',
      parsed
    };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const category = parsed.recipientOrMerchant
    ? parsed.recipientOrMerchant.toLowerCase()
    : parsed.type === 'expense'
    ? 'pengeluaran'
    : 'pemasukan';

  // 1. Tambah Transaksi
  await db.transactions.add({
    id: `tx-sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: parsed.type,
    amount: parsed.amount,
    walletId: wallet.id,
    category,
    note: parsed.notes,
    date: todayStr,
    timestamp: Date.now(),
    nature: 'need',
    mood: 'neutral'
  });

  // 2. Perbarui Saldo Dompet
  const currentWallet = await db.wallets.get(wallet.id);
  if (currentWallet) {
    const newBalance =
      parsed.type === 'expense'
        ? currentWallet.balance - parsed.amount
        : currentWallet.balance + parsed.amount;

    await db.wallets.update(wallet.id, { balance: newBalance });
  }

  return {
    success: true,
    message: `Berhasil mencatat transaksi ${parsed.type === 'expense' ? 'keluar' : 'masuk'} Rp ${new Intl.NumberFormat('id-ID').format(parsed.amount)} ke dompet "${wallet.name}".`,
    parsed
  };
}

/**
 * Setup listener notifikasi jika berjalan di lingkungan Capacitor Native Android
 */
export function setupAndroidBankNotificationListener(
  onNotificationReceived: (parsed: ParsedBankNotification) => void
) {
  // Listener untuk custom event dari plugin Capacitor NotificationListener
  if (typeof window !== 'undefined') {
    const handleNativeEvent = (event: any) => {
      const notificationText = event?.detail?.text || event?.detail?.body || '';
      const parsed = parseBankNotificationText(notificationText);
      if (parsed && parsed.amount > 0) {
        onNotificationReceived(parsed);
      }
    };

    window.addEventListener('diduitin_bank_notification' as any, handleNativeEvent);
    return () => {
      window.removeEventListener('diduitin_bank_notification' as any, handleNativeEvent);
    };
  }
}
