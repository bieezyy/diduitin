import React, { useState } from 'react';
import type { Wallet } from '../types';
import {
  SUPPORTED_FINANCIAL_PROVIDERS
} from '../services/bankSyncService';
import {
  X,
  ExternalLink,
  Zap,
  ShieldCheck,
  Building2,
  Wallet as WalletIcon
} from 'lucide-react';

interface BankSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onRefresh: () => void;
}

export const BankSyncModal: React.FC<BankSyncModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'schema'>('providers');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'ewallet'>('all');

  if (!isOpen) return null;

  const filteredProviders = SUPPORTED_FINANCIAL_PROVIDERS.filter(p => {
    if (filterType === 'all') return true;
    return p.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#A3E635] border-2 border-[#121214] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#121214] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#121214] flex items-center gap-1.5">
                <span>Auto-Sync Bank & E-Wallet</span>
              </h2>
              <span className="text-[10px] text-neutral-500 font-bold block">
                Integrasi m-Banking & Dompet Digital Indonesia
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

        {/* Tab Navigation (Bank & E-Wallet vs Skema Kerja) */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-100 border-2 border-[#121214] rounded-xl mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={`py-1.5 text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'providers' ? 'bg-[#121214] text-white shadow-[2px_2px_0px_#A3E635]' : 'text-neutral-600 hover:text-black'
            }`}
          >
            Bank & E-Wallet ({SUPPORTED_FINANCIAL_PROVIDERS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-1.5 text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer ${
              activeTab === 'schema' ? 'bg-[#121214] text-white shadow-[2px_2px_0px_#A3E635]' : 'text-neutral-600 hover:text-black'
            }`}
          >
            Skema Kerja
          </button>
        </div>

        {/* Tab 1: Bank & E-Wallet */}
        {activeTab === 'providers' && (
          <div className="space-y-3">
            {/* Banner Privasi 100% Aman & Lokal */}
            <div className="p-3 bg-[#FEF08A] border-2 border-[#121214] rounded-xl space-y-1 shadow-[2px_2px_0px_#121214]">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#121214] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
                <span>Privasi 100% Aman & Lokal</span>
              </span>
              <p className="text-[11px] text-neutral-800 font-bold leading-relaxed">
                diduitin tidak meminta PIN atau password bank. Integrasi bekerja via deteksi notifikasi mutasi lokal di HP Anda.
              </p>
            </div>

            {/* Filter Pill: Semua, Bank, E-Wallet */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md border border-[#121214] cursor-pointer transition-all ${
                  filterType === 'all' ? 'bg-[#121214] text-white shadow-[1.5px_1.5px_0px_#A3E635]' : 'bg-white text-neutral-700'
                }`}
              >
                Semua ({SUPPORTED_FINANCIAL_PROVIDERS.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('bank')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md border border-[#121214] flex items-center gap-1 cursor-pointer transition-all ${
                  filterType === 'bank' ? 'bg-[#121214] text-white shadow-[1.5px_1.5px_0px_#A3E635]' : 'bg-white text-neutral-700'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Bank ({SUPPORTED_FINANCIAL_PROVIDERS.filter(p => p.type === 'bank').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('ewallet')}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md border border-[#121214] flex items-center gap-1 cursor-pointer transition-all ${
                  filterType === 'ewallet' ? 'bg-[#121214] text-white shadow-[1.5px_1.5px_0px_#A3E635]' : 'bg-white text-neutral-700'
                }`}
              >
                <WalletIcon className="w-3 h-3" />
                <span>E-Wallet ({SUPPORTED_FINANCIAL_PROVIDERS.filter(p => p.type === 'ewallet').length})</span>
              </button>
            </div>

            {/* Grid Kartu Bank & E-Wallet */}
            <div className="grid grid-cols-2 gap-2">
              {filteredProviders.map(p => (
                <div
                  key={p.id}
                  className="p-2.5 border-2 border-[#121214] rounded-xl bg-white shadow-[2px_2px_0px_#121214] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-[#121214] truncate pr-1">{p.shortName}</span>
                      <span className="w-2.5 h-2.5 rounded-full border border-[#121214] shrink-0" style={{ backgroundColor: p.color }} />
                    </div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase block mb-2">
                      {p.type === 'bank' ? 'Bank / m-Banking' : 'Dompet Digital'}
                    </span>
                  </div>
                  {p.webUrl && (
                    <a
                      href={p.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-700 hover:text-black underline pt-1 border-t border-neutral-100"
                    >
                      <span>Buka Aplikasi</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Skema & Alur Kerja Teknis */}
        {activeTab === 'schema' && (
          <div className="space-y-3 text-xs leading-relaxed font-bold text-neutral-700">
            <div className="p-3 bg-[#DDD6FE] border-2 border-[#121214] rounded-xl text-[#121214] shadow-[2px_2px_0px_#121214]">
              <span className="font-black text-xs uppercase block mb-1">
                Alur Integrasi Otomatis (Android Native)
              </span>
              <p className="text-[11px] leading-relaxed">
                Di Android, Capacitor menghubungkan listener sistem notifikasi ke aplikasi diduitin secara lokal tanpa memerlukan izin internet atau server pihak ketiga.
              </p>
            </div>

            <ol className="space-y-2 list-decimal list-inside pl-1 text-[11px]">
              <li>
                <strong>Notifikasi Masuk:</strong> HP Anda menerima notifikasi mutasi dari BCA, Livin, BRImo, BNI, BJB, BSI, CIMB Niaga, SeaBank, Bank Jago, Jenius, GoPay, OVO, DANA, dll.
              </li>
              <li>
                <strong>Filter Cerdas:</strong> Algoritma RegExp mem-parsing nominal rupiah, nama penerima/merchant, dan jenis transaksi (uang masuk/keluar).
              </li>
              <li>
                <strong>Pencatatan Otomatis:</strong> Transaksi langsung tercatat ke dalam database lokal Dexie DB dan memotong/menambah saldo dompet terkait.
              </li>
              <li>
                <strong>Privasi Terjamin:</strong> Data finansial tidak dikirim ke server luar, 100% tersimpan aman di HP Anda.
              </li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
};
