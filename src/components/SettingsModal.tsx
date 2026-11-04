import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { X, Check, Coins, HelpCircle, Coffee, Copy, CheckCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  onOpenOnboarding: () => void;
  onRefresh: () => void;
  mode?: 'budget' | 'settings';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  onOpenOnboarding,
  onRefresh,
  mode = 'settings'
}) => {
  const [budgetInput, setBudgetInput] = useState(currentBudget ? currentBudget.toString() : '0');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedEwallet, setCopiedEwallet] = useState<string | null>(null);

  // State ActionModal Reusable
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(currentBudget ? currentBudget.toString() : '0');
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const numericVal = parseInt(budgetInput.replace(/\D/g, ''), 10) || 0;

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setBudgetInput(rawVal);
  };

  const handleQuickAdd = (addAmount: number) => {
    setBudgetInput((numericVal + addAmount).toString());
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericVal < 0) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Nominal Tidak Valid',
        message: 'Masukkan limit budget yang valid.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetId = `b-${currentMonth}`;

    await db.budgets.put({
      id: budgetId,
      month: currentMonth,
      monthlyLimit: numericVal
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRefresh();
  };

  const handleCopyPayment = (providerName: string) => {
    const rawNumber = '082298350902';

    // 1. Salin nomor ke clipboard secara otomatis
    navigator.clipboard.writeText(rawNumber);
    setCopiedEwallet(providerName);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setCopiedEwallet(null), 3000);

    // 2. Direct Deep Linking langsung ke aplikasi e-wallet di HP
    if (providerName === 'DANA') {
      // Deep link resmi DANA untuk transfer langsung ke nomor HP
      window.location.href = `https://link.dana.id/sendmoney?phoneNumber=${rawNumber}`;
    } else if (providerName === 'GoPay') {
      // Membuka menu transfer GoPay langsung di aplikasi Gojek/GoPay
      window.location.href = 'gojek://gopay/transfer';
      // Fallback web jika tidak di HP
      setTimeout(() => {
        window.open('https://gopay.co.id', '_blank');
      }, 500);
    } else if (providerName === 'OVO') {
      // Membuka aplikasi OVO langsung di HP
      window.location.href = 'ovo://';
      // Fallback web jika tidak di HP
      setTimeout(() => {
        window.open('https://www.ovo.id', '_blank');
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214] mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
            {mode === 'budget' ? (
              <>
                <Coins className="w-4 h-4 text-amber-500" />
                Ubah Limit Budget
              </>
            ) : (
              <>
                <Coffee className="w-4 h-4 text-amber-500" />
                Pengaturan & Dukungan
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border-2 border-[#121214] hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 'budget': Hanya tampilkan Form Target/Limit Bulanan */}
        {mode === 'budget' && (
          <form onSubmit={handleSaveBudget} className="p-4 border-2 border-[#121214] rounded-xl bg-[#F9F9FB] space-y-3 shadow-[2px_2px_0px_#121214]">
            <span className="text-xs font-black uppercase text-[#121214] block">
              Target / Limit Belanja Bulanan
            </span>
            <p className="text-[11px] text-neutral-500 leading-tight">
              Tentukan plafon pengeluaran bulan ini agar Boncos Meter dapat mengukur kesehatan finansialmu secara presisi.
            </p>

            {/* Input Nominal Group dengan Box Prefix Terpisah */}
            <div className="flex items-stretch border-2 border-[#121214] rounded-xl overflow-hidden shadow-[2px_2px_0px_#121214] bg-white">
              <span className="px-3.5 py-2.5 bg-[#FEF08A] border-r-2 border-[#121214] text-xs font-black text-[#121214] select-none flex items-center justify-center shrink-0">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={numericVal > 0 ? new Intl.NumberFormat('id-ID').format(numericVal) : ''}
                onChange={handleBudgetChange}
                placeholder="0"
                className="w-full px-3 py-2.5 text-base font-black tracking-tight text-[#121214] outline-none bg-white placeholder:text-neutral-300"
              />
            </div>

            {/* Quick Increment Pill Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAdd(500000)}
                className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-neutral-100 border border-[#121214] rounded-md cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              >
                +500 Rb
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1000000)}
                className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-neutral-100 border border-[#121214] rounded-md cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              >
                +1 Jt
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(2000000)}
                className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-neutral-100 border border-[#121214] rounded-md cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
              >
                +2 Jt
              </button>
              <button
                type="button"
                onClick={() => setBudgetInput('0')}
                className="px-2 py-1 text-[10px] font-bold text-neutral-400 hover:text-black cursor-pointer"
              >
                Reset 0
              </button>
            </div>

            <button
              type="submit"
              className="brutal-btn w-full py-2.5 bg-[#A3E635] text-xs uppercase gap-1.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
            >
              {savedSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : null}
              <span>{savedSuccess ? 'Limit Berhasil Disimpan!' : 'Simpan Limit Bulan Ini'}</span>
            </button>
          </form>
        )}

        {/* Mode 'settings': Hanya tampilkan Panduan Singkat & Traktir buat Parkir */}
        {mode === 'settings' && (
          <div className="space-y-4">
            {/* Info Pengenalan Apps */}
            <div className="p-3 border-2 border-[#121214] rounded-xl bg-white flex items-center justify-between shadow-[2px_2px_0px_#121214]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-neutral-600" />
                <div>
                  <span className="text-xs font-black uppercase text-[#121214] block">Panduan Singkat</span>
                  <span className="text-[10px] text-neutral-500 font-bold">Kenalan dengan fitur & filosofi diduitin</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOnboarding();
                }}
                className="brutal-btn px-2.5 py-1 text-[11px] bg-[#DDD6FE] text-[#121214] uppercase cursor-pointer"
              >
                Lihat Pengenalan
              </button>
            </div>

            {/* Traktir buat Parkir (OVO, DANA, GoPay) */}
            <div className="p-4 border-2 border-[#121214] rounded-xl bg-gradient-to-br from-[#FEF08A] to-[#FDE047] space-y-3 shadow-[3px_3px_0px_#121214]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white border-2 border-[#121214] flex items-center justify-center shadow-[1px_1px_0px_#121214]">
                    <Coffee className="w-4 h-4 text-[#121214]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#121214]">Traktir buat Parkir</h3>
                    <span className="text-[10px] font-bold text-neutral-700 block">Dukungan uang receh parkir buat solo dev</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-neutral-800 font-bold leading-relaxed bg-white/70 p-2.5 rounded-lg border border-[#121214]">
                Suka pakai diduitin? Klik salah satu tombol di bawah untuk menyalin nomor dan langsung membuka pembayaran via OVO, DANA, atau GoPay:
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* OVO */}
                <button
                  type="button"
                  onClick={() => handleCopyPayment('OVO')}
                  className="brutal-btn py-2 px-1 text-xs uppercase bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#4C1D95] font-black flex flex-col items-center gap-0.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
                >
                  <span>OVO</span>
                  <span className="text-[9px] font-bold flex items-center gap-0.5">
                    {copiedEwallet === 'OVO' ? <CheckCheck className="w-3 h-3 text-emerald-700" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedEwallet === 'OVO' ? 'Tersalin' : 'Kirim'}
                  </span>
                </button>

                {/* DANA */}
                <button
                  type="button"
                  onClick={() => handleCopyPayment('DANA')}
                  className="brutal-btn py-2 px-1 text-xs uppercase bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] font-black flex flex-col items-center gap-0.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
                >
                  <span>DANA</span>
                  <span className="text-[9px] font-bold flex items-center gap-0.5">
                    {copiedEwallet === 'DANA' ? <CheckCheck className="w-3 h-3 text-emerald-700" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedEwallet === 'DANA' ? 'Tersalin' : 'Kirim'}
                  </span>
                </button>

                {/* GoPay */}
                <button
                  type="button"
                  onClick={() => handleCopyPayment('GoPay')}
                  className="brutal-btn py-2 px-1 text-xs uppercase bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] font-black flex flex-col items-center gap-0.5 cursor-pointer shadow-[2px_2px_0px_#121214]"
                >
                  <span>GoPay</span>
                  <span className="text-[9px] font-bold flex items-center gap-0.5">
                    {copiedEwallet === 'GoPay' ? <CheckCheck className="w-3 h-3 text-emerald-700" /> : <Copy className="w-2.5 h-2.5" />}
                    {copiedEwallet === 'GoPay' ? 'Tersalin' : 'Kirim'}
                  </span>
                </button>
              </div>

              {copiedEwallet && (
                <div className="text-[10px] font-black text-center text-emerald-800 bg-white p-1 rounded border border-[#121214]">
                  Nomor 082298350902 berhasil disalin ke clipboard & aplikasi dibuka ✓
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reusable Action Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
