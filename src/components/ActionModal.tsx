import React from 'react';
import { AlertCircle, Check, HelpCircle, Info } from 'lucide-react';

export interface AlertModalState {
  isOpen: boolean;
  type?: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const ActionModal: React.FC<AlertModalState> = ({
  isOpen,
  type = 'warning',
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const isConfirmDialog = Boolean(onCancel);

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-rose-600" />;
      case 'success':
        return <Check className="w-6 h-6 text-emerald-600 stroke-[3]" />;
      case 'info':
        return <Info className="w-6 h-6 text-sky-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-amber-500" />;
    }
  };

  const getBadgeBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-100 border-rose-300';
      case 'success':
        return 'bg-emerald-100 border-emerald-300';
      case 'info':
        return 'bg-sky-100 border-sky-300';
      default:
        return 'bg-amber-100 border-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-white border-3 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 space-y-4 text-center">
        {/* Icon & Title */}
        <div className="space-y-2">
          <div className={`w-12 h-12 rounded-2xl border-2 border-[#121214] ${getBadgeBg()} shadow-[2px_2px_0px_#121214] mx-auto flex items-center justify-center`}>
            {getIcon()}
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[#121214]">
            {title}
          </h3>
          <p className="text-xs font-bold text-neutral-600 leading-relaxed px-1">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className={`grid gap-2 pt-1 ${isConfirmDialog ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {isConfirmDialog && (
            <button
              type="button"
              onClick={onCancel}
              className="brutal-btn py-2.5 bg-white text-xs font-black uppercase cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`brutal-btn py-2.5 text-xs font-black uppercase cursor-pointer shadow-[2px_2px_0px_#121214] ${
              type === 'danger'
                ? 'bg-[#FB7185] text-white hover:bg-rose-600'
                : 'bg-[#A3E635] text-[#121214] hover:bg-[#86efac]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
