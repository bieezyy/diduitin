import React, { useState, useEffect } from 'react';
import type { Wallet, Transaction, DebtMemo } from '../types';
import { formatRupiah } from '../constants/categories';
import { Flame, Plus, Settings, Sparkles, BookOpen, Sun, Frown, RefreshCw, Eye, EyeOff, Shield, Clock } from 'lucide-react';
import { getGenzGreeting } from '../utils/genzFeedback';

interface RealitiCheckProps {
  totalBalance: number;
  monthlyExpense: number;
  monthlyBudget: number;
  wallets: Wallet[];
  transactions: Transaction[];
  debts?: DebtMemo[];
  selectedWalletFilterId?: string | null;
  onSelectWalletFilter: (walletId: string | null) => void;
  onOpenQuickEntry: () => void;
  onOpenWalletsModal: () => void;
  onSetBudgetModal: () => void;
  onOpenWishlistModal: () => void;
  onOpenDebtModal: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenWrappedModal?: () => void;
}

export const RealitiCheck: React.FC<RealitiCheckProps> = ({
  totalBalance,
  monthlyExpense,
  monthlyBudget,
  wallets,
  transactions,
  debts = [],
  selectedWalletFilterId,
  onSelectWalletFilter,
  onOpenQuickEntry,
  onOpenWalletsModal,
  onSetBudgetModal,
  onOpenWishlistModal,
  onOpenDebtModal,
  onOpenSubscriptionModal,
  onOpenWrappedModal
}) => {
  // State Mode Sensor Saldo (Anti-Kepo saat di tempat umum)
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);

  // Real-time clock Jakarta (WIB)
  const [currentTimeWIB, setCurrentTimeWIB] = useState<string>(() => {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date()).replace(':', '.') + ' WIB';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date()).replace(':', '.') + ' WIB';
      setCurrentTimeWIB(timeStr);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Kalkulasi Kekayaan Bersih (Net Worth)
  const totalUnsettledLent = debts
    .filter(d => !d.isSettled && d.type === 'lent')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalUnsettledBorrowed = debts
    .filter(d => !d.isSettled && d.type === 'borrowed')
    .reduce((sum, d) => sum + d.amount, 0);
  const netWorth = totalBalance + totalUnsettledLent - totalUnsettledBorrowed;

  const burnPercent = monthlyBudget > 0 ? Math.min(Math.round((monthlyExpense / monthlyBudget) * 100), 100) : 0;
  const remainingBudget = Math.max(monthlyBudget - monthlyExpense, 0);
  const remainingPercent = monthlyBudget > 0 ? (remainingBudget / monthlyBudget) * 100 : 0;

  // Hitung sisa hari dalam bulan berjalan untuk Jatah Harian (Daily Allowance)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  // Sisa hari termasuk hari ini (minimal 1 hari agar tidak terjadi pembagian 0)
  const remainingDays = Math.max(totalDaysInMonth - currentDay + 1, 1);
  
  // Jika budget bulanan belum diset (> 0), hitung allowance dari saldo riil yang ada
  const baseBudgetForAllowance = monthlyBudget > 0 ? remainingBudget : totalBalance;
  const dailyAllowance = Math.max(0, Math.round(baseBudgetForAllowance / remainingDays));

  // Analisis Jurnaling Emosi: Berapa uang yang dikeluarkan untuk hal "Nyesel"
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthExpenses = transactions.filter(
    tx => tx.type === 'expense' && tx.date.startsWith(currentMonthStr)
  );
  const regretExpense = monthExpenses
    .filter(tx => tx.mood === 'regret')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Analisis Top Kategori Pengeluaran Bulan Ini
  const categoryTotals = monthExpenses.reduce((acc, tx) => {
    const cat = tx.category.toLowerCase().trim();
    acc[cat] = (acc[cat] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const totalExpenseSum = monthExpenses.reduce((sum, tx) => sum + tx.amount, 0);

  // Dapatkan sapaan waktu Jakarta WIB
  const genzGreeting = getGenzGreeting();

  // Status Badge sisa budget
  let statusBadge = {
    text: monthlyBudget > 0 ? (monthlyExpense === 0 ? 'Budget Utuh' : 'Aman') : 'Atur Limit',
    bg: monthlyBudget > 0 ? 'bg-[#A3E635]' : 'bg-neutral-100',
    color: 'text-[#121214]'
  };

  if (monthlyBudget > 0 && monthlyExpense > 0) {
    if (monthlyExpense > monthlyBudget || remainingPercent <= 5) {
      statusBadge = {
        text: 'Bahaya!',
        bg: 'bg-[#FB7185]',
        color: 'text-[#121214]'
      };
    } else if (remainingPercent <= 20) {
      statusBadge = {
        text: 'Mepet Banget',
        bg: 'bg-[#FED7AA]',
        color: 'text-[#121214]'
      };
    } else if (remainingPercent <= 40) {
      statusBadge = {
        text: 'Cukup',
        bg: 'bg-[#FACC15]',
        color: 'text-[#121214]'
      };
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Welcoming Banner Dinamis Waktu Jakarta WIB */}
      <div className="brutal-card p-4 bg-white border-2 border-[#121214] shadow-[3px_3px_0px_#121214] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-600 stroke-[2.5]" />
            <span className="text-[11px] font-black uppercase text-[#121214] tracking-wider">
              {currentTimeWIB}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenWrappedModal && (
              <button
                type="button"
                onClick={onOpenWrappedModal}
                className="brutal-badge text-[9px] bg-[#FDE047] text-[#121214] flex items-center gap-1 hover:bg-amber-300 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                title="Lihat Finansial Wrapped Bulan Ini"
              >
                <Sparkles className="w-2.5 h-2.5 text-purple-700" />
                <span>Wrapped</span>
              </button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-neutral-600 font-bold leading-relaxed bg-[#F9F9FB] p-2.5 rounded-lg border border-neutral-300">
          {genzGreeting.roastWisdom}
        </p>
      </div>

      {/* 2. Kartu Utama: Saldo Ril dengan Fitur Sensor Saldo (Eye Toggle) */}
      <div className="brutal-card p-4 sm:p-5 bg-white relative overflow-hidden">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 truncate">
                {selectedWalletFilterId ? 'Saldo Dompet Terpilih' : 'Total Saldo Ril'}
              </span>
              <button
                type="button"
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="p-1 rounded text-neutral-500 hover:text-black cursor-pointer"
                title={isBalanceHidden ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
              >
                {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#121214] tracking-tight mt-0.5 truncate">
              {isBalanceHidden ? 'Rp ••••••••' : formatRupiah(totalBalance)}
            </h1>
            {/* Info Net Worth / Kekayaan Bersih */}
            {!selectedWalletFilterId && (totalUnsettledLent > 0 || totalUnsettledBorrowed > 0) && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-neutral-500 flex-wrap">
                <Shield className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>Kekayaan Bersih:</span>
                <strong className="text-[#121214] font-black">
                  {isBalanceHidden ? '••••••' : formatRupiah(netWorth)}
                </strong>
                {totalUnsettledLent > 0 && (
                  <span className="text-emerald-700 font-bold">
                    (+{formatRupiah(totalUnsettledLent)})
                  </span>
                )}
                {totalUnsettledBorrowed > 0 && (
                  <span className="text-rose-600 font-bold">
                    (-{formatRupiah(totalUnsettledBorrowed)})
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onOpenQuickEntry}
            className="brutal-btn px-3 py-2 bg-[#A3E635] text-xs font-black uppercase tracking-wider hover:bg-[#86efac] shrink-0 cursor-pointer shadow-[2px_2px_0px_#121214]"
          >
            + Catat Duit
          </button>
        </div>

        {/* Manageable & Selectable Wallets Bar */}
        <div className="pt-3 border-t-2 border-[#121214]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
              Pilih / Kelola Dompet:
            </span>
            <div className="flex items-center gap-2">
              {selectedWalletFilterId && (
                <button
                  onClick={() => onSelectWalletFilter(null)}
                  className="text-[10px] font-black uppercase text-rose-600 underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
              <button
                onClick={onOpenWalletsModal}
                className="text-[11px] font-black uppercase flex items-center gap-1 text-neutral-700 hover:text-black underline cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                Kelola
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {/* Tombol filter SEMUA */}
            <button
              type="button"
              onClick={() => onSelectWalletFilter(null)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border-2 rounded-lg text-[11px] font-black whitespace-nowrap transition-all cursor-pointer ${
                !selectedWalletFilterId
                  ? 'bg-[#121214] text-white border-[#121214] shadow-[2px_2px_0px_#A3E635]'
                  : 'bg-white text-[#121214] border-[#121214] hover:bg-neutral-50'
              }`}
            >
              Semua Dompet
            </button>

            {/* List Pills Dompet */}
            {wallets.map(w => {
              const isSelected = selectedWalletFilterId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onSelectWalletFilter(isSelected ? null : w.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FDE047] text-[#121214] border-[#121214] shadow-[2px_2px_0px_#121214] scale-102'
                      : 'bg-neutral-100 text-[#121214] border-[#121214] hover:bg-neutral-200'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-[#121214] shrink-0"
                    style={{ backgroundColor: w.color }}
                  />
                  <span>{w.name}:</span>
                  <span className="font-black text-[#121214]">
                    {isBalanceHidden ? '••••' : formatRupiah(w.balance)}
                  </span>
                </button>
              );
            })}

            {/* Tombol Cepat Tambah Dompet (+) */}
            <button
              type="button"
              onClick={onOpenWalletsModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#A3E635] border-2 border-[#121214] rounded-lg text-[11px] font-black uppercase text-[#121214] shadow-[1.5px_1.5px_0px_#121214] hover:bg-[#86efac] whitespace-nowrap cursor-pointer"
              title="Tambah Dompet Baru"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Jatah Harian & Jurnaling Nyesel */}
      <div className="grid grid-cols-2 gap-3">
        {/* Daily Spending Allowance */}
        <div className="brutal-card p-3.5 bg-[#FFFFFF]">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-wider">Jatah Jajan Hari Ini</span>
          </div>
          <div className="text-lg font-black text-[#121214] tracking-tight">
            {formatRupiah(dailyAllowance)}
          </div>
          <span className="text-[10px] text-neutral-500 font-bold block mt-0.5">
            {monthlyBudget > 0 ? `Sisa ${remainingDays} hari (dari budget)` : `Sisa ${remainingDays} hari (dari saldo)`}
          </span>
        </div>

        {/* Emosi Khilaf / Nyesel */}
        <div className="brutal-card p-3.5 bg-[#FFF1F2]">
          <div className="flex items-center gap-1.5 text-rose-500 mb-1">
            <Frown className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">Belanjaan Khilaf</span>
          </div>
          <div className="text-lg font-black text-rose-700 tracking-tight">
            {formatRupiah(regretExpense)}
          </div>
          <span className="text-[10px] text-neutral-500 font-bold block mt-0.5">
            Total belanja nyesel bulan ini
          </span>
        </div>
      </div>

      {/* Top 5 Kategori Bocor Halus Bulan Ini */}
      {sortedCategories.length > 0 && (
        <div className="brutal-card p-3.5 bg-white space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-[#121214]">
              Top Pengeluaran Bulan Ini
            </span>
            <span className="text-[10px] font-bold text-neutral-500">
              Total {formatRupiah(totalExpenseSum)}
            </span>
          </div>
          <div className="space-y-1.5">
            {sortedCategories.map(([cat, amount], idx) => {
              const pct = totalExpenseSum > 0 ? Math.round((amount / totalExpenseSum) * 100) : 0;
              const barColors = ['bg-[#38BDF8]', 'bg-[#FACC15]', 'bg-[#FB7185]', 'bg-[#A3E635]', 'bg-[#DDD6FE]'];
              const color = barColors[idx % barColors.length];
              return (
                <div key={cat} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-[#121214] uppercase">#{cat}</span>
                    <span className="text-neutral-600">{formatRupiah(amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 border border-[#121214] rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kartu Boncos Bar (Burn Rate Meter) */}
      <div className="brutal-card p-4 bg-[#FFFFFF]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-xs font-black uppercase text-[#121214]">
              Boncos Meter Bulan Ini
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`brutal-badge text-[10px] ${statusBadge.bg} ${statusBadge.color}`}>
              {statusBadge.text}
            </span>
            <button
              onClick={onSetBudgetModal}
              className="text-[11px] font-black underline text-neutral-600 hover:text-black cursor-pointer"
            >
              Ubah Limit (Type)
            </button>
          </div>
        </div>

        <div className="w-full h-5 bg-neutral-100 border-2 border-[#121214] rounded-lg overflow-hidden p-0.5 relative">
          <div
            className={`h-full rounded transition-all duration-300 border border-[#121214] ${
              burnPercent >= 100 ? 'bg-[#FB7185]' : burnPercent >= 80 ? 'bg-[#FACC15]' : 'bg-[#A3E635]'
            }`}
            style={{ width: `${burnPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2 text-[11px] font-bold text-neutral-600">
          <span>
            {monthlyBudget > 0 ? (
              <>
                Sisa Budget: <strong className="text-[#121214] font-black">{formatRupiah(remainingBudget)}</strong> ({Math.round(remainingPercent)}%)
              </>
            ) : (
              <span>Sisa Budget: <strong className="text-[#121214] font-black">Rp 0</strong></span>
            )}
          </span>
          <span>
            Limit: <strong className="text-[#121214] font-black">{formatRupiah(monthlyBudget)}</strong>
          </span>
        </div>
      </div>

      {/* Quick Toolbars: Kantong Impian, Catatan Hutang, Langganan */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onOpenWishlistModal}
          className="brutal-btn py-2.5 px-2 bg-[#DDD6FE] text-[#121214] text-xs uppercase gap-1.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
        >
          <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
          <span>Wishlist</span>
        </button>

        <button
          type="button"
          onClick={onOpenDebtModal}
          className="brutal-btn py-2.5 px-2 bg-[#FED7AA] text-[#121214] text-xs uppercase gap-1.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
        >
          <BookOpen className="w-4 h-4 text-orange-800 shrink-0" />
          <span>Hutang</span>
        </button>

        <button
          type="button"
          onClick={onOpenSubscriptionModal}
          className="brutal-btn py-2.5 px-2 bg-[#38BDF8] text-[#121214] text-xs uppercase gap-1.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
        >
          <RefreshCw className="w-4 h-4 text-sky-800 shrink-0" />
          <span>Langganan</span>
        </button>
      </div>
    </div>
  );
};
