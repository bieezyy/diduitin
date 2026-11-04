import React, { useState } from 'react';
import { ShieldCheck, Zap, ArrowRight, Check, Wallet, Code2, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'KENALAN DULU',
      badgeColor: 'bg-[#FACC15]',
      title: 'Selamat Datang di diduitin',
      desc: 'diduitin adalah aplikasi pencatatan keuangan personal berestetika Clean Neo-Brutalist yang dirancang khusus untuk Gen-Z dan kaum muda agar melek finansial tanpa ribet akuntansi.',
      icon: <Wallet className="w-9 h-9 text-[#121214] stroke-[2.5]" />,
      highlight: 'Cepat, anti boncos, offline-first, dan bebas tracking iklan.'
    },
    {
      badge: 'CREATOR & DEV',
      badgeColor: 'bg-[#38BDF8]',
      title: 'Bieezy Solo Developer',
      desc: 'Aplikasi ini dirancang dan dibangun mandiri oleh Bieezy sebagai solo developer (2026) dengan visi menghadirkan tool finansial yang jujur, estetik, dan menyenangkan dipakai setiap hari.',
      icon: <Code2 className="w-9 h-9 text-sky-800 stroke-[2.5]" />,
      highlight: 'Built with passion by Bieezy • Solo Developer 2026'
    },
    {
      badge: '100% AMAN & OFFLINE',
      badgeColor: 'bg-[#A3E635]',
      title: 'Privasi Terjaga, Zero Cloud',
      desc: 'Semua catatan finansial tersimpan aman di perangkat browser/HP Anda sendiri via IndexedDB (Dexie). Bebas pelacakan dan tanpa server pihak ketiga.',
      icon: <ShieldCheck className="w-9 h-9 text-emerald-700 stroke-[2.5]" />,
      highlight: 'Kontrol data mutlak di tangan pengguna. Ekspor cadangan kapan saja.'
    },
    {
      badge: 'MINDFUL SPENDING',
      badgeColor: 'bg-[#DDD6FE]',
      title: 'Pantau Kebutuhan vs Impulsif',
      desc: 'Ketahui ke mana uang bocor halus. Dilengkapi Boncos Meter, limit harian, kantong impian, kalkulator split bill WA, tagih piutang, dan arsip struk.',
      icon: <Zap className="w-9 h-9 text-purple-700 stroke-[2.5]" />,
      highlight: 'Membantu mengambil keputusan belanja yang lebih bijak.'
    }
  ];

  const currentSlide = slides[step];

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border-3 border-[#121214] rounded-2xl shadow-[8px_8px_0px_#121214] p-5 sm:p-6 space-y-4 text-center relative">
        
        {/* Shape Arrow Before & Next Navigation Header */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 0}
            className="w-8 h-8 rounded-lg border-2 border-[#121214] bg-white hover:bg-neutral-100 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed shadow-[1.5px_1.5px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title="Sebelumnya (Before)"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Floating Indicator Dots */}
          <div className="flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`h-2 rounded-full border border-[#121214] transition-all duration-300 cursor-pointer ${
                  i === step ? 'w-6 bg-[#A3E635]' : 'w-2 bg-neutral-200'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-lg border-2 border-[#121214] bg-[#A3E635] hover:bg-[#86efac] flex items-center justify-center shadow-[1.5px_1.5px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            title={step === slides.length - 1 ? 'Selesai' : 'Berikutnya (Next)'}
          >
            {step === slides.length - 1 ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Icon Card Box */}
        <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-[#121214] bg-[#F9F9FB] shadow-[3px_3px_0px_#121214] flex items-center justify-center">
          {currentSlide.icon}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <span className={`brutal-badge text-[10px] ${currentSlide.badgeColor}`}>
            {currentSlide.badge}
          </span>
          <h2 className="text-xl font-black text-[#121214] tracking-tight leading-snug">
            {currentSlide.title}
          </h2>
          <p className="text-xs font-bold text-neutral-600 leading-relaxed">
            {currentSlide.desc}
          </p>
        </div>

        {/* Highlight Quote */}
        <div className="p-2.5 bg-neutral-100 border border-[#121214] rounded-lg text-[11px] font-black text-[#121214]">
          {currentSlide.highlight}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleNext}
          className="brutal-btn w-full py-3 bg-[#A3E635] text-xs font-black uppercase tracking-wider gap-2 cursor-pointer shadow-[3px_3px_0px_#121214]"
        >
          <span>{step === slides.length - 1 ? 'Mulai Pakai diduitin' : 'Lanjut'}</span>
          {step === slides.length - 1 ? (
            <Check className="w-4 h-4 stroke-[3]" />
          ) : (
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          )}
        </button>

        {/* Skip Button */}
        {step < slides.length - 1 && (
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-neutral-400 hover:text-black underline block mx-auto cursor-pointer"
          >
            Lewati Pengenalan
          </button>
        )}

      </div>
    </div>
  );
};
