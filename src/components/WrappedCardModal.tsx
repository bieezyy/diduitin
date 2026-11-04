import React, { useState } from 'react';
import { formatRupiah } from '../constants/categories';
import { X, Sparkles, Flame, Smile, Frown, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface WrappedCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyExpense: number;
  monthlyBudget: number;
  needPercent: number;
  wantPercent: number;
  regretExpense: number;
  topCategory: { name: string; amount: number } | null;
}

export const WrappedCardModal: React.FC<WrappedCardModalProps> = ({
  isOpen,
  onClose,
  monthlyExpense,
  monthlyBudget,
  needPercent,
  wantPercent,
  regretExpense,
  topCategory
}) => {
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  if (!isOpen) return null;

  const now = new Date();
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonthName = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const burnRate = monthlyBudget > 0 ? Math.round((monthlyExpense / monthlyBudget) * 100) : 0;
  
  // Tentukan Persona Keuangan Gen-Z
  let persona = {
    title: 'Anak Baik (Disiplin Abis)',
    badgeBg: 'bg-[#A3E635]',
    desc: 'Pengeluaran terkontrol rapi, jauh dari boncos, fomo terkendali!'
  };

  if (burnRate > 100) {
    persona = {
      title: 'Sultan Boncos 💸',
      badgeBg: 'bg-[#FB7185]',
      desc: 'Limit jebol bro! Kurangi jajan kopi dan nongkrong impulsive ya.'
    };
  } else if (wantPercent > 60) {
    persona = {
      title: 'Korban Algoritma FOMO 🛍️',
      badgeBg: 'bg-[#FDE047]',
      desc: 'Banyakan jajan lapar mata dibanding kebutuhan pokok!'
    };
  } else if (regretExpense > 100000) {
    persona = {
      title: 'Raja Penyesalan 😭',
      badgeBg: 'bg-[#FDA4AF]',
      desc: 'Banyak belanja yang pas pulang langsung nyesel!'
    };
  }

  const handleShareText = () => {
    const text = `✨ Finansial Recap ${currentMonthName} (via diduitin):\n` +
      `🏆 Persona: ${persona.title}\n` +
      `🔥 Boncos Meter: ${burnRate}%\n` +
      `🛒 Kebutuhan: ${needPercent}% | FOMO: ${wantPercent}%\n` +
      (topCategory ? `☕ Kebocoran Terbesar: #${topCategory.name} (${formatRupiah(topCategory.amount)})\n` : '') +
      `Catat duitmu di diduitin! 🚀`;

    if (navigator.share) {
      navigator.share({
        title: `Finansial Recap ${currentMonthName}`,
        text
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setActionModal({
        isOpen: true,
        type: 'success',
        title: 'Berhasil Disalin!',
        message: 'Teks ringkasan berhasil disalin! Siap dipost di medsos atau status.',
        confirmText: 'Sip, Mantap',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white border-4 border-[#121214] rounded-2xl shadow-[8px_8px_0px_#121214] overflow-hidden">
        {/* Header Modal */}
        <div className="p-3 bg-[#FDE047] border-b-3 border-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-800" />
            <span className="text-xs font-black uppercase tracking-wider text-[#121214]">
              diduitin Wrapped
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border-2 border-[#121214] bg-white hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Kartu Visual Spotify-Wrapped Style */}
        <div className="p-5 space-y-4 bg-gradient-to-b from-[#F9F9FB] to-white">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest block">
              REKAP FINANSIAL BULAN INI
            </span>
            <h2 className="text-xl font-black text-[#121214] mt-0.5">
              {currentMonthName}
            </h2>
          </div>

          {/* Persona Box */}
          <div className="p-4 border-2 border-[#121214] rounded-xl bg-white shadow-[3px_3px_0px_#121214] text-center space-y-1">
            <span className="text-[9px] font-black uppercase text-neutral-400 block tracking-wider">
              Gelar Finansial Kamu:
            </span>
            <div className={`inline-block px-3 py-1 rounded-lg border-2 border-[#121214] font-black text-xs uppercase ${persona.badgeBg}`}>
              {persona.title}
            </div>
            <p className="text-[11px] font-bold text-neutral-600 pt-1 leading-snug">
              "{persona.desc}"
            </p>
          </div>

          {/* Statistik Grid */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 bg-[#FFF1F2] border-2 border-[#121214] rounded-xl shadow-[2px_2px_0px_#121214]">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-rose-600 mb-0.5">
                <Flame className="w-3 h-3 fill-rose-500" /> Boncos Meter
              </div>
              <div className="text-base font-black text-[#121214]">{burnRate}%</div>
              <span className="text-[9px] font-bold text-neutral-500 block">dari limit budget</span>
            </div>

            <div className="p-2.5 bg-[#F0FDF4] border-2 border-[#121214] rounded-xl shadow-[2px_2px_0px_#121214]">
              <div className="flex items-center justify-center gap-1 text-[10px] font-black uppercase text-emerald-700 mb-0.5">
                <Smile className="w-3 h-3 text-emerald-600" /> Need vs FOMO
              </div>
              <div className="text-base font-black text-[#121214]">{needPercent}% : {wantPercent}%</div>
              <span className="text-[9px] font-bold text-neutral-500 block">kebutuhan vs fomo</span>
            </div>
          </div>

          {/* Sorotan Kategori & Khilaf */}
          <div className="p-3 bg-neutral-50 border-2 border-[#121214] rounded-xl space-y-1.5 text-xs font-bold">
            {topCategory && (
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-[11px]">Bocor Halus Terbesar:</span>
                <span className="font-black uppercase text-[#121214]">#{topCategory.name}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-neutral-200 pt-1">
              <span className="text-neutral-500 text-[11px] flex items-center gap-1">
                <Frown className="w-3 h-3 text-rose-500" /> Belanja Nyesel:
              </span>
              <span className="font-black text-rose-600">{formatRupiah(regretExpense)}</span>
            </div>
          </div>

          {/* Tombol Bagikan */}
          <button
            type="button"
            onClick={handleShareText}
            className="brutal-btn w-full py-3 bg-[#A3E635] text-[#121214] text-xs uppercase gap-2 cursor-pointer shadow-[3px_3px_0px_#121214]"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            Bagikan Rekap Bulanan
          </button>
        </div>

        {/* Reusable Action Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
