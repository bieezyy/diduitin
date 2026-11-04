import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, Delete } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PinLockModalProps {
  onUnlock: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({ onUnlock }) => {
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [isConfirmingStep, setIsConfirmingStep] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    const savedPin = localStorage.getItem('diduitin_user_pin');
    setHasPin(Boolean(savedPin));
  }, []);

  const handleNumpad = (digit: string) => {
    setErrorMessage('');
    if (digit === 'DEL') {
      if (isConfirmingStep) {
        setConfirmPinInput(prev => prev.slice(0, -1));
      } else {
        setPinInput(prev => prev.slice(0, -1));
      }
      return;
    }

    if (digit === 'C') {
      if (isConfirmingStep) {
        setConfirmPinInput('');
      } else {
        setPinInput('');
      }
      return;
    }

    if (!hasPin) {
      // Flow Pembuatan PIN Baru
      if (!isConfirmingStep) {
        if (pinInput.length < 4) {
          const next = pinInput + digit;
          setPinInput(next);
          if (next.length === 4) {
            // Lanjut ke langkah konfirmasi PIN
            setTimeout(() => {
              setIsConfirmingStep(true);
            }, 200);
          }
        }
      } else {
        if (confirmPinInput.length < 4) {
          const nextConfirm = confirmPinInput + digit;
          setConfirmPinInput(nextConfirm);
          if (nextConfirm.length === 4) {
            if (nextConfirm === pinInput) {
              // PIN Berhasil Dibuat
              localStorage.setItem('diduitin_user_pin', nextConfirm);
              confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
              onUnlock();
            } else {
              triggerError('PIN konfirmasi tidak sama. Ulangi!');
              setConfirmPinInput('');
            }
          }
        }
      }
    } else {
      // Flow Buka Kunci PIN
      if (pinInput.length < 4) {
        const next = pinInput + digit;
        setPinInput(next);
        if (next.length === 4) {
          const savedPin = localStorage.getItem('diduitin_user_pin');
          if (next === savedPin) {
            onUnlock();
          } else {
            triggerError('PIN salah! Coba lagi.');
            setPinInput('');
          }
        }
      }
    }
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Keyboard listener untuk kenyamanan desktop
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumpad(e.key);
      } else if (e.key === 'Backspace') {
        handleNumpad('DEL');
      } else if (e.key === 'c' || e.key === 'C') {
        handleNumpad('C');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const activeValue = isConfirmingStep ? confirmPinInput : pinInput;

  return (
    <div className="fixed inset-0 z-80 bg-[#A3E635] sm:py-6 flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Mobile Device Frame Shell */}
      <div className="w-full max-w-[440px] min-h-screen sm:min-h-[860px] sm:max-h-[92vh] bg-[#A3E635] sm:border-3 sm:border-[#121214] sm:rounded-3xl sm:shadow-[8px_8px_0px_#121214] flex flex-col justify-between items-center p-6 relative overflow-y-auto">
        
        {/* Header Logo diduitin */}
        <div className="pt-2 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white border-2 border-[#121214] flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#121214] text-[#121214]">
            d.
          </div>
          <span className="font-black text-xl text-[#121214] tracking-tight">diduitin</span>
        </div>

        {/* Card PIN Form */}
        <div className={`w-full max-w-[320px] bg-white border-3 border-[#121214] rounded-3xl shadow-[6px_6px_0px_#121214] p-6 space-y-4 text-center my-auto ${shake ? 'animate-bounce' : ''}`}>
          
          {/* Header Icon */}
          <div className="w-14 h-14 mx-auto rounded-2xl border-3 border-[#121214] bg-[#FEF08A] shadow-[3px_3px_0px_#121214] flex items-center justify-center">
            {hasPin ? (
              <Lock className="w-7 h-7 text-[#121214] stroke-[2.5]" />
            ) : (
              <KeyRound className="w-7 h-7 text-[#121214] stroke-[2.5]" />
            )}
          </div>

          {/* Title & Step Info */}
          <div className="space-y-1">
            <span className="brutal-badge text-[9px] bg-[#DDD6FE]">
              {hasPin ? 'KEAMANAN DIDUITIN' : 'SETUP PERTAMA'}
            </span>
            <h2 className="text-base font-black text-[#121214] tracking-tight">
              {!hasPin
                ? isConfirmingStep
                  ? 'Konfirmasi PIN 4 Digit'
                  : 'Buat PIN Keamanan Anda'
                : 'Masukkan PIN Masuk'}
            </h2>
            <p className="text-[11px] font-bold text-neutral-500 leading-tight">
              {!hasPin
                ? isConfirmingStep
                  ? 'Ketik ulang 4 digit PIN yang baru saja Anda buat'
                  : 'PIN ini akan mengunci catatan keuangan Anda di perangkat ini'
                : 'Jaga privasi catatan uangmu dari tangan kepo'}
            </p>
          </div>

          {/* 4 Digit Dots Indicator */}
          <div className="flex justify-center gap-3 py-1">
            {[0, 1, 2, 3].map(i => {
              const isFilled = i < activeValue.length;
              return (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 border-[#121214] transition-all duration-200 ${
                    isFilled ? 'bg-[#121214] scale-110 shadow-[1px_1px_0px_#A3E635]' : 'bg-neutral-100'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Notification Text */}
          {errorMessage ? (
            <div className="p-1.5 bg-rose-100 border border-rose-300 rounded-lg text-[10px] font-black text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {/* Numpad Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => handleNumpad(val)}
                className={`py-3 rounded-xl border-2 border-[#121214] font-black text-sm shadow-[2px_2px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                  val === 'C'
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    : val === 'DEL'
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center justify-center'
                    : 'bg-white hover:bg-neutral-100 text-[#121214]'
                }`}
              >
                {val === 'DEL' ? <Delete className="w-4 h-4" /> : val}
              </button>
            ))}
          </div>

          {!hasPin && isConfirmingStep && (
            <button
              type="button"
              onClick={() => {
                setIsConfirmingStep(false);
                setPinInput('');
                setConfirmPinInput('');
              }}
              className="text-[10px] font-black text-neutral-400 hover:text-black underline cursor-pointer"
            >
              ← Ulangi Buat PIN dari Awal
            </button>
          )}

        </div>

        {/* Footer Credit */}
        <div className="pb-2 text-center">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#121214] bg-white/90 px-3 py-1 rounded-full border-2 border-[#121214] shadow-[1.5px_1.5px_0px_#121214]">
            made by bieezy : Diduitin : 2026
          </p>
        </div>

      </div>
    </div>
  );
};
