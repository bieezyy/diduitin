import React, { useState, useEffect } from 'react';
import { db } from '../db';
import type { Wallet, Transaction, TransactionType, SpendingNature, SpendingMood } from '../types';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check, X, Delete, Smile, Meh, Frown, Camera } from 'lucide-react';
import { compressReceiptImage } from '../utils/imageCompressor';
import { triggerHaptic } from '../utils/haptics';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onSuccess: () => void;
  editTransaction?: Transaction | null;
  activeFilterWalletId?: string | null;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  wallets = [],
  onSuccess,
  editTransaction,
  activeFilterWalletId
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [targetWalletId, setTargetWalletId] = useState<string>('');
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [nature, setNature] = useState<SpendingNature>('need');
  const [mood, setMood] = useState<SpendingMood>('worth');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State ActionModal Reusable
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setType(editTransaction.type);
        setAmountStr(editTransaction.amount ? editTransaction.amount.toString() : '');
        setSelectedWalletId(editTransaction.walletId || (wallets.length > 0 ? wallets[0].id : ''));
        setTargetWalletId(editTransaction.targetWalletId || (wallets.length > 1 ? wallets[1].id : ''));
        setCategoryInput(editTransaction.category || '');
        setNote(editTransaction.note || '');
        setNature(editTransaction.nature || 'need');
        setMood(editTransaction.mood || 'worth');
        setReceiptImage(editTransaction.receiptImage || null);
      } else {
        // Cerdas memilih dompet: prioritaskan filter aktif dashboard, lalu last used, lalu dompet pertama
        const lastUsedId = localStorage.getItem('diduitin_last_used_wallet_id');
        const defaultWalletId =
          (activeFilterWalletId && wallets.some(w => w.id === activeFilterWalletId))
            ? activeFilterWalletId
            : (lastUsedId && wallets.some(w => w.id === lastUsedId))
            ? lastUsedId
            : wallets.length > 0
            ? wallets[0].id
            : '';

        setType('expense');
        setAmountStr('');
        setSelectedWalletId(defaultWalletId);
        setTargetWalletId(wallets.length > 1 ? (wallets.find(w => w.id !== defaultWalletId)?.id || wallets[1].id) : '');
        setCategoryInput('');
        setNote('');
        setNature('need');
        setMood('worth');
        setReceiptImage(null);
      }
    }
  }, [isOpen, editTransaction, wallets, activeFilterWalletId]);

  if (!isOpen) return null;

  const handleNumpadClick = (val: string) => {
    triggerHaptic('light');
    if (val === 'C') {
      setAmountStr('');
      return;
    }
    if (val === 'DEL') {
      setAmountStr(prev => (prev.length > 1 ? prev.slice(0, -1) : ''));
      return;
    }
    if (val === '000') {
      if (amountStr && amountStr !== '0' && amountStr.length <= 8) {
        setAmountStr(prev => prev + '000');
      }
      return;
    }
    if (amountStr.length >= 10) return;
    setAmountStr(prev => (!prev || prev === '0' ? val : prev + val));
  };

  // Keyboard Support untuk Angka dan Backspace
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return; // Biarkan input teks kategori/catatan menangani ketikan sendiri
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumpadClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumpadClick('DEL');
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'Delete') {
        e.preventDefault();
        handleNumpadClick('C');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressReceiptImage(file);
      setReceiptImage(compressedBase64);
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Gagal Memproses Foto',
        message: 'Gagal memproses foto struk. Coba file gambar lain.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(amountStr, 10);
    if (!numericAmount || numericAmount <= 0) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Nominal Kosong',
        message: 'Masukkan nominal yang valid dulu ya!',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (!selectedWalletId && wallets.length > 0) {
      setSelectedWalletId(wallets[0].id);
    }

    setIsSubmitting(true);
    try {
      const activeWalletId = selectedWalletId || wallets[0]?.id;
      if (!activeWalletId) {
        setActionModal({
          isOpen: true,
          type: 'warning',
          title: 'Dompet Kosong',
          message: 'Anda belum memiliki dompet. Buat dompet terlebih dahulu di menu Kelola Dompet.',
          confirmText: 'Mengerti',
          onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
        });
        return;
      }

      const now = new Date();
      const todayStr = editTransaction ? editTransaction.date : now.toISOString().split('T')[0];

      // Kategori custom / fallback default
      const finalCategory =
        type === 'transfer'
          ? 'transfer'
          : categoryInput.trim().replace(/^#+/, '') || (type === 'expense' ? 'pengeluaran' : 'pemasukan');

      if (editTransaction) {
        // Rollback saldo transaksi lama terlebih dahulu
        const oldSource = await db.wallets.get(editTransaction.walletId);
        if (oldSource) {
          if (editTransaction.type === 'expense') {
            await db.wallets.update(editTransaction.walletId, { balance: oldSource.balance + editTransaction.amount });
          } else if (editTransaction.type === 'income') {
            await db.wallets.update(editTransaction.walletId, { balance: oldSource.balance - editTransaction.amount });
          } else if (editTransaction.type === 'transfer' && editTransaction.targetWalletId) {
            const oldTarget = await db.wallets.get(editTransaction.targetWalletId);
            await db.wallets.update(editTransaction.walletId, { balance: oldSource.balance + editTransaction.amount });
            if (oldTarget) {
              await db.wallets.update(editTransaction.targetWalletId, { balance: oldTarget.balance - editTransaction.amount });
            }
          }
        }

        // Simpan pembaruan transaksi
        await db.transactions.update(editTransaction.id, {
          type,
          amount: numericAmount,
          walletId: activeWalletId,
          targetWalletId: type === 'transfer' ? targetWalletId : undefined,
          category: finalCategory,
          note: note.trim() || undefined,
          nature: type === 'expense' ? nature : undefined,
          mood: type === 'expense' ? mood : undefined,
          receiptImage: receiptImage || undefined
        });
      } else {
        // 1. Simpan Transaksi Baru
        await db.transactions.add({
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type,
          amount: numericAmount,
          walletId: activeWalletId,
          targetWalletId: type === 'transfer' ? targetWalletId : undefined,
          category: finalCategory,
          note: note.trim() || undefined,
          date: todayStr,
          timestamp: Date.now(),
          nature: type === 'expense' ? nature : undefined,
          mood: type === 'expense' ? mood : undefined,
          receiptImage: receiptImage || undefined
        });
      }

      // 2. Terapkan Saldo Dompet Baru
      const sourceWallet = await db.wallets.get(activeWalletId);
      if (sourceWallet) {
        if (type === 'expense') {
          await db.wallets.update(activeWalletId, {
            balance: sourceWallet.balance - numericAmount
          });
        } else if (type === 'income') {
          await db.wallets.update(activeWalletId, {
            balance: sourceWallet.balance + numericAmount
          });
        } else if (type === 'transfer' && targetWalletId && targetWalletId !== activeWalletId) {
          const targetWallet = await db.wallets.get(targetWalletId);
          if (targetWallet) {
            await db.wallets.update(activeWalletId, {
              balance: sourceWallet.balance - numericAmount
            });
            await db.wallets.update(targetWalletId, {
              balance: targetWallet.balance + numericAmount
            });
          }
        }
      }

      // Animasi feedback positif
      triggerHaptic('success');
      if (type === 'income' || mood === 'worth') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }

      // Simpan dompet terakhir yang dipakai untuk auto-assign transaksi berikutnya
      if (activeWalletId) {
        localStorage.setItem('diduitin_last_used_wallet_id', activeWalletId);
      }

      // Reset form
      setAmountStr('');
      setCategoryInput('');
      setNote('');
      setReceiptImage(null);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Gagal Menyimpan',
        message: 'Gagal menyimpan transaksi ke database lokal.',
        confirmText: 'Tutup',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericDisplay = parseInt(amountStr, 10);
  const formattedDisplay = !isNaN(numericDisplay) && numericDisplay > 0
    ? new Intl.NumberFormat('id-ID').format(numericDisplay)
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#FFFFFF] border-t-4 sm:border-2 border-[#121214] sm:rounded-2xl rounded-t-3xl shadow-[0_-8px_0px_#121214] sm:shadow-[6px_6px_0px_#121214] p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214]">
          <span className="text-sm font-black uppercase tracking-wider bg-[#FACC15] px-2.5 py-1 rounded border border-[#121214]">
            {editTransaction ? 'Edit Transaksi' : 'Catat Cepat'}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border-2 border-[#121214] hover:bg-rose-100 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5 text-[#121214]" />
          </button>
        </div>

        {/* Segment Type Selector */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`brutal-btn py-2 text-xs uppercase flex gap-1.5 cursor-pointer ${
              type === 'expense' ? 'bg-[#FB7185] text-[#121214]' : 'bg-[#F9F9FB] text-neutral-600'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Keluar
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`brutal-btn py-2 text-xs uppercase flex gap-1.5 cursor-pointer ${
              type === 'income' ? 'bg-[#A3E635] text-[#121214]' : 'bg-[#F9F9FB] text-neutral-600'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`brutal-btn py-2 text-xs uppercase flex gap-1.5 cursor-pointer ${
              type === 'transfer' ? 'bg-[#DDD6FE] text-[#121214]' : 'bg-[#F9F9FB] text-neutral-600'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Pindah
          </button>
        </div>

        {/* Display Nominal Besar */}
        <div className="p-3 bg-[#F9F9FB] border-2 border-[#121214] rounded-xl text-center mb-3 relative select-none">
          <span className="text-xs font-bold text-neutral-500 uppercase block mb-1">Nominal (Rp)</span>
          <div className="text-3xl font-black tracking-tight text-[#121214] flex items-center justify-center">
            <span className="text-lg mr-1 text-neutral-400">Rp</span>
            <span>{formattedDisplay}</span>
          </div>
          {amountStr ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNumpadClick('DEL');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 bg-white border-2 border-[#121214] rounded-lg text-neutral-800 hover:text-black hover:bg-rose-100 shadow-[2px_2px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              title="Hapus Satu Digit"
            >
              <Delete className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : null}
        </div>

        {/* Numpad Cepat */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '000'].map(keyVal => (
            <button
              key={keyVal}
              type="button"
              onClick={() => handleNumpadClick(keyVal)}
              className={`py-2.5 font-black text-base border-2 border-[#121214] rounded-lg shadow-[2px_2px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                keyVal === 'C' ? 'bg-[#FB7185] text-white hover:bg-rose-600 col-span-1' : 'bg-[#FFFFFF] hover:bg-neutral-50'
              }`}
            >
              {keyVal}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleNumpadClick('DEL')}
            className="col-span-4 py-2 font-black text-xs uppercase bg-[#FEF08A] border-2 border-[#121214] rounded-lg shadow-[2px_2px_0px_#121214] flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 hover:bg-amber-200 cursor-pointer"
          >
            <Delete className="w-4 h-4" />
            Hapus Angka (Backspace)
          </button>
        </div>

        {/* Pemilihan Dompet */}
        <div className="mb-3">
          <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
            {type === 'transfer' ? 'Dari Dompet:' : 'Dompet / Rekening:'}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {wallets.length === 0 ? (
              <span className="text-[11px] font-bold text-neutral-400 italic">
                Belum ada dompet. Tambah di menu Kelola Dompet.
              </span>
            ) : (
              wallets.map(w => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWalletId(w.id)}
                  className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedWalletId === w.id
                      ? 'border-[#121214] bg-[#121214] text-white shadow-[2px_2px_0px_#A3E635]'
                      : 'border-[#121214] bg-white text-[#121214]'
                  }`}
                >
                  {w.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Jika Transfer: Dompet Tujuan */}
        {type === 'transfer' && (
          <div className="mb-3">
            <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
              Ke Dompet Tujuan:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {wallets.length < 2 ? (
                <span className="text-[11px] font-bold text-neutral-400 italic">
                  Butuh minimal 2 dompet untuk transfer antar dompet.
                </span>
              ) : (
                wallets
                  .filter(w => w.id !== selectedWalletId)
                  .map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setTargetWalletId(w.id)}
                      className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        targetWalletId === w.id
                          ? 'border-[#121214] bg-[#DDD6FE] text-[#121214] shadow-[2px_2px_0px_#121214]'
                          : 'border-[#121214] bg-white text-[#121214]'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Kategori Input */}
        {type !== 'transfer' && (
          <div className="mb-3">
            <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
              Kategori / Keperluan:
            </label>
            <input
              type="text"
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              placeholder="Ketik kategori bebas (misal: kopi, bensin, nonton, gaji)"
              className="brutal-input w-full text-xs"
              maxLength={40}
            />
          </div>
        )}

        {/* Khusus Pengeluaran: Jurnaling Emosi (Need vs Want & Mood) */}
        {type === 'expense' && (
          <div className="p-3 bg-[#F9F9FB] border-2 border-[#121214] rounded-xl mb-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-neutral-600">Sifat Pengeluaran:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setNature('need')}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border border-[#121214] cursor-pointer transition-all ${
                    nature === 'need' ? 'bg-[#A3E635] shadow-[1.5px_1.5px_0px_#121214]' : 'bg-white opacity-70'
                  }`}
                >
                  Kebutuhan (Need)
                </button>
                <button
                  type="button"
                  onClick={() => setNature('want')}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border border-[#121214] cursor-pointer transition-all ${
                    nature === 'want' ? 'bg-[#FB7185] shadow-[1.5px_1.5px_0px_#121214]' : 'bg-white opacity-70'
                  }`}
                >
                  Keinginan / FOMO
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-300">
              <span className="text-[10px] font-black uppercase text-neutral-600">Evaluasi Belanja:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMood('worth')}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border border-[#121214] flex items-center gap-1 cursor-pointer transition-all ${
                    mood === 'worth' ? 'bg-[#FDE047] shadow-[1.5px_1.5px_0px_#121214]' : 'bg-white opacity-70'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5 text-emerald-800" /> Worth
                </button>
                <button
                  type="button"
                  onClick={() => setMood('neutral')}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border border-[#121214] flex items-center gap-1 cursor-pointer transition-all ${
                    mood === 'neutral' ? 'bg-neutral-200 shadow-[1.5px_1.5px_0px_#121214]' : 'bg-white opacity-70'
                  }`}
                >
                  <Meh className="w-3.5 h-3.5 text-neutral-800" /> Netral
                </button>
                <button
                  type="button"
                  onClick={() => setMood('regret')}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md border border-[#121214] flex items-center gap-1 cursor-pointer transition-all ${
                    mood === 'regret' ? 'bg-rose-200 shadow-[1.5px_1.5px_0px_#121214]' : 'bg-white opacity-70'
                  }`}
                >
                  <Frown className="w-3.5 h-3.5 text-rose-800" /> Nyesel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Foto Struk / Bukti Invoice */}
        <div className="p-3 bg-[#F9F9FB] border-2 border-[#121214] rounded-xl mb-3 space-y-2">
          <span className="text-[10px] font-black uppercase text-neutral-600 block">
            Foto Struk / Screenshot Bukti:
          </span>
          {!receiptImage ? (
            <label className="brutal-btn w-full py-2 bg-white text-xs uppercase gap-1.5 cursor-pointer">
              <Camera className="w-4 h-4 text-neutral-700" />
              <span>{isCompressing ? 'Memproses Foto...' : 'Foto / Unggah Struk'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                disabled={isCompressing}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-2 bg-white border border-[#121214] rounded-lg">
              <div className="flex items-center gap-2">
                <img
                  src={receiptImage}
                  alt="Preview Struk"
                  className="w-10 h-10 object-cover rounded border border-[#121214]"
                />
                <span className="text-[11px] font-black text-emerald-700">Foto Struk Terlampir ✓</span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptImage(null)}
                className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                title="Hapus Foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Catatan Pendek */}
        <div className="mb-4">
          <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
            Catatan Tambahan (Opsional):
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Detail transaksi (misal: nongkrong bareng temen kantor)"
            className="brutal-input w-full text-xs"
            maxLength={60}
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || isCompressing || !amountStr || amountStr === '0' || wallets.length === 0}
          className="brutal-btn w-full py-3 bg-[#A3E635] text-[#121214] text-sm uppercase tracking-wide gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          {wallets.length === 0
            ? 'Buat Dompet Dulu'
            : editTransaction
            ? 'Simpan Perubahan'
            : 'Simpan Transaksi'}
        </button>

        {/* Reusable Action Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
