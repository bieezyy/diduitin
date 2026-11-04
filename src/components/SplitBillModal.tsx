import React, { useState } from 'react';
import { formatRupiah } from '../constants/categories';
import { db } from '../db';
import { X, Copy, Check, Calculator, MessageCircle, UserPlus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({ isOpen, onClose, onRefresh }) => {
  const [totalBillStr, setTotalBillStr] = useState('');
  const [personCount, setPersonCount] = useState(3);
  const [taxPercent, setTaxPercent] = useState(0); // misal 10% atau 11%
  const [noteTitle, setNoteTitle] = useState('Nongkrong Bareng');
  const [copied, setCopied] = useState(false);
  const [debtSaved, setDebtSaved] = useState(false);

  // State ActionModal Reusable
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  if (!isOpen) return null;

  const rawBill = parseInt(totalBillStr.replace(/\D/g, ''), 10) || 0;
  const taxAmount = Math.round((rawBill * taxPercent) / 100);
  const finalTotal = rawBill + taxAmount;
  const perPersonAmount = personCount > 0 ? Math.ceil(finalTotal / personCount) : 0;
  // Jika saya yang nalangin, total yang diutangkan ke teman-teman adalah (total - bagian saya)
  const totalLentToFriends = personCount > 1 ? perPersonAmount * (personCount - 1) : 0;

  const shareText = `Halo guys! Rekap tagihan patungan "${noteTitle}":\nTotal Bon: ${formatRupiah(finalTotal)} (${personCount} orang)\n👉 Patungan per orang: ${formatRupiah(perPersonAmount)}\n\nBisa langsung transfer ya, thank you! 🙏`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleSaveAsDebt = async () => {
    if (finalTotal <= 0) return;
    try {
      await db.debts.add({
        id: `debt-${Date.now()}`,
        personName: `Patungan: ${noteTitle} (${personCount - 1} teman)`,
        type: 'lent',
        amount: totalLentToFriends,
        description: `Talangan split bill total ${formatRupiah(finalTotal)}, patungan @${formatRupiah(perPersonAmount)}`,
        isSettled: false,
        createdAt: Date.now()
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });

      setDebtSaved(true);
      if (onRefresh) onRefresh();
      setTimeout(() => setDebtSaved(false), 2500);
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Gagal Mencatat',
        message: 'Gagal mencatat piutang ke database lokal.',
        confirmText: 'Tutup',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FDE047] border-2 border-[#121214] flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#121214]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#121214]">
                Kalkulator Split Bill
              </h2>
              <span className="text-[10px] text-neutral-500 font-bold block">
                Hitung patungan nongkrong tanpa pusing
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border-2 border-[#121214] hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
              Nama Acara / Bon:
            </label>
            <input
              type="text"
              placeholder="Contoh: Kopi Senja, Makan Siang Kantor"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              className="brutal-input w-full text-xs font-bold"
              maxLength={40}
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
              Total Tagihan Bon (Rp):
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 150.000"
              value={totalBillStr ? new Intl.NumberFormat('id-ID').format(rawBill) : ''}
              onChange={e => setTotalBillStr(e.target.value.replace(/\D/g, ''))}
              className="brutal-input w-full text-base font-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
                Jumlah Orang:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPersonCount(p => Math.max(1, p - 1))}
                  className="px-3 py-2 bg-neutral-100 border-2 border-[#121214] rounded-lg font-black text-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  -
                </button>
                <div className="flex-1 py-2 text-center border-2 border-[#121214] rounded-lg font-black bg-white">
                  {personCount}
                </div>
                <button
                  type="button"
                  onClick={() => setPersonCount(p => p + 1)}
                  className="px-3 py-2 bg-neutral-100 border-2 border-[#121214] rounded-lg font-black text-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-neutral-700 block mb-1">
                Pajak / Service (%):
              </label>
              <select
                value={taxPercent}
                onChange={e => setTaxPercent(parseInt(e.target.value, 10))}
                className="brutal-input w-full text-xs font-bold py-2.5"
              >
                <option value={0}>Tanpa Pajak (0%)</option>
                <option value={10}>Pajak Resto (10%)</option>
                <option value={11}>PPN (11%)</option>
                <option value={15}>Pajak + Service (15%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Hasil Perhitungan Box */}
        <div className="p-4 bg-[#F9F9FB] border-2 border-[#121214] rounded-xl mb-4 shadow-[2px_2px_0px_#121214] text-center">
          <span className="text-[11px] font-black uppercase text-neutral-500 block mb-0.5">
            Jatah Bayar Per Orang:
          </span>
          <div className="text-3xl font-black text-[#121214] tracking-tight">
            {formatRupiah(perPersonAmount)}
          </div>
          {taxAmount > 0 && (
            <span className="text-[10px] text-neutral-500 font-bold block mt-1">
              (Total + Pajak: {formatRupiah(finalTotal)})
            </span>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-2">
          {/* Tombol Buka WhatsApp Langsung */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={rawBill <= 0}
            className="brutal-btn w-full py-2.5 bg-[#25D366] text-white text-xs uppercase gap-2 cursor-pointer disabled:opacity-50 hover:bg-[#1ebc59]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim Rekap ke WhatsApp</span>
          </button>

          {/* Tombol Copy Teks */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={rawBill <= 0}
            className="brutal-btn w-full py-2.5 bg-white text-xs uppercase gap-2 cursor-pointer disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4 stroke-[3] text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Teks Berhasil Disalin!' : 'Salin Format Teks'}</span>
          </button>

          {/* Tombol Jadikan Catatan Piutang Teman */}
          {personCount > 1 && (
            <button
              type="button"
              onClick={handleSaveAsDebt}
              disabled={rawBill <= 0 || debtSaved}
              className={`brutal-btn w-full py-2.5 text-xs uppercase gap-2 cursor-pointer disabled:opacity-50 transition-all ${
                debtSaved ? 'bg-[#A3E635] text-[#121214]' : 'bg-[#DDD6FE] text-[#121214]'
              }`}
            >
              {debtSaved ? <Check className="w-4 h-4 stroke-[3]" /> : <UserPlus className="w-4 h-4" />}
              <span>
                {debtSaved
                  ? 'Tersimpan di Catatan Piutang ✓'
                  : `Saya Talangin: Catat Piutang (${formatRupiah(totalLentToFriends)})`}
              </span>
            </button>
          )}
        </div>

        {/* Reusable Action Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
