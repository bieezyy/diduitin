import React, { useState } from 'react';
import type { Wallet, Subscription } from '../types';
import { db } from '../db';
import { formatRupiah } from '../constants/categories';
import { X, Plus, Trash2, CheckCircle, AlertCircle, RefreshCw, CreditCard, Bell, BellRing } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  wallets: Wallet[];
  onRefresh: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  wallets,
  onRefresh
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [billingDay, setBillingDay] = useState<number>(1);
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id || '');
  const [payingSubId, setPayingSubId] = useState<string | null>(null);

  // Sinkronisasi walletId saat wallets berubah
  React.useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  // State ActionModal Reusable
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  if (!isOpen) return null;

  const totalMonthlySub = subscriptions
    .filter(s => s.isActive)
    .reduce((acc, s) => acc + s.amount, 0);

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(amountStr.replace(/\D/g, ''), 10);
    if (!name.trim() || !cleanAmount) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Data Belum Lengkap',
        message: 'Nama langganan dan nominal wajib diisi.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    await db.subscriptions.add({
      id: `sub-${Date.now()}`,
      name: name.trim(),
      amount: cleanAmount,
      billingDay: Number(billingDay) || 1,
      walletId: walletId || wallets[0]?.id || '',
      isActive: true,
      createdAt: Date.now()
    });

    setName('');
    setAmountStr('');
    setIsAdding(false);
    onRefresh();
  };

  const handleToggleActive = async (sub: Subscription) => {
    await db.subscriptions.update(sub.id, { isActive: !sub.isActive });
    onRefresh();
  };

  const executePayNow = async (sub: Subscription, defaultWallet: Wallet) => {
    setPayingSubId(sub.id);
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      await db.transactions.add({
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'expense',
        amount: sub.amount,
        walletId: defaultWallet.id,
        category: 'langganan',
        note: `Tagihan Rutin ${sub.name}`,
        date: todayStr,
        timestamp: Date.now(),
        nature: 'need',
        mood: 'neutral'
      });

      await db.wallets.update(defaultWallet.id, {
        balance: defaultWallet.balance - sub.amount
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });

      setActionModal(prev => ({ ...prev, isOpen: false }));
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Error',
        message: 'Gagal mencatat pembayaran langganan.',
        confirmText: 'Tutup',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setPayingSubId(null);
    }
  };

  const handlePayNow = (sub: Subscription) => {
    const defaultWallet = wallets.find(w => w.id === sub.walletId) || wallets[0];
    if (!defaultWallet) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Dompet Tidak Ada',
        message: 'Tidak ada dompet yang tersedia. Tambah dompet terlebih dahulu.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setActionModal({
      isOpen: true,
      type: 'info',
      title: 'Bayar Langganan?',
      message: `Catat pembayaran "${sub.name}" sebesar ${formatRupiah(sub.amount)} dan potong dari dompet "${defaultWallet.name}"?`,
      confirmText: 'Ya, Bayar Sekarang',
      cancelText: 'Batal',
      onConfirm: () => executePayNow(sub, defaultWallet),
      onCancel: () => setActionModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const executeDeleteSub = async (id: string) => {
    await db.subscriptions.delete(id);
    setActionModal(prev => ({ ...prev, isOpen: false }));
    onRefresh();
  };

  const handleDelete = (sub: Subscription) => {
    setActionModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Langganan?',
      message: `Hapus langganan rutin "${sub.name}" (${formatRupiah(sub.amount)})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => executeDeleteSub(sub.id),
      onCancel: () => setActionModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const walletMap = new Map(wallets.map(w => [w.id, w]));

  // Logika Reminder H-7, H-3, H-1 jatuh tempo langganan bulan berjalan
  const todayDate = new Date().getDate();
  const getSubReminder = (billingDay: number) => {
    let diffDays = billingDay - todayDate;
    // Jika tanggal tagihan sudah lewat di bulan ini, hitung menuju bulan depan
    if (diffDays < 0) {
      const now = new Date();
      const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      diffDays = (daysInCurrentMonth - todayDate) + billingDay;
    }

    if (diffDays === 0) {
      return { text: 'Hari Ini Tagihan!', color: 'bg-[#FB7185] text-[#121214] border-[#121214]', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'H-1 Jatuh Tempo!', color: 'bg-[#FB7185] text-[#121214] border-[#121214]', urgent: true };
    } else if (diffDays <= 3) {
      return { text: `H-${diffDays} Segera Bayar!`, color: 'bg-[#FDE047] text-[#121214] border-[#121214]', urgent: true };
    } else if (diffDays <= 7) {
      return { text: `H-${diffDays} Jatuh Tempo`, color: 'bg-[#FED7AA] text-[#121214] border-[#121214]', urgent: false };
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#38BDF8] border-2 border-[#121214] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#121214]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#121214]">
                Langganan & Tagihan Rutin
              </h2>
              <span className="text-[10px] text-neutral-500 font-bold block">
                Deteksi kebocoran halus tiap bulan
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

        {/* Ringkasan Total Beban Langganan */}
        <div className="p-3 bg-[#F9F9FB] border-2 border-[#121214] rounded-xl mb-4 shadow-[2px_2px_0px_#121214] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-neutral-500 block">
              Total Beban Rutin Bulanan:
            </span>
            <div className="text-xl font-black text-[#121214]">
              {formatRupiah(totalMonthlySub)}
            </div>
          </div>
          <span className="brutal-badge text-[10px] bg-[#FACC15]">
            {subscriptions.filter(s => s.isActive).length} Aktif
          </span>
        </div>

        {/* Banner Peringatan Jatuh Tempo Mendekat */}
        {subscriptions.some(s => s.isActive && getSubReminder(s.billingDay)?.urgent) && (
          <div className="p-2.5 bg-[#FFF1F2] border-2 border-[#121214] rounded-xl mb-3 flex items-center gap-2 shadow-[2px_2px_0px_#121214]">
            <BellRing className="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
            <p className="text-[11px] font-black text-[#121214] leading-tight">
              Ada tagihan langganan yang mendekati jatuh tempo (H-7 s/d H-1)! Siapkan saldo dompet Anda.
            </p>
          </div>
        )}

        {/* List Subscriptions */}
        <div className="space-y-2 mb-4">
          {subscriptions.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-neutral-300 rounded-xl text-center">
              <p className="text-xs font-bold text-neutral-400">Belum ada langganan terdaftar.</p>
            </div>
          ) : (
            subscriptions.map(sub => {
              const defaultWallet = walletMap.get(sub.walletId);
              const reminder = sub.isActive ? getSubReminder(sub.billingDay) : null;
              return (
                <div
                  key={sub.id}
                  className={`p-3 border-2 border-[#121214] rounded-xl flex items-center justify-between transition-all shadow-[2px_2px_0px_#121214] ${
                    sub.isActive ? 'bg-white' : 'bg-neutral-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(sub)}
                      className="mt-0.5 cursor-pointer text-neutral-700 hover:text-black"
                      title={sub.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {sub.isActive ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-neutral-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`text-xs font-black ${sub.isActive ? 'text-[#121214]' : 'text-neutral-500 line-through'}`}>
                          {sub.name}
                        </h3>
                        {reminder && (
                          <span className={`px-1.5 py-0.2 rounded border text-[9px] font-black uppercase flex items-center gap-0.5 ${reminder.color}`}>
                            {reminder.urgent ? <BellRing className="w-2.5 h-2.5 stroke-[3]" /> : <Bell className="w-2.5 h-2.5" />}
                            {reminder.text}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-neutral-200 text-black">
                          Tgl {sub.billingDay}
                        </span>
                        {defaultWallet && <span>• {defaultWallet.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="text-right">
                      <span className="text-xs font-black whitespace-nowrap block">
                        {formatRupiah(sub.amount)}
                      </span>
                      {sub.isActive && (
                        <button
                          type="button"
                          onClick={() => handlePayNow(sub)}
                          disabled={payingSubId === sub.id}
                          className="mt-0.5 px-2 py-0.5 rounded bg-[#A3E635] hover:bg-[#86efac] border border-[#121214] text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                          title="Bayar & Catat Transaksi Langsung"
                        >
                          <CreditCard className="w-2.5 h-2.5" /> Bayar
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(sub)}
                      className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Form Tambah Langganan */}
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="brutal-btn w-full py-2.5 bg-[#38BDF8] text-xs uppercase gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Tambah Langganan Baru
          </button>
        ) : (
          <form onSubmit={handleAddSub} className="p-3 border-2 border-[#121214] rounded-xl bg-[#F9F9FB] space-y-2.5 shadow-[2px_2px_0px_#121214]">
            <span className="text-xs font-black uppercase text-[#121214] block">Langganan Baru:</span>

            <input
              type="text"
              placeholder="Nama (misal: Spotify, Netflix, iCloud)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="brutal-input w-full text-xs"
            />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Biaya per Bulan (Rp)"
              value={amountStr ? new Intl.NumberFormat('id-ID').format(parseInt(amountStr.replace(/\D/g, ''), 10) || 0) : ''}
              onChange={e => setAmountStr(e.target.value.replace(/\D/g, ''))}
              className="brutal-input w-full text-xs font-black"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-600 block mb-1">
                  Tanggal Tagihan (1-31):
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={billingDay}
                  onChange={e => setBillingDay(parseInt(e.target.value, 10))}
                  className="brutal-input w-full text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-neutral-600 block mb-1">
                  Sumber Dompet:
                </label>
                {wallets.length === 0 ? (
                  <span className="text-[10px] font-bold text-neutral-400 italic block py-2">
                    Belum ada dompet
                  </span>
                ) : (
                  <select
                    value={walletId}
                    onChange={e => setWalletId(e.target.value)}
                    className="brutal-input w-full text-xs font-bold py-2"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="brutal-btn px-3 py-1.5 bg-white text-xs uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="brutal-btn px-4 py-1.5 bg-[#A3E635] text-xs uppercase cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* Reusable Action Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
