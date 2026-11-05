import React, { useState } from 'react';
import type { Wallet, WishlistTarget } from '../types';
import { db } from '../db';
import { formatRupiah } from '../constants/categories';
import { X, Sparkles, Plus, Trash2, ExternalLink, Link2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlists: WishlistTarget[];
  wallets: Wallet[];
  onRefresh: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlists,
  wallets,
  onRefresh
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [cemplungModal, setCemplungModal] = useState<WishlistTarget | null>(null);
  const [cemplungAmountStr, setCemplungAmountStr] = useState('');
  const [sourceWalletId, setSourceWalletId] = useState(wallets[0]?.id || '');

  // Sinkronisasi sourceWalletId saat wallets berubah
  React.useEffect(() => {
    if (wallets.length > 0 && !sourceWalletId) {
      setSourceWalletId(wallets[0].id);
    }
  }, [wallets, sourceWalletId]);

  // State ActionModal Reusable
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleCreateWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(targetAmountStr.replace(/\D/g, ''), 10);
    if (!title.trim() || !target) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Data Belum Lengkap',
        message: 'Isi nama impian dan target nominal yang ingin dicapai.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    let formattedUrl = itemUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    await db.wishlists.add({
      id: `wish-${Date.now()}`,
      title: title.trim(),
      targetAmount: target,
      savedAmount: 0,
      itemUrl: formattedUrl || undefined,
      createdAt: Date.now()
    });

    setTitle('');
    setTargetAmountStr('');
    setItemUrl('');
    setIsAdding(false);
    onRefresh();
  };

  const executeDeleteWishlist = async (id: string) => {
    await db.wishlists.delete(id);
    setActionModal(prev => ({ ...prev, isOpen: false }));
    onRefresh();
  };

  const handleDelete = (wish: WishlistTarget) => {
    setActionModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Impian?',
      message: `Hapus target tabungan impian "${wish.title}"?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => executeDeleteWishlist(wish.id),
      onCancel: () => setActionModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleCemplungin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cemplungModal) return;
    const addAmt = parseInt(cemplungAmountStr.replace(/\D/g, ''), 10);
    if (!addAmt || addAmt <= 0) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Nominal Kosong',
        message: 'Masukkan nominal tabungan yang ingin dicemplungkan.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    const wallet = await db.wallets.get(sourceWalletId);
    if (!wallet || wallet.balance < addAmt) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Saldo Kurang',
        message: `Saldo ${wallet?.name || 'dompet'} tidak cukup untuk menabung sebesar ${formatRupiah(addAmt)}.`,
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // 1. Kurangi saldo dompet
    await db.wallets.update(sourceWalletId, { balance: wallet.balance - addAmt });

    // 2. Tambah catatan transaksi pengeluaran/saving
    const now = new Date();
    await db.transactions.add({
      id: `tx-wish-${Date.now()}`,
      type: 'expense',
      amount: addAmt,
      walletId: sourceWalletId,
      category: `tabungan: ${cemplungModal.title}`,
      note: `Menabung untuk target: ${cemplungModal.title}`,
      date: now.toISOString().split('T')[0],
      timestamp: Date.now(),
      nature: 'need',
      mood: 'worth'
    });

    // 3. Tambah tabungan wishlist
    const newSaved = cemplungModal.savedAmount + addAmt;
    const isCompleted = newSaved >= cemplungModal.targetAmount;
    await db.wishlists.update(cemplungModal.id, {
      savedAmount: newSaved,
      isCompleted
    });

    if (isCompleted) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    }

    setCemplungModal(null);
    setCemplungAmountStr('');
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#DDD6FE] border-2 border-[#121214] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#121214]">
                Kantong Impian (Wishlist)
              </h2>
              <span className="text-[10px] text-neutral-500 font-bold block">
                Nabung disiplin untuk target spesifik
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

        {/* List Target */}
        <div className="space-y-3 mb-4">
          {wishlists.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-neutral-300 rounded-xl text-center">
              <p className="text-xs font-bold text-neutral-400">Belum ada target impian. Bikin yuk!</p>
            </div>
          ) : (
            wishlists.map(w => {
              const pct = Math.min(Math.round((w.savedAmount / w.targetAmount) * 100), 100);
              const isDone = w.savedAmount >= w.targetAmount;

              return (
                <div
                  key={w.id}
                  className={`p-3 border-2 border-[#121214] rounded-xl space-y-2 shadow-[2px_2px_0px_#121214] ${
                    isDone ? 'bg-emerald-50' : 'bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-black text-[#121214]">{w.title}</h3>
                        {w.itemUrl && (
                          <a
                            href={w.itemUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-[#121214] text-[10px] font-bold text-sky-700 hover:text-sky-900 hover:bg-sky-50 shadow-[1px_1px_0px_#121214] transition-all"
                            title="Buka Link Barang"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Link</span>
                          </a>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-neutral-600 block">
                        {formatRupiah(w.savedAmount)} / {formatRupiah(w.targetAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`brutal-badge text-[9px] ${isDone ? 'bg-[#A3E635]' : 'bg-[#FEF08A]'}`}>
                        {isDone ? 'Tercapai! 🎉' : `${pct}%`}
                      </span>
                      <button
                        onClick={() => handleDelete(w)}
                        className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-neutral-200 border border-[#121214] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isDone ? 'bg-[#A3E635]' : 'bg-[#DDD6FE]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => setCemplungModal(w)}
                      className="brutal-btn w-full py-1.5 bg-[#A3E635] text-[11px] uppercase gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" /> Cemplungin Duit Tabungan
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Cemplung Duit */}
        {cemplungModal && (
          <form onSubmit={handleCemplungin} className="p-3 border-2 border-[#121214] rounded-xl bg-[#FEF08A] mb-4 space-y-2.5 shadow-[2px_2px_0px_#121214]">
            <span className="text-xs font-black uppercase text-[#121214] block">
              Nabung ke: {cemplungModal.title}
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Nominal Tabungan (Rp)"
              value={cemplungAmountStr ? new Intl.NumberFormat('id-ID').format(parseInt(cemplungAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
              onChange={e => setCemplungAmountStr(e.target.value.replace(/\D/g, ''))}
              className="brutal-input w-full text-xs font-black"
            />
            <div>
              <span className="text-[10px] font-bold uppercase text-neutral-600 block mb-1">Ambil dari dompet:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {wallets.length === 0 ? (
                  <span className="text-[11px] font-bold text-neutral-400 italic">
                    Belum ada dompet. Tambah dompet terlebih dahulu.
                  </span>
                ) : (
                  wallets.map(wl => (
                    <button
                      key={wl.id}
                      type="button"
                      onClick={() => setSourceWalletId(wl.id)}
                      className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer ${
                        sourceWalletId === wl.id ? 'bg-[#121214] text-white border-[#121214]' : 'bg-white text-black'
                      }`}
                    >
                      {wl.name} ({formatRupiah(wl.balance)})
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setCemplungModal(null)}
                className="brutal-btn px-3 py-1 bg-white text-xs uppercase cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="brutal-btn px-4 py-1 bg-[#A3E635] text-xs uppercase cursor-pointer"
              >
                Setor Duit
              </button>
            </div>
          </form>
        )}

        {/* Tombol Buat Target Baru */}
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="brutal-btn w-full py-2.5 bg-[#DDD6FE] text-xs uppercase gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Buat Impian Baru
          </button>
        ) : (
          <form onSubmit={handleCreateWishlist} className="p-3 border-2 border-[#121214] rounded-xl bg-[#F9F9FB] space-y-2.5 shadow-[2px_2px_0px_#121214]">
            <span className="text-xs font-black uppercase text-[#121214] block">Target Impian Baru:</span>
            <input
              type="text"
              placeholder="Nama Target (misal: Beli Sepatu / Tiket Konser)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="brutal-input w-full text-xs"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Target Nominal (Rp)"
              value={targetAmountStr ? new Intl.NumberFormat('id-ID').format(parseInt(targetAmountStr.replace(/\D/g, ''), 10) || 0) : ''}
              onChange={e => setTargetAmountStr(e.target.value.replace(/\D/g, ''))}
              className="brutal-input w-full text-xs font-black"
            />
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Link2 className="w-3 h-3 text-neutral-600" />
                <label className="text-[10px] font-black uppercase text-neutral-600">
                  Link Barang / Keinginan (Opsional):
                </label>
              </div>
              <input
                type="url"
                placeholder="https://tokopedia.link/... atau shopee.co.id/..."
                value={itemUrl}
                onChange={e => setItemUrl(e.target.value)}
                className="brutal-input w-full text-xs"
              />
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
                Simpan Target
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
