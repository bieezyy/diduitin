import type { TransactionType } from '../types';

export interface BankSyncRule {
  id: string;
  name: string;
  shortName: string;
  type: 'bank' | 'ewallet';
  color: string;
  patterns: RegExp[];
  appScheme?: string;
  webUrl?: string;
  keywords?: string[];
}

export interface ParsedBankNotification {
  providerId: string;
  providerName: string;
  type: TransactionType;
  amount: number;
  recipientOrMerchant?: string;
  notes?: string;
  dateStr?: string;
  rawText: string;
  confidence: number;
}

/**
 * Daftar Bank dan e-Wallet Populer di Indonesia beserta Pattern Deteksi
 * Termasuk BCA, Mandiri, BRI, BNI, BJB, BSI, CIMB Niaga, SeaBank, Bank Jago, Jenius, Permata, Danamon, blu, GoPay, OVO, DANA, ShopeePay, LinkAja, AstraPay
 */
export const SUPPORTED_FINANCIAL_PROVIDERS: BankSyncRule[] = [
  // --- KELOMPOK BANK & DIGITAL BANK ---
  {
    id: 'bca',
    name: 'BCA (Bank Central Asia / myBCA)',
    shortName: 'BCA',
    type: 'bank',
    color: '#005E9E',
    appScheme: 'bca://',
    webUrl: 'https://m.klikbca.com',
    keywords: ['bca', 'klikbca', 'mybca'],
    patterns: [
      /(?:transaksi|debet|transfer|pembayaran|qr).*?(?:sebesar|rp\.?)\s*([0-9.,]+)/i,
      /(?:berhasil transfer|m-transfer ke|pembayaran qr).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri (Livin by Mandiri)',
    shortName: 'Mandiri',
    type: 'bank',
    color: '#003366',
    appScheme: 'livin://',
    webUrl: 'https://bankmandiri.co.id',
    keywords: ['mandiri', 'livin'],
    patterns: [
      /(?:transfer|debit|transaksi qris|pembayaran).*?(?:rp\.?|idr)\s*([0-9.,]+)/i,
      /(?:dana keluar|pembelian).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'bri',
    name: 'Bank BRI (BRImo)',
    shortName: 'BRI',
    type: 'bank',
    color: '#00529C',
    appScheme: 'brimo://',
    webUrl: 'https://bri.co.id',
    keywords: ['bri', 'brimo'],
    patterns: [
      /(?:transaksi qris|transfer berhasil|debet).*?rp\.?\s*([0-9.,]+)/i,
      /(?:notifikasi transaksi).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'bni',
    name: 'Bank BNI (BNI Mobile Banking)',
    shortName: 'BNI',
    type: 'bank',
    color: '#E05929',
    appScheme: 'bni://',
    webUrl: 'https://bni.co.id',
    keywords: ['bni', 'wondr'],
    patterns: [
      /(?:transfer|debit|debet|pembayaran).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'bjb',
    name: 'Bank BJB (DIGI by bank bjb)',
    shortName: 'Bank BJB',
    type: 'bank',
    color: '#006699',
    appScheme: 'bjb://',
    webUrl: 'https://bankbjb.co.id',
    keywords: ['bjb', 'digi bjb'],
    patterns: [
      /(?:transfer|debet|pembayaran|qris).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'bsi',
    name: 'Bank Syariah Indonesia (BSI Mobile)',
    shortName: 'BSI',
    type: 'bank',
    color: '#00A39D',
    appScheme: 'bsi://',
    webUrl: 'https://bankbsi.co.id',
    keywords: ['bsi', 'bsi mobile'],
    patterns: [
      /(?:transaksi debit|transfer|pembayaran|qris).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'cimb',
    name: 'CIMB Niaga (OCTO Mobile)',
    shortName: 'CIMB Niaga',
    type: 'bank',
    color: '#7B1113',
    appScheme: 'octomobile://',
    webUrl: 'https://cimbniaga.co.id',
    keywords: ['cimb', 'octo', 'niaga'],
    patterns: [
      /(?:transaksi|transfer|debit|pembayaran|qr).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'seabank',
    name: 'SeaBank Indonesia',
    shortName: 'SeaBank',
    type: 'bank',
    color: '#FF5722',
    appScheme: 'seabank://',
    webUrl: 'https://seabank.co.id',
    keywords: ['seabank', 'sea bank'],
    patterns: [
      /(?:transfer keluar|transaksi berhasil|pembayaran qris).*?rp\.?\s*([0-9.,]+)/i,
      /(?:kamu menerima transfer|bunga cair).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'jago',
    name: 'Bank Jago',
    shortName: 'Bank Jago',
    type: 'bank',
    color: '#9333EA',
    appScheme: 'jago://',
    webUrl: 'https://jago.com',
    keywords: ['jago', 'bank jago'],
    patterns: [
      /(?:kirim uang|kantong|bayar qris|transfer).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'jenius',
    name: 'Jenius (Bank BTPN)',
    shortName: 'Jenius',
    type: 'bank',
    color: '#0284C7',
    appScheme: 'jenius://',
    webUrl: 'https://jenius.com',
    keywords: ['jenius', 'btpn'],
    patterns: [
      /(?:uang keluar|send it|bayar qris|transaksi).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'permata',
    name: 'PermataBank (Permata ME)',
    shortName: 'Permata',
    type: 'bank',
    color: '#16A34A',
    appScheme: 'permatame://',
    webUrl: 'https://permatabank.com',
    keywords: ['permata', 'permatame'],
    patterns: [
      /(?:transaksi|transfer|pembayaran).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'danamon',
    name: 'Bank Danamon (D-Bank PRO)',
    shortName: 'Danamon',
    type: 'bank',
    color: '#EA580C',
    appScheme: 'dbank://',
    webUrl: 'https://danamon.co.id',
    keywords: ['danamon', 'd-bank'],
    patterns: [
      /(?:transaksi|transfer|debit).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'blu',
    name: 'blu by BCA Digital',
    shortName: 'blu (BCA)',
    type: 'bank',
    color: '#0284C7',
    appScheme: 'blubybcadigital://',
    webUrl: 'https://blubybcadigital.id',
    keywords: ['blu', 'bca digital'],
    patterns: [
      /(?:transfer berhasil|bayar qris|transaksi).*?rp\.?\s*([0-9.,]+)/i
    ]
  },

  // --- KELOMPOK DOMPET DIGITAL (E-WALLET) ---
  {
    id: 'gopay',
    name: 'GoPay / Gojek',
    shortName: 'GoPay',
    type: 'ewallet',
    color: '#00AED6',
    appScheme: 'gojek://gopay',
    webUrl: 'https://gopay.co.id',
    keywords: ['gopay', 'gojek'],
    patterns: [
      /(?:kamu bayar|transaksi berhasil|transfer ke|bayar qris).*?rp\.?\s*([0-9.,]+)/i,
      /(?:hore! kamu dapet|terima saldo|top up berhasil).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'ovo',
    name: 'OVO',
    shortName: 'OVO',
    type: 'ewallet',
    color: '#4C3494',
    appScheme: 'ovo://',
    webUrl: 'https://www.ovo.id',
    keywords: ['ovo'],
    patterns: [
      /(?:pembayaran berhasil|transfer dana|bayar ke).*?rp\.?\s*([0-9.,]+)/i,
      /(?:top up sebesar|kamu menerima).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'dana',
    name: 'DANA Indonesia',
    shortName: 'DANA',
    type: 'ewallet',
    color: '#118EEA',
    appScheme: 'dana://',
    webUrl: 'https://dana.id',
    keywords: ['dana'],
    patterns: [
      /(?:kirim uang|pembayaran qris|bayar di|berhasil kirim).*?rp\.?\s*([0-9.,]+)/i,
      /(?:dapat saldo|isi saldo).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    shortName: 'ShopeePay',
    type: 'ewallet',
    color: '#EE4D2D',
    appScheme: 'shopeeid://',
    webUrl: 'https://shopee.co.id',
    keywords: ['shopee', 'shopeepay'],
    patterns: [
      /(?:kamu telah membayar|transfer berhasil|pembayaran qris).*?rp\.?\s*([0-9.,]+)/i,
      /(?:kamu menerima transfer|top up).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'linkaja',
    name: 'LinkAja',
    shortName: 'LinkAja',
    type: 'ewallet',
    color: '#DC2626',
    appScheme: 'linkaja://',
    webUrl: 'https://linkaja.id',
    keywords: ['linkaja'],
    patterns: [
      /(?:pembayaran berhasil|transaksi|kirim uang).*?rp\.?\s*([0-9.,]+)/i
    ]
  },
  {
    id: 'astrapay',
    name: 'AstraPay',
    shortName: 'AstraPay',
    type: 'ewallet',
    color: '#2563EB',
    appScheme: 'astrapay://',
    webUrl: 'https://astrapay.com',
    keywords: ['astrapay', 'astra pay'],
    patterns: [
      /(?:pembayaran berhasil|transaksi|qris).*?rp\.?\s*([0-9.,]+)/i
    ]
  }
];

/**
 * Parsing teks notifikasi / SMS / slip transaksi m-Banking & e-Wallet
 */
export function parseBankNotificationText(rawText: string): ParsedBankNotification | null {
  if (!rawText || rawText.trim().length < 5) return null;

  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Tentukan Provider berdasarkan keywords
  let matchedProvider: BankSyncRule | undefined = SUPPORTED_FINANCIAL_PROVIDERS.find(p =>
    p.keywords?.some(kw => lower.includes(kw))
  );

  // Fallback jika tidak ada nama bank spesifik, tapi ada struktur rupiah
  if (!matchedProvider) {
    matchedProvider = {
      id: 'general',
      name: 'Bank / E-Wallet',
      shortName: 'Bank/E-Wallet',
      type: 'bank',
      color: '#121214',
      patterns: []
    };
  }

  // 2. Tentukan Tipe Transaksi (Expense vs Income)
  const isIncome =
    lower.includes('kredit') ||
    lower.includes('cr') ||
    lower.includes('masuk') ||
    lower.includes('menerima') ||
    lower.includes('top up berhasil') ||
    lower.includes('terima dana') ||
    lower.includes('bunga cair') ||
    lower.includes('uang masuk');

  const type: TransactionType = isIncome ? 'income' : 'expense';

  // 3. Ekstrak Nominal Rupiah
  // Mendukung: Rp150.000, Rp 150,000, 150000.00, IDR 50.000
  let amount = 0;
  const amountMatch = text.match(/(?:rp\.?|idr)\s*([0-9]+(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+)/i);

  if (amountMatch && amountMatch[1]) {
    let clean = amountMatch[1];
    // Jika format titik ribuan: 150.000 atau 150.000,00
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
      amount = Math.round(parseFloat(clean));
    } else if (clean.includes('.')) {
      // 50.000 -> 50000
      clean = clean.replace(/\./g, '');
      amount = parseInt(clean, 10);
    } else if (clean.includes(',')) {
      // 50,000 -> 50000
      clean = clean.replace(/,/g, '');
      amount = parseInt(clean, 10);
    } else {
      amount = parseInt(clean, 10);
    }
  }

  if (!amount || isNaN(amount)) {
    // Coba temukan angka murni jika diawali kata transaksi
    const numFallback = text.match(/(?:sebesar|nominal|jumlah)\s*:?\s*([0-9.,]+)/i);
    if (numFallback && numFallback[1]) {
      const clean = numFallback[1].replace(/\D/g, '');
      amount = parseInt(clean, 10) || 0;
    }
  }

  // 4. Ekstrak Merchant / Penerima / Keperluan
  let recipientOrMerchant: string | undefined;
  const merchantMatch =
    text.match(/(?:ke|di|kepada|merchant|tujuan)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:pada|sebesar|rp|tanggal|via|melalui|\.|$))/i) ||
    text.match(/(?:pembayaran|transaksi)\s+([A-Za-z0-9\s&.'-]+?)(?:\s+(?:berhasil|sukses|rp|\.|$))/i);

  if (merchantMatch && merchantMatch[1]) {
    const rawMerchant = merchantMatch[1].trim();
    if (rawMerchant.length > 2 && rawMerchant.length < 35) {
      recipientOrMerchant = rawMerchant;
    }
  }

  // 5. Hitung Skor Keyakinan (Confidence)
  let confidence = 0.5;
  if (amount > 0) confidence += 0.3;
  if (matchedProvider.id !== 'general') confidence += 0.2;

  return {
    providerId: matchedProvider.id,
    providerName: matchedProvider.shortName,
    type,
    amount,
    recipientOrMerchant,
    notes: `Otomatis dari ${matchedProvider.shortName}: ${text.slice(0, 60)}...`,
    rawText: text,
    confidence
  };
}
