import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { X, Check, Coins, HelpCircle, MessageSquarePlus, Send, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';
import { soundEngine } from '../utils/soundFx';
import { ActionModal, type AlertModalState } from './ActionModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  totalBalance?: number;
  onOpenOnboarding: () => void;
  onRefresh: () => void;
  mode?: 'budget' | 'settings';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  totalBalance,
  onOpenOnboarding,
  onRefresh,
  mode = 'settings'
}) => {
  const [budgetInput, setBudgetInput] = useState(currentBudget ? currentBudget.toString() : '0');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => {
    return soundEngine.getMuted();
  });

  const toggleDarkMode = () => {
    triggerHaptic('medium');
    soundEngine.playTap();
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('diduitin_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('diduitin_theme', 'light');
    }
  };

  const toggleSoundFx = () => {
    triggerHaptic('light');
    const muted = soundEngine.toggleMute();
    setIsSfxMuted(muted);
  };

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

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setBudgetInput(raw);
  };

  const numericVal = parseInt(budgetInput, 10) || 0;

  const handleQuickAdd = (amount: number) => {
    triggerHaptic('light');
    const current = parseInt(budgetInput, 10) || 0;
    setBudgetInput((current + amount).toString());
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetId = `b-${currentMonth}`;

    // Validasi agar nominal limit tidak lebih besar dari Total Saldo (jika saldo tersedia dan > 0)
    if (totalBalance !== undefined && totalBalance > 0 && numericVal > totalBalance) {
      triggerHaptic('warning');
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Limit Melebihi Total Saldo',
        message: `Limit budget (${new Intl.NumberFormat('id-ID').format(numericVal)}) tidak boleh lebih besar daripada Total Saldo Anda (${new Intl.NumberFormat('id-ID').format(totalBalance)}). Harap sesuaikan nominal limit.`,
        confirmText: 'Sesuaikan',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    await db.budgets.put({
      id: budgetId,
      month: currentMonth,
      monthlyLimit: numericVal
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRefresh();
  };

  // Kirim masukan & saran pengguna ke email tanpa mengekspos alamat email di teks UI
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      triggerHaptic('warning');
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Masukan Masih Kosong',
        message: 'Ketik masukan atau saran Anda terlebih dahulu sebelum mengirim.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    triggerHaptic('success');
    setIsSubmittingFeedback(true);

    const recipient = 'al' + 'di' + 'ro' + 'bi' + 'is' + '@' + 'gm' + 'ail' + '.' + 'com';
    const subject = encodeURIComponent('Masukan & Saran Pengguna diduitin');
    const body = encodeURIComponent(feedbackText.trim() + '\n\n---\nDikirim dari Aplikasi diduitin');

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

    // Buka aplikasi email di perangkat user dengan draft yang sudah terisi
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;

    setActionModal({
      isOpen: true,
      type: 'success',
      title: 'Terima Kasih Banyak!',
      message: 'Saran Anda sangat berharga untuk pengembangan diduitin berikutnya.',
      confirmText: 'Selesai',
      onConfirm: () => {
        setActionModal(prev => ({ ...prev, isOpen: false }));
        setFeedbackText('');
        setIsSubmittingFeedback(false);
      }
    });
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
                <MessageSquarePlus className="w-4 h-4 text-[#121214]" />
                Pengaturan & Masukan
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
              {totalBalance !== undefined && totalBalance > 0 && (
                <span className="block mt-1 font-bold text-[#121214]">
                  Maksimal limit yang disarankan: Rp {new Intl.NumberFormat('id-ID').format(totalBalance)} (Total Saldo)
                </span>
              )}
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

        {/* Mode 'settings': Tema, Suara, Panduan Singkat & Punya Masukan dan Saran */}
        {mode === 'settings' && (
          <div className="space-y-3">
            {/* Opsi Tampilan & Audio (Nomor 16 & 18) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-3 border-2 border-[#121214] rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 shadow-[2px_2px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500 stroke-[2.5]" /> : <Moon className="w-5 h-5 text-neutral-800 stroke-[2.5]" />}
                <span className="text-[11px] font-black uppercase text-[#121214]">
                  {isDarkMode ? 'Mode Terang' : 'Dark Mode'}
                </span>
                <span className="text-[9px] font-bold text-neutral-500">
                  {isDarkMode ? 'Aktif: Gelap' : 'Aktif: Terang'}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleSoundFx}
                className="p-3 border-2 border-[#121214] rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 shadow-[2px_2px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                {isSfxMuted ? <VolumeX className="w-5 h-5 text-neutral-400 stroke-[2.5]" /> : <Volume2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />}
                <span className="text-[11px] font-black uppercase text-[#121214]">
                  {isSfxMuted ? 'Suara Hening' : 'Suara 8-Bit'}
                </span>
                <span className="text-[9px] font-bold text-neutral-500">
                  {isSfxMuted ? 'Muted' : 'Retro SFX On'}
                </span>
              </button>
            </div>

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

            {/* Punya Masukan dan Saran? */}
            <form onSubmit={handleSubmitFeedback} className="p-4 border-2 border-[#121214] rounded-xl bg-gradient-to-br from-[#FEF08A] to-[#FDE047] space-y-3 shadow-[3px_3px_0px_#121214]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border-2 border-[#121214] flex items-center justify-center shadow-[1px_1px_0px_#121214]">
                  <MessageSquarePlus className="w-4 h-4 text-[#121214]" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-[#121214]">Punya Masukan dan Saran?</h3>
                  <span className="text-[10px] font-bold text-neutral-700 block">Sampaikan fitur atau hal yang ingin Anda tingkatkan</span>
                </div>
              </div>

              {/* Box Type Input (Textarea) */}
              <textarea
                rows={4}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Tulis masukan, kritik, atau ide fitur yang Anda inginkan di sini..."
                className="brutal-input w-full text-xs font-bold bg-white"
                maxLength={400}
              />

              {/* Tombol Submit */}
              <button
                type="submit"
                disabled={isSubmittingFeedback || !feedbackText.trim()}
                className="brutal-btn w-full py-2.5 bg-[#A3E635] text-[#121214] text-xs font-black uppercase tracking-wide gap-1.5 cursor-pointer shadow-[2px_2px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Submit Masukan</span>
              </button>
            </form>
          </div>
        )}

        {/* Reusable Action Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
