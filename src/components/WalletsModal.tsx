import React, { useState } from 'react';
import type { Wallet } from '../types';
import { db } from '../db';
import { formatRupiah } from '../constants/categories';
import { X, Plus, Trash2, Wallet as WalletIcon, Check, Edit2, ArrowLeftRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface WalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  selectedWalletFilterId?: string | null;
  onSelectWalletFilter: (walletId: string | null) => void;
  onRefresh: () => void;
}

const WALLET_COLORS = ['#38BDF8', '#A3E635', '#FACC15', '#FB7185', '#DDD6FE', '#FDA4AF'];

export const WalletsModal: React.FC<WalletsModalProps> = ({
  isOpen,
  onClose,
  wallets,
  selectedWalletFilterId,
  onSelectWalletFilter,
  onRefresh
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<Wallet['type']>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(WALLET_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  // State Quick Transfer
  const [isTransferring, setIsTransferring] = useState(false);
  const [fromWalletId, setFromWalletId] = useState<string>(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id || wallets[0]?.id || '');
  const [transferAmountStr, setTransferAmountStr] = useState('');

  // Sinkronisasi state transfer saat wallets berubah
  React.useEffect(() => {
    if (wallets.length > 0) {
      if (!fromWalletId) setFromWalletId(wallets[0].id);
      if (!toWalletId && wallets.length > 1) setToWalletId(wallets[1].id);
    }
  }, [wallets, fromWalletId, toWalletId]);

  // Modal Notification / Confirmation State
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Nama Kosong',
        message: 'Nama dompet atau rekening wajib diisi.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    const cleanNum = parseInt(initialBalance.replace(/\D/g, ''), 10) || 0;

    await db.wallets.add({
      id: `w-${Date.now()}`,
      name: name.trim(),
      type,
      balance: cleanNum,
      color,
      createdAt: Date.now()
    });

    setName('');
    setInitialBalance('');
    setIsAdding(false);
    onRefresh();
  };

  const handleStartEdit = (w: Wallet) => {
    setEditingWalletId(w.id);
    setEditName(w.name);
    setEditBalance(w.balance.toString());
  };

  const handleSaveEdit = async (walletId: string) => {
    if (!editName.trim()) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Nama Kosong',
        message: 'Nama dompet tidak boleh kosong.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    const cleanNum = parseInt(editBalance.replace(/\D/g, ''), 10) || 0;

    await db.wallets.update(walletId, {
      name: editName.trim(),
      balance: cleanNum
    });

    setEditingWalletId(null);
    onRefresh();
  };

  const executeDeleteWallet = async (walletId: string) => {
    if (selectedWalletFilterId === walletId) {
      onSelectWalletFilter(null);
    }
    await db.wallets.delete(walletId);
    setActionModal(prev => ({ ...prev, isOpen: false }));
    onRefresh();
  };

  const handleDeleteWallet = (walletId: string, walletName: string) => {
    setActionModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Dompet?',
      message: `Hapus dompet "${walletName}"? Riwayat transaksi lama tetap tersimpan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => executeDeleteWallet(walletId),
      onCancel: () => setActionModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(transferAmountStr.replace(/\D/g, ''), 10) || 0;
    if (cleanAmount <= 0) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Nominal Kosong',
        message: 'Masukkan nominal transfer yang valid.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (fromWalletId === toWalletId) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Dompet Sama',
        message: 'Dompet asal dan tujuan tidak boleh sama.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const fromWallet = await db.wallets.get(fromWalletId);
    const toWallet = await db.wallets.get(toWalletId);

    if (!fromWallet || !toWallet) {
      setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Dompet Tidak Ditemukan',
        message: 'Terjadi kesalahan, dompet tidak ditemukan.',
        confirmText: 'Tutup',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (fromWallet.balance < cleanAmount) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Saldo Kurang',
        message: `Saldo ${fromWallet.name} (${formatRupiah(fromWallet.balance)}) tidak cukup untuk transfer sebesar ${formatRupiah(cleanAmount)}.`,
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // 1. Catat transaksi transfer
    const now = new Date();
    await db.transactions.add({
      id: `tx-tf-${Date.now()}`,
      type: 'transfer',
      amount: cleanAmount,
      walletId: fromWalletId,
      targetWalletId: toWalletId,
      category: 'transfer',
      note: `Pindah saldo dari ${fromWallet.name} ke ${toWallet.name}`,
      date: now.toISOString().split('T')[0],
      timestamp: Date.now()
    });

    // 2. Sesuaikan saldo kedua dompet
    await db.wallets.update(fromWalletId, { balance: fromWallet.balance - cleanAmount });
    await db.wallets.update(toWalletId, { balance: toWallet.balance + cleanAmount });

    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

    setTransferAmountStr('');
    setIsTransferring(false);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214] mb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <WalletIcon className="w-4 h-4" />
              Kelola Dompet & Rekening
            </h2>
            <p className="text-[10px] text-neutral-500 font-bold mt-0.5">
              Pilih, ubah saldo/nama, atau tambah kantong baru
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border-2 border-[#121214] hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List Dompet Saat Ini (Pilih, Edit, Hapus) */}
        <div className="space-y-2 mb-4">
          {wallets.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-neutral-300 rounded-xl text-center bg-white">
              <p className="text-xs font-bold text-neutral-400">Belum ada dompet/rekening. Tambah sekarang!</p>
            </div>
          ) : (
            wallets.map(w => {
              const isEditing = editingWalletId === w.id;
              const isSelectedFilter = selectedWalletFilterId === w.id;

              return (
                <div
                  key={w.id}
                  className={`p-3 border-2 border-[#121214] rounded-xl flex flex-col gap-2 transition-all shadow-[2px_2px_0px_#121214] ${
                    isSelectedFilter ? 'bg-[#FEF08A]' : 'bg-neutral-50'
                  }`}
                >
                  {!isEditing ? (
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2.5 cursor-pointer flex-1"
                        onClick={() => onSelectWalletFilter(isSelectedFilter ? null : w.id)}
                      >
                        <span className="w-4 h-4 rounded-full border border-[#121214] shrink-0" style={{ backgroundColor: w.color }} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-black text-[#121214]">{w.name}</h3>
                            {isSelectedFilter && (
                              <span className="px-1.5 py-0.2 bg-[#121214] text-white text-[9px] font-black uppercase rounded">
                                Terpilih
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-neutral-500">{w.type}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black">{formatRupiah(w.balance)}</span>
                        <button
                          onClick={() => handleStartEdit(w)}
                          className="p-1 text-neutral-500 hover:text-black rounded"
                          title="Edit Dompet"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWallet(w.id, w.name)}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Hapus Dompet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-black uppercase text-neutral-600">Ubah Data Dompet:</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="brutal-input w-full text-xs"
                        placeholder="Nama Dompet"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editBalance ? new Intl.NumberFormat('id-ID').format(parseInt(editBalance.replace(/\D/g, ''), 10) || 0) : ''}
                        onChange={e => setEditBalance(e.target.value.replace(/\D/g, ''))}
                        className="brutal-input w-full text-xs font-bold"
                        placeholder="Saldo Sekarang (Rp)"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingWalletId(null)}
                          className="brutal-btn px-3 py-1 bg-white text-xs uppercase"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveEdit(w.id)}
                          className="brutal-btn px-3 py-1 bg-[#A3E635] text-xs uppercase gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Simpan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Tombol Aksi Tambah Dompet & Pindah Saldo */}
        {!isAdding && !isTransferring && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="brutal-btn py-2.5 bg-[#A3E635] text-xs uppercase gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Dompet
            </button>
            <button
              type="button"
              onClick={() => setIsTransferring(true)}
              disabled={wallets.length < 2}
              className="brutal-btn py-2.5 bg-[#DDD6FE] text-xs uppercase gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Pindah Saldo
            </button>
          </div>
        )}

        {/* Form Quick Transfer Antar Dompet */}
        {isTransferring && (
          <form onSubmit={handleExecuteTransfer} className="p-3 border-2 border-[#121214] rounded-xl bg-[#F9F9FB] space-y-3 shadow-[2px_2px_0px_#121214]">
            <span className="text-xs font-black uppercase block">Transfer Cepat Antar Dompet:</span>

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Dari:</label>
              <select
                value={fromWalletId}
                onChange={e => setFromWalletId(e.target.value)}
                className="brutal-input w-full text-xs font-bold bg-white"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Ke Tujuan:</label>
              <select
                value={toWalletId}
                onChange={e => setToWalletId(e.target.value)}
                className="brutal-input w-full text-xs font-bold bg-white"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Nominal Pindah (Rp)"
              value={transferAmountStr ? new Intl.NumberFormat('id-ID').format(parseInt(transferAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
              onChange={e => setTransferAmountStr(e.target.value.replace(/\D/g, ''))}
              className="brutal-input w-full text-xs font-black"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="brutal-btn flex-1 py-2 bg-[#DDD6FE] text-xs uppercase cursor-pointer"
              >
                Kirim Saldo
              </button>
              <button
                type="button"
                onClick={() => setIsTransferring(false)}
                className="brutal-btn px-3 py-2 bg-white text-xs uppercase cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Form Tambah Dompet */}
        {isAdding && (
          <form onSubmit={handleAddWallet} className="p-3 border-2 border-[#121214] rounded-xl bg-[#F9F9FB] space-y-3">
            <span className="text-xs font-black uppercase block">Dompet Baru:</span>
            
            <input
              type="text"
              placeholder="Nama (e.g. SeaBank, ShopeePay, Kas Kecil)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="brutal-input w-full text-xs"
            />

            <div className="grid grid-cols-3 gap-2">
              {(['bank', 'ewallet', 'cash'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-1.5 text-xs font-bold rounded-lg border-2 uppercase ${
                    type === t ? 'bg-[#FACC15] border-[#121214]' : 'bg-white border-neutral-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Saldo Awal (Rp)"
              value={initialBalance ? new Intl.NumberFormat('id-ID').format(parseInt(initialBalance.replace(/\D/g, ''), 10) || 0) : ''}
              onChange={e => setInitialBalance(e.target.value.replace(/\D/g, ''))}
              className="brutal-input w-full text-xs font-bold"
            />

            {/* Pilihan Warna */}
            <div>
              <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Warna Kartu:</span>
              <div className="flex gap-2">
                {WALLET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 border-[#121214] transition-transform ${
                      color === c ? 'scale-125 shadow-[1px_1px_0px_#121214]' : 'opacity-70'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="brutal-btn flex-1 py-2 bg-[#A3E635] text-xs uppercase"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="brutal-btn px-3 py-2 bg-white text-xs uppercase"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Action / Alert Overlay Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
