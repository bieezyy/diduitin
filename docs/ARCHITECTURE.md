# ARCHITECTURE.md — diduitin Technical Architecture

## 1. Arsitektur Umum
- **Model**: Local-First Client-Side PWA.
- **Hosting / Distribution**: Apache / XAMPP Static Assets (`/apps/diduitin/`).
- **Data Persistence**: IndexedDB via browser engine (Database `diduitin_db`).
- **Offline Engine**: Service Worker caching core HTML, CSS, JavaScript, Web Manifest, dan fonts.

## 2. Tech Stack
- **Runtime / Builder**: Node.js + Vite.
- **Language**: TypeScript (strict types untuk transaksi & mutasi saldo).
- **UI Library**: React 18 / 19.
- **Styling**: Tailwind CSS (kustomisasi utility shadow brutalist & color tokens).
- **Icons**: Lucide React (ikon minimal fungsional: dompet, tag, panah, kalender, trash, edit).
- **Client Storage**: Dexie.js (pembungkus IndexedDB performa tinggi dengan dukungan indexed query).
- **Date Handling**: Native Date / date-fns ringan.

## 3. Skema Data (IndexedDB Tables)

### 3.1. `wallets`
```ts
interface Wallet {
  id: string; // uuid
  name: string; // e.g. "BCA Utama", "GoPay", "Cash Dompet"
  type: 'bank' | 'ewallet' | 'cash' | 'other';
  balance: number; // Saldo berjalan saat ini
  color: string; // Hex warna aksen neo-brutalist
  createdAt: number;
}
```

### 3.2. `transactions`
```ts
interface Transaction {
  id: string; // uuid
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  walletId: string; // Sumber dana
  targetWalletId?: string; // Khusus tipe 'transfer'
  category: string; // e.g. "ngopi", "healing", "makan", "gaji"
  note?: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}
```

### 3.3. `budgets`
```ts
interface Budget {
  id: string;
  month: string; // YYYY-MM
  monthlyLimit: number; // Target maksimal belanja bulanan
}
```

## 4. Keamanan & Backup Engine
- **Data Isolation**: Data tidak pernah dikirim ke remote server. Tidak ada telemetry / analytics pihak ketiga.
- **Backup Snapshot**: Fungsi `exportBackup()` mengumpulkan seluruh records dari Dexie, membungkusnya dalam format JSON terstruktur lengkap dengan metadata timestamp dan versi schema.
- **Restore / Import**: Memverifikasi schema JSON, membersihkan data yang rusak, dan melakukan atomic write kembali ke IndexedDB.
