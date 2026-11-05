import React, { useState, useEffect } from 'react';
import type { Wallet } from '../types';
import { db } from '../db';
import {
  SUPPORTED_FINANCIAL_PROVIDERS,
  type BankSyncRule
} from '../services/bankSyncService';
import { openFinancialApp } from '../services/bankSyncBridge';
import {
  X,
  Zap,
  ShieldCheck,
  Building2,
  Wallet as WalletIcon,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Link,
  Unlink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/haptics';

interface BankSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onRefresh: () => void;
}

export const BankSyncModal: React.FC<BankSyncModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'schema'>('providers');
  const [filterType, setFilterType] = useState<'all' | 'bank' | 'ewallet'>('all');
  const [pairedProviders, setPairedProviders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('diduitin_paired_providers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('diduitin_paired_providers', JSON.stringify(pairedProviders));
  }, [pairedProviders]);

  if (!isOpen) return null;

  // Cek apakah provider sudah terhubung ke database dompet
  const isProviderPaired = (provider: BankSyncRule) => {
    return (
      pairedProviders.includes(provider.id) ||
      wallets.some(w =>
        w.name.toLowerCase().includes(provider.shortName.toLowerCase()) ||
        w.id.toLowerCase().includes(provider.id.toLowerCase())
      )
    );
  };

  // Alur 1: Klik Hubungkan -> Masuk ke kategori Dompet
  const handleConnectProvider = async (provider: BankSyncRule) => {
    triggerHaptic('success');

    // Cek apakah dompet dengan nama ini sudah ada di Dexie
    const existingWallet = wallets.find(w =>
      w.name.toLowerCase().includes(provider.shortName.toLowerCase()) ||
      w.id === `wallet-${provider.id}`
    );

    if (!existingWallet) {
      await db.wallets.add({
        id: `wallet-${provider.id}`,
        name: provider.shortName,
        type: provider.type === 'bank' ? 'bank' : 'ewallet',
        balance: 0,
        color: provider.color,
        createdAt: Date.now()
      });
    }

    setPairedProviders(prev => (prev.includes(provider.id) ? prev : [...prev, provider.id]));
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    onRefresh();
  };

  // Alur 2: Klik Putuskan -> Hapus/lepaskan dari kategori Dompet
  const handleDisconnectProvider = async (provider: BankSyncRule) => {
    triggerHaptic('warning');

    // Hapus dompet yang terkait jika dibuat otomatis
    const targetWallet = wallets.find(w =>
      w.id === `wallet-${provider.id}` ||
      w.name.toLowerCase() === provider.shortName.toLowerCase()
    );

    if (targetWallet) {
      await db.wallets.delete(targetWallet.id);
    }

    setPairedProviders(prev => prev.filter(id => id !== provider.id));
    onRefresh();
  };

  // Alur 3: Klik Buka Aplikasi (Hanya bisa setelah dihubungkan)
  const handleOpenApp = (provider: BankSyncRule) => {
    triggerHaptic('light');
    openFinancialApp(provider);
  };

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
            <div className="w-8 h-8 rounded-lg bg-[#A3E635] border-2 border-[#121214] flex items-center justify-center shadow-[1.5px_1.5px_0px_#121214]">
              <Zap className="w-4 h-4 text-[#121214] stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#121214] flex items-center gap-1.5">
                <span>Auto-Sync Bank & E-Wallet</span>
              </h2>
              <span className="text-[10px] text-neutral-500 font-bold block">
                Pilih akun bank & e-wallet untuk dijadikan dompet
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
                Klik <strong>"Hubungkan"</strong> untuk menambahkan bank/e-wallet ini sebagai dompet Anda. Setelah terhubung, Anda dapat meluncurkan aplikasinya langsung.
              </p>
            </div>

            {/* Filter Pill: Semua, Bank, E-Wallet */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
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
              {filteredProviders.map(p => {
                const isPaired = isProviderPaired(p);

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 border-2 border-[#121214] rounded-xl flex flex-col justify-between shadow-[2px_2px_0px_#121214] transition-all ${
                      isPaired ? 'bg-[#F0FDF4] border-emerald-950' : 'bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-[#121214] truncate pr-1">{p.shortName}</span>
                        <span className="w-2.5 h-2.5 rounded-full border border-[#121214] shrink-0" style={{ backgroundColor: p.color }} />
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase">
                          {p.type === 'bank' ? 'm-Banking' : 'Dompet Digital'}
                        </span>
                        {isPaired && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-800 bg-emerald-100 px-1 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                            <span>Dompet Aktif</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1.5 border-t border-neutral-200">
                      {/* ALUR: Jika BELUM terhubung -> Tampilkan tombol "+ Hubungkan" */}
                      {!isPaired ? (
                        <button
                          type="button"
                          onClick={() => handleConnectProvider(p)}
                          className="brutal-btn w-full py-1.5 bg-[#DDD6FE] hover:bg-[#c4b5fd] text-[#121214] text-[10px] font-black uppercase tracking-wide gap-1 cursor-pointer shadow-[1.5px_1.5px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5"
                        >
                          <Link className="w-3 h-3 stroke-[2.5]" />
                          <span>Hubungkan</span>
                        </button>
                      ) : (
                        /* ALUR: Jika SUDAH terhubung -> Muncul tombol "Buka Aplikasi" & opsi "Putuskan" */
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenApp(p)}
                            className="brutal-btn w-full py-1.5 bg-[#A3E635] text-[#121214] text-[10px] font-black uppercase tracking-wide gap-1 cursor-pointer shadow-[1.5px_1.5px_0px_#121214] active:translate-x-0.5 active:translate-y-0.5"
                            title={`Buka ${p.shortName} di HP`}
                          >
                            <span>Buka Aplikasi</span>
                            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDisconnectProvider(p)}
                            className="w-full py-1 rounded text-[9px] font-bold uppercase text-neutral-400 hover:text-rose-600 hover:underline cursor-pointer transition-colors flex items-center justify-center gap-1"
                          >
                            <Unlink className="w-2.5 h-2.5" />
                            <span>Putuskan Dompet</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Skema & Alur Kerja Teknis */}
        {activeTab === 'schema' && (
          <div className="space-y-3 text-xs leading-relaxed font-bold text-neutral-700">
            <div className="p-3 bg-[#DDD6FE] border-2 border-[#121214] rounded-xl text-[#121214] shadow-[2px_2px_0px_#121214]">
              <span className="font-black text-xs uppercase flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-purple-800" />
                <span>Alur Hubungkan, Buka, & Kategori Dompet</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                Setiap kali Anda menekan <strong>"Hubungkan"</strong>, akun bank atau e-wallet tersebut otomatis dibuatkan kantong di kategori <strong>Dompet</strong> Anda.
              </p>
            </div>

            <ol className="space-y-2 list-decimal list-inside pl-1 text-[11px]">
              <li>
                <strong>Langkah 1 (Hubungkan):</strong> Tekan "Hubungkan", bank/e-wallet otomatis terdaftar ke dalam list Dompet di beranda.
              </li>
              <li>
                <strong>Langkah 2 (Buka Aplikasi):</strong> Setelah terhubung, tombol "Buka Aplikasi" akan aktif dan dapat meluncurkan aplikasi m-Banking/e-Wallet di HP Anda.
              </li>
              <li>
                <strong>Langkah 3 (Putuskan):</strong> Jika tidak lagi digunakan, tekan "Putuskan Dompet" untuk menghapusnya dari daftar dompet beranda Anda.
              </li>
            </ol>
          </div>
        )}

      </div>
    </div>
  );
};
