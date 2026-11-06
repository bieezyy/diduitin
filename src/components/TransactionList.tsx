import React, { useState } from 'react';
import type { Transaction, Wallet } from '../types';
import { formatRupiah } from '../constants/categories';
import { db } from '../db';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Trash2, 
  Edit3, 
  Calendar, 
  Search, 
  X, 
  Image as ImageIcon,
  Download
} from 'lucide-react';

import { ActionModal, type AlertModalState } from './ActionModal';

interface TransactionListProps {
  transactions: Transaction[];
  wallets: Wallet[];
  selectedWalletFilterId?: string | null;
  onRefresh: () => void;
  onEditTransaction?: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  wallets,
  selectedWalletFilterId,
  onRefresh,
  onEditTransaction
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [filterNature, setFilterNature] = useState<'all' | 'need' | 'want'>('all');
  const [filterMood, setFilterMood] = useState<'all' | 'worth' | 'neutral' | 'regret'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7days' | '30days' | 'thisMonth'>('all');
  const [minAmountFilter, setMinAmountFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 3;

  // State ActionModal Reusable
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  const walletMap = new Map(wallets.map(w => [w.id, w]));

  const availableMonths = Array.from(
    new Set(transactions.map(tx => tx.date.slice(0, 7)))
  ).sort().reverse();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

  const filtered = transactions.filter(tx => {
    if (selectedWalletFilterId) {
      const matchSource = tx.walletId === selectedWalletFilterId;
      const matchTarget = tx.targetWalletId === selectedWalletFilterId;
      if (!matchSource && !matchTarget) return false;
    }

    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterNature !== 'all' && tx.nature !== filterNature) return false;
    if (filterMood !== 'all' && tx.mood !== filterMood) return false;
    if (minAmountFilter > 0 && tx.amount < minAmountFilter) return false;
    if (selectedMonth !== 'all' && !tx.date.startsWith(selectedMonth)) return false;

    // Filter Periode Cepat
    if (dateRangeFilter === '7days' && tx.date < sevenDaysAgo) return false;
    if (dateRangeFilter === '30days' && tx.date < thirtyDaysAgo) return false;
    if (dateRangeFilter === 'thisMonth' && !tx.date.startsWith(currentMonthStr)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCategory = tx.category.toLowerCase().includes(q);
      const matchNote = tx.note ? tx.note.toLowerCase().includes(q) : false;
      const matchAmount = tx.amount.toString().includes(q.replace(/\D/g, ''));
      const sourceWalletName = walletMap.get(tx.walletId)?.name.toLowerCase() || '';
      const matchWallet = sourceWalletName.includes(q);
      if (!matchCategory && !matchNote && !matchAmount && !matchWallet) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedTransactions = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportPDF = async () => {
    if (filtered.length === 0) {
      setActionModal({
        isOpen: true,
        type: 'info',
        title: 'Laporan Kosong',
        message: 'Tidak ada transaksi yang cocok untuk diunduh sebagai PDF.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const now = new Date();
      const tanggalCetak = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const totalExpense = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

      // Header Judul
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('LAPORAN TRANSAKSI DIDUITIN', 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Tanggal Cetak: ${tanggalCetak} | Total Transaksi: ${filtered.length}`, 14, 25);
      doc.text(`Total Pemasukan: ${formatRupiah(totalIncome)} | Total Pengeluaran: ${formatRupiah(totalExpense)}`, 14, 31);

      // Data Tabel
      const tableRows = filtered.map((tx, idx) => {
        const source = walletMap.get(tx.walletId)?.name || tx.walletId;
        const target = tx.targetWalletId ? ` -> ${walletMap.get(tx.targetWalletId)?.name || tx.targetWalletId}` : '';
        const typeLabel = tx.type === 'expense' ? 'Keluar' : tx.type === 'income' ? 'Masuk' : 'Pindah';
        const prefix = tx.type === 'expense' ? '- ' : tx.type === 'income' ? '+ ' : '';

        return [
          (idx + 1).toString(),
          tx.date,
          typeLabel,
          `#${tx.category}`,
          `${source}${target}`,
          tx.note || '-',
          `${prefix}${formatRupiah(tx.amount)}`
        ];
      });

      autoTable(doc, {
        startY: 37,
        head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Dompet', 'Catatan', 'Nominal']],
        body: tableRows,
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 2.5
        },
        headStyles: {
          fillColor: [18, 18, 20],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 250]
        }
      });

      const fileName = `diduitin-laporan-${now.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Gagal Ekspor',
        message: 'Gagal mengunduh dokumen PDF. Silakan coba lagi.',
        confirmText: 'Tutup',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const executeDeleteTx = async (tx: Transaction) => {
    try {
      const source = walletMap.get(tx.walletId);
      if (source) {
        if (tx.type === 'expense') {
          await db.wallets.update(tx.walletId, { balance: source.balance + tx.amount });
        } else if (tx.type === 'income') {
          await db.wallets.update(tx.walletId, { balance: source.balance - tx.amount });
        } else if (tx.type === 'transfer' && tx.targetWalletId) {
          const target = walletMap.get(tx.targetWalletId);
          await db.wallets.update(tx.walletId, { balance: source.balance + tx.amount });
          if (target) {
            await db.wallets.update(tx.targetWalletId, { balance: target.balance - tx.amount });
          }
        }
      }

      await db.transactions.delete(tx.id);
      setActionModal(prev => ({ ...prev, isOpen: false }));
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Error',
        message: 'Gagal menghapus catatan transaksi.',
        confirmText: 'Tutup',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleDelete = (tx: Transaction) => {
    setActionModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Transaksi?',
      message: `Hapus catatan "${tx.category}" (${formatRupiah(tx.amount)})? Saldo dompet akan disesuaikan kembali secara otomatis.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => executeDeleteTx(tx),
      onCancel: () => setActionModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const selectedWalletName = selectedWalletFilterId ? walletMap.get(selectedWalletFilterId)?.name : null;

  return (
    <div className="space-y-3 mt-6">
      {/* Header & Sub-info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-black uppercase tracking-wide flex items-center gap-1.5 text-[#121214]">
            <Calendar className="w-4 h-4" />
            Riwayat Duit ({filtered.length})
          </h2>
          {selectedWalletName && (
            <span className="text-[11px] font-bold text-neutral-500">
              Khusus dompet: <strong className="text-black font-black">{selectedWalletName}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tombol Export PDF */}
          <button
            onClick={handleExportPDF}
            className="brutal-btn py-1 px-2.5 text-[11px] bg-[#A3E635] text-[#121214] font-black uppercase flex items-center gap-1 cursor-pointer"
            title="Cetak atau Simpan Laporan PDF"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>PDF</span>
          </button>

          {/* Filter Bulan Dropdown */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="brutal-input py-1 px-2 text-xs font-bold bg-white"
              >
                <option value="all">Semua Bulan</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Kolom Pencarian Cepat */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari transaksi (misal: kopi, bensin, geprek)..."
          className="brutal-input w-full pl-9 pr-8 text-xs py-2 font-bold"
        />
        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-black cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdown (Jenis, Waktu, Karakter, Mood, Nominal) */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {/* Dropdown Jenis */}
        <div className="flex items-center">
          <select
            value={filterType}
            onChange={e => {
              setFilterType(e.target.value as any);
              setCurrentPage(1);
            }}
            className="brutal-input py-1 px-2 text-[10px] font-black bg-[#FACC15] text-[#121214] cursor-pointer uppercase"
          >
            <option value="all">Semua Tipe</option>
            <option value="expense">Keluar</option>
            <option value="income">Masuk</option>
            <option value="transfer">Pindah</option>
          </select>
        </div>

        {/* Dropdown Waktu */}
        <div className="flex items-center">
          <select
            value={dateRangeFilter}
            onChange={e => {
              setDateRangeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="brutal-input py-1 px-2 text-[10px] font-black bg-[#38BDF8] text-[#121214] cursor-pointer uppercase"
          >
            <option value="all">Semua Hari</option>
            <option value="7days">7 Hari Terakhir</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="thisMonth">Bulan Ini</option>
          </select>
        </div>

        {/* Dropdown Need / FOMO */}
        <div className="flex items-center">
          <select
            value={filterNature}
            onChange={e => {
              setFilterNature(e.target.value as any);
              setCurrentPage(1);
            }}
            className="brutal-input py-1 px-2 text-[10px] font-black bg-[#DDD6FE] text-[#121214] cursor-pointer uppercase"
          >
            <option value="all">Semua Sifat</option>
            <option value="need">#Need</option>
            <option value="want">#FOMO</option>
          </select>
        </div>

        {/* Dropdown Mood / Evaluasi Belanja */}
        <div className="flex items-center">
          <select
            value={filterMood}
            onChange={e => {
              setFilterMood(e.target.value as any);
              setCurrentPage(1);
            }}
            className="brutal-input py-1 px-2 text-[10px] font-black bg-[#FED7AA] text-[#121214] cursor-pointer uppercase"
          >
            <option value="all">Semua Mood</option>
            <option value="worth">Worth it 🤩</option>
            <option value="neutral">B Aja 😐</option>
            <option value="regret">Nyesel 😭</option>
          </select>
        </div>

        {/* Filter Nominal > 100k */}
        <button
          type="button"
          onClick={() => {
            setMinAmountFilter(prev => (prev === 100000 ? 0 : 100000));
            setCurrentPage(1);
          }}
          className={`px-2 py-1 rounded text-[10px] font-black uppercase border border-[#121214] cursor-pointer transition-all ${
            minAmountFilter === 100000
              ? 'bg-[#FB7185] text-white shadow-[1px_1px_0px_#121214]'
              : 'bg-white text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          {minAmountFilter === 100000 ? '≥ 100 Rb ✓' : '≥ 100 Rb'}
        </button>
      </div>

      {/* List Feed */}
      {filtered.length === 0 ? (
        <div className="brutal-card p-6 text-center bg-white">
          <p className="text-xs font-bold text-neutral-400 uppercase">
            {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada catatan di filter ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedTransactions.map(tx => {
            const sourceWallet = walletMap.get(tx.walletId);
            const targetWallet = tx.targetWalletId ? walletMap.get(tx.targetWalletId) : null;

            let badgeBg = 'bg-[#FB7185]';
            let icon = <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />;
            let prefix = '- ';

            if (tx.type === 'income') {
              badgeBg = 'bg-[#A3E635]';
              icon = <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />;
              prefix = '+ ';
            } else if (tx.type === 'transfer') {
              badgeBg = 'bg-[#DDD6FE]';
              icon = <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />;
              prefix = '';
            }

            return (
              <div
                key={tx.id}
                className="brutal-card p-3 bg-white flex items-center justify-between hover:translate-x-0.5 transition-transform"
              >
                <div className="flex items-center gap-3">
                  {/* Icon Box */}
                  <div className={`w-9 h-9 rounded-lg border-2 border-[#121214] flex items-center justify-center shrink-0 ${badgeBg}`}>
                    {icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-[#121214] uppercase">
                        #{tx.category}
                      </span>
                      {tx.note && (
                        <span className="text-xs font-semibold text-neutral-500">
                          • {tx.note}
                        </span>
                      )}
                      {/* Badge Jurnaling Mood & Nature */}
                      {tx.nature && (
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase border border-[#121214] ${
                          tx.nature === 'need' ? 'bg-[#A3E635]' : 'bg-[#FB7185]'
                        }`}>
                          {tx.nature === 'need' ? 'Need' : 'FOMO'}
                        </span>
                      )}
                      {tx.mood === 'worth' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-[#FDE047] border border-[#121214]">
                          Worth
                        </span>
                      )}
                      {tx.mood === 'neutral' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-neutral-200 border border-[#121214]">
                          Netral
                        </span>
                      )}
                      {tx.mood === 'regret' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-200 border border-[#121214]">
                          Nyesel
                        </span>
                      )}

                      {/* Ikon Lampiran Struk */}
                      {tx.receiptImage && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(tx.receiptImage || null)}
                          className="px-1.5 py-0.2 rounded bg-sky-100 hover:bg-sky-200 border border-[#121214] text-[9px] font-black uppercase flex items-center gap-1 text-sky-800 cursor-pointer"
                          title="Lihat Foto Struk"
                        >
                          <ImageIcon className="w-2.5 h-2.5" /> Struk
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-neutral-500 flex items-center gap-1 mt-0.5">
                      <span>{sourceWallet?.name || 'Dompet'}</span>
                      {targetWallet && <span>➔ {targetWallet.name}</span>}
                      <span>• {tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-black whitespace-nowrap ${
                    tx.type === 'expense' ? 'text-rose-600' : tx.type === 'income' ? 'text-emerald-700' : 'text-purple-700'
                  }`}>
                    {prefix}{formatRupiah(tx.amount)}
                  </span>
                  {onEditTransaction && (
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 rounded border border-transparent hover:border-[#121214] cursor-pointer"
                      title="Edit Transaksi"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(tx)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 rounded border border-transparent hover:border-[#121214] cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Kontrol Navigasi Pagination (Muncul jika transaksi > 3) */}
          {filtered.length > pageSize && (
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="brutal-btn px-3 py-1.5 bg-white text-xs font-black uppercase disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <span className="text-[11px] font-black text-neutral-600">
                Halaman {currentPage} dari {totalPages} ({filtered.length} transaksi)
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="brutal-btn px-3 py-1.5 bg-[#A3E635] text-xs font-black uppercase disabled:opacity-40 cursor-pointer"
              >
                Next Page ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Preview Struk Fullscreen */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-4 max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#121214]">
              <span className="text-xs font-black uppercase tracking-wider">Bukti Struk / Invoice</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg border-2 border-[#121214] hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-lg border-2 border-[#121214]">
              <img
                src={previewImage}
                alt="Foto Struk"
                className="w-full h-auto object-contain"
              />
            </div>
            <button
              onClick={() => setPreviewImage(null)}
              className="brutal-btn w-full py-2 bg-[#FACC15] text-xs uppercase cursor-pointer"
            >
              Tutup Struk
            </button>
          </div>
        </div>
      )}

      {/* Reusable Action / Notification Modal */}
      <ActionModal {...actionModal} />
    </div>
  );
};
