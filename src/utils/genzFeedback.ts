/**
 * Engine Feedback Humanis & Gen-Z khas diduitin
 * Menyesuaikan waktu Jakarta WIB (UTC+7) dan hari dalam seminggu
 * Bersih, modern, profesional tanpa emoji berlebihan
 */

export interface GenzGreeting {
  timeLabel: string;
  greeting: string;
  subGreeting: string;
  roastWisdom: string;
  timeTag: 'dini' | 'pagi' | 'siang' | 'sore' | 'malam';
}

// Koleksi tips finansial harian yang lugas & kontekstual
const DAILY_WISDOMS: Record<number, string[]> = {
  0: [
    'Evaluasi pengeluaran akhir pekan sebelum mulai rutinitas besok.',
    'Hitung sisa anggaran minggu depan agar tidak defisit sebelum gajian.',
    'Istirahat cukup tanpa perlu impulsif checkout keranjang belanja.'
  ],
  1: [
    'Awal minggu: utamakan alokasi kebutuhan pokok terlebih dahulu.',
    'Membawa bekal atau kopi sendiri memangkas pengeluaran harian hingga 40%.',
    'Fokus pada target mingguan tanpa terdistraksi promo impulsif.'
  ],
  2: [
    'Selasa produktif. Hindari belanja emosional saat pekerjaan padat.',
    'Periksa saldo dompet berkala agar ritme belanja tetap terkontrol.',
    'Pilah pengeluaran esensial versus keinginan sekunder hari ini.'
  ],
  3: [
    'Pertengahan minggu: pastikan pengeluaran harian masih sesuai jatah.',
    'Godaan jajan sore sering muncul di jam santai. Tetap bijak berbelanja.',
    'Prioritaskan tabungan rutin sebelum mengalokasikan anggaran hiburan.'
  ],
  4: [
    'Menjelang akhir pekan: rencanakan anggaran nongkrong sejak awal.',
    'Cek kembali langganan digital yang sudah jarang dipakai.',
    'Disiplin finansial hari ini memberi ketenangan di akhir bulan.'
  ],
  5: [
    'Akhir pekan tiba. Nikmati hiburan secukupnya tanpa melampaui limit.',
    'Self-reward wajar, pastikan tidak mengorbankan pos dana darurat.',
    'Kualitas waktu istirahat tidak selalu ditentukan oleh biaya mahal.'
  ],
  6: [
    'Sabtu santai. Gunakan kalkulator split bill saat berkumpul bersama teman.',
    'Jangan ragu menolak pengeluaran di luar rencana finansial.',
    'Cek pencapaian target tabungan impian minggu ini.'
  ]
};

export function getJakartaTimeContext(): { hour: number; dayOfWeek: number } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakartaDate = new Date(utc + 3600000 * 7);

  return {
    hour: jakartaDate.getHours(),
    dayOfWeek: jakartaDate.getDay()
  };
}

export function getGenzGreeting(): GenzGreeting {
  const { hour, dayOfWeek } = getJakartaTimeContext();
  const dayWisdomList = DAILY_WISDOMS[dayOfWeek] || DAILY_WISDOMS[1];
  const wisdomIndex = (hour + dayOfWeek) % dayWisdomList.length;
  const roastWisdom = dayWisdomList[wisdomIndex];

  // 1. Dini Hari (00:00 - 04:59)
  if (hour >= 0 && hour < 5) {
    const greetings = [
      'Waktu Istirahat',
      'Fokus Pemulihan Energi',
      'Hindari Belanja Malam'
    ];
    return {
      timeLabel: 'Dini Hari WIB',
      greeting: greetings[hour % greetings.length],
      subGreeting: 'Hindari scrolling e-commerce saat mengantuk untuk mencegah transaksi impulsif.',
      roastWisdom,
      timeTag: 'dini'
    };
  }

  // 2. Pagi Hari (05:00 - 10:59)
  if (hour >= 5 && hour < 11) {
    const greetings = [
      'Selamat Pagi, Siap Produktif',
      'Awali Hari dengan Terencana',
      'Semangat Memulai Hari'
    ];
    return {
      timeLabel: 'Pagi Hari WIB',
      greeting: greetings[hour % greetings.length],
      subGreeting: 'Rencanakan pengeluaran harian Anda sebelum beraktivitas.',
      roastWisdom,
      timeTag: 'pagi'
    };
  }

  // 3. Siang Hari (11:00 - 14:59)
  if (hour >= 11 && hour < 15) {
    const greetings = [
      'Waktunya Istirahat Siang',
      'Rehat dan Pulihkan Fokus',
      'Selamat Menikmati Siang'
    ];
    return {
      timeLabel: 'Siang Hari WIB',
      greeting: greetings[hour % greetings.length],
      subGreeting: 'Pilih santap siang yang bergizi dan tetap sesuai anggaran.',
      roastWisdom,
      timeTag: 'siang'
    };
  }

  // 4. Sore Hari (15:00 - 18:59)
  if (hour >= 15 && hour < 19) {
    const greetings = [
      'Waktu Pulang Beraktivitas',
      'Sore Hari yang Produktif',
      'Perjalanan Pulang Santai'
    ];
    return {
      timeLabel: 'Sore Hari WIB',
      greeting: greetings[hour % greetings.length],
      subGreeting: 'Waspadai pengeluaran kudapan sore yang tidak direncanakan.',
      roastWisdom,
      timeTag: 'sore'
    };
  }

  // 5. Malam Hari (19:00 - 23:59)
  const greetings = [
    'Waktu Evaluasi Hari Ini',
    'Selamat Beristirahat',
    'Tenangkan Pikiran Malam Ini'
  ];
  return {
    timeLabel: 'Malam Hari WIB',
    greeting: greetings[hour % greetings.length],
    subGreeting: 'Rekap mutasi transaksi hari ini agar neraca tetap seimbang.',
    roastWisdom,
    timeTag: 'malam'
  };
}

/**
 * Feedback status keuangan yang tegas, modern, dan profesional
 */
export function getFinancialStatusComment(remainingPercent: number, regretExpense: number): { title: string; desc: string; badgeColor: string } {
  if (remainingPercent <= 5) {
    return {
      title: 'STATUS ANGGARAN KRITIS',
      desc: 'Sisa budget bulanan di bawah 5%. Batasi pengeluaran hanya untuk kebutuhan esensial.',
      badgeColor: 'bg-[#FB7185] text-[#121214]'
    };
  }

  if (regretExpense > 150000) {
    return {
      title: 'EVALUASI PENGELUARAN IMPULSIF',
      desc: `Tercatat ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(regretExpense)} pada kategori tidak esensial bulan ini. Optimalkan prioritas Anda.`,
      badgeColor: 'bg-[#FED7AA] text-[#121214]'
    };
  }

  if (remainingPercent <= 25) {
    return {
      title: 'MODE HEMAT AKTIF',
      desc: 'Sisa budget menipis. Alokasikan dana tersisa hanya untuk keperluan prioritas hingga akhir bulan.',
      badgeColor: 'bg-[#FACC15] text-[#121214]'
    };
  }

  if (remainingPercent <= 50) {
    return {
      title: 'ARUS KAS STABIL',
      desc: 'Pengeluaran berada dalam batas kendali. Pertahankan ritme belanja yang disiplin.',
      badgeColor: 'bg-[#DDD6FE] text-[#121214]'
    };
  }

  return {
    title: 'FINANSIAL TERKENDALI BAIK',
    desc: 'Alur kas bulanan berjalan terencana dengan margin tabungan yang aman.',
    badgeColor: 'bg-[#A3E635] text-[#121214]'
  };
}
