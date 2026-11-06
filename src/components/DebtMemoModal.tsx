import React, { useState } from 'react';
import type { DebtMemo, Wallet } from '../types';
import { db } from '../db';
import { formatRupiah } from '../constants/categories';
import { X, Plus, Trash2, CheckCircle2, Clock, BookOpen, MessageCircle, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActionModal, type AlertModalState } from './ActionModal';

interface DebtMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  debts: DebtMemo[];
  wallets: Wallet[];
  onRefresh: () => void;
}

export const DebtMemoModal: React.FC<DebtMemoModalProps> = ({
  isOpen,
  onClose,
  debts,
  wallets,
  onRefresh
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // State Dialog Konfirmasi Pelunasan Dompet
  const [settleTargetDebt, setSettleTargetDebt] = useState<DebtMemo | null>(null);
  const [settleWalletId, setSettleWalletId] = useState<string>(wallets[0]?.id || '');

  // Sinkronisasi settleWalletId saat wallets berubah
  React.useEffect(() => {
    if (wallets.length > 0 && !settleWalletId) {
      setSettleWalletId(wallets[0].id);
    }
  }, [wallets, settleWalletId]);

  // Alert/Confirm Modal State
  const [actionModal, setActionModal] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  if (!isOpen) return null;

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(amountStr.replace(/\D/g, ''), 10);
    if (!personName.trim() || !cleanAmount) {
      setActionModal({
        isOpen: true,
        type: 'warning',
        title: 'Data Belum Lengkap',
        message: 'Nama orang dan nominal wajib diisi.',
        confirmText: 'Mengerti',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    await db.debts.add({
      id: `debt-${Date.now()}`,
      personName: personName.trim(),
      type,
      amount: cleanAmount,
      description: description.trim(),
      dueDate: dueDate ? dueDate : undefined,
      isSettled: false,
      createdAt: Date.now()
    });

    setPersonName('');
    setAmountStr('');
    setDescription('');
    setDueDate('');
    setIsAdding(false);
    onRefresh();
  };

  const handleStartToggleSettled = (debt: DebtMemo) => {
    if (debt.isSettled) {
      // Jika dari lunas mau dikembalikan jadi belum lunas
      db.debts.update(debt.id, { isSettled: false }).then(() => onRefresh());
    } else {
      // Mau dilunaskan: tawarkan pilih dompet penampung/sumber dana
      setSettleTargetDebt(debt);
      setSettleWalletId(wallets[0]?.id || '');
    }
  };

  const handleConfirmSettleWithWallet = async (affectWallet: boolean) => {
    if (!settleTargetDebt) return;

    try {
      if (affectWallet && settleWalletId) {
        const wallet = await db.wallets.get(settleWalletId);
        if (wallet) {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];

          if (settleTargetDebt.type === 'lent') {
            // Dia bayar hutangnya ke kita -> Pemasukan (Tambah saldo)
            await db.wallets.update(settleWalletId, {
              balance: wallet.balance + settleTargetDebt.amount
            });
            await db.transactions.add({
              id: `tx-debt-${Date.now()}`,
              type: 'income',
              amount: settleTargetDebt.amount,
              walletId: settleWalletId,
              category: 'pelunasan piutang',
              note: `Pelunasan dari ${settleTargetDebt.personName} (${settleTargetDebt.description || 'Talangan'})`,
              date: todayStr,
              timestamp: Date.now()
            });
          } else {
            // Kita bayar hutang kita ke orang lain -> Pengeluaran (Kurangi saldo)
            if (wallet.balance < settleTargetDebt.amount) {
              setActionModal({
                isOpen: true,
                type: 'warning',
                title: 'Saldo Kurang',
                message: `Saldo ${wallet.name} (${formatRupiah(wallet.balance)}) tidak cukup untuk melunasi ${formatRupiah(settleTargetDebt.amount)}.`,
                confirmText: 'Mengerti',
                onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
              });
              return;
            }
            await db.wallets.update(settleWalletId, {
              balance: wallet.balance - settleTargetDebt.amount
            });
            await db.transactions.add({
              id: `tx-debt-${Date.now()}`,
              type: 'expense',
              amount: settleTargetDebt.amount,
              walletId: settleWalletId,
              category: 'bayar hutang',
              note: `Bayar hutang ke ${settleTargetDebt.personName} (${settleTargetDebt.description || 'Pinjaman'})`,
              date: todayStr,
              timestamp: Date.now(),
              nature: 'need',
              mood: 'neutral'
            });
          }
        }
      }

      await db.debts.update(settleTargetDebt.id, { isSettled: true });
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      setSettleTargetDebt(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      setActionModal({
        isOpen: true,
        type: 'danger',
        title: 'Gagal Pelunasan',
        message: 'Gagal memperbarui status pelunasan transaksi.',
        confirmText: 'Tutup',
        onConfirm: () => setActionModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleRemindWhatsApp = (debt: DebtMemo) => {
    const dueDateNotice = debt.dueDate ? ` sebelum tenggat ${new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(debt.dueDate))}` : '';
    const text = `Halo ${debt.personName}! Mau ngingetin perihal talangan kemarin (${debt.description || 'nongkrong'}) sebesar ${formatRupiah(debt.amount)} yaa${dueDateNotice}. Kalau sempat boleh ditransfer yaa bro/sis, makasih banyak! 🙏`;
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const executeDeleteDebt = async (id: string) => {
    await db.debts.delete(id);
    setActionModal(prev => ({ ...prev, isOpen: false }));
    onRefresh();
  };

  const handleDelete = (debt: DebtMemo) => {
    setActionModal({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Catatan?',
      message: `Hapus catatan hutang/piutang ${debt.personName} (${formatRupiah(debt.amount)})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => executeDeleteDebt(debt.id),
      onCancel: () => setActionModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121214] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FB7185] border-2 border-[#121214] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#121214]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#121214]">
                Catatan Hutang & Piutang
              </h2>
              <span className="text-[10px] text-neutral-500 font-bold block">
                Catat talangan teman biar nggak lupa nagih
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

        {/* List Hutang/Piutang */}
        <div className="space-y-2 mb-4">
          {debts.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-neutral-300 rounded-xl text-center">
              <p className="text-xs font-bold text-neutral-400">Belum ada catatan hutang/piutang. Aman!</p>
            </div>
          ) : (
            debts.map(d => (
              <div
                key={d.id}
                className={`p-3 border-2 border-[#121214] rounded-xl flex items-center justify-between transition-all shadow-[2px_2px_0px_#121214] ${
                  d.isSettled ? 'bg-neutral-100 opacity-60' : d.type === 'lent' ? 'bg-[#FEF08A]' : 'bg-[#FED7AA]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleStartToggleSettled(d)}
                    className="mt-0.5 cursor-pointer text-neutral-700 hover:text-black"
                    title={d.isSettled ? 'Tandai Belum Lunas' : 'Tandai Sudah Lunas'}
                  >
                    {d.isSettled ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Clock className="w-5 h-5 text-neutral-500" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className={`text-xs font-black ${d.isSettled ? 'line-through text-neutral-500' : 'text-[#121214]'}`}>
                        {d.personName}
                      </h3>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border border-[#121214] ${
                        d.type === 'lent' ? 'bg-[#A3E635]' : 'bg-[#FB7185]'
                      }`}>
                        {d.type === 'lent' ? 'Dia Ngutang' : 'Saya Ngutang'}
                      </span>
                      {/* Tombol Tagih WA jika belum lunas & dia yang ngutang */}
                      {!d.isSettled && d.type === 'lent' && (
                        <button
                          type="button"
                          onClick={() => handleRemindWhatsApp(d)}
                          className="px-1.5 py-0.2 rounded bg-[#25D366] hover:bg-[#1ebc59] text-white border border-[#121214] text-[9px] font-black uppercase flex items-center gap-0.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                          title="Kirim pesan tagihan via WhatsApp"
                        >
                          <MessageCircle className="w-2.5 h-2.5" /> Tagih WA
                        </button>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-[10px] text-neutral-600 mt-0.5">{d.description}</p>
                    )}
                    {d.dueDate && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
                        <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="text-neutral-500">Tenggat:</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[9px] font-black ${
                          !d.isSettled && new Date(d.dueDate).getTime() < new Date().setHours(0, 0, 0, 0)
                            ? 'bg-[#FB7185] text-[#121214] border-[#121214]'
                            : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                        }`}>
                          {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d.dueDate))}
                          {!d.isSettled && new Date(d.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) && ' (Lewat Tenggat!)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black whitespace-nowrap ${d.isSettled ? 'text-neutral-400 line-through' : 'text-[#121214]'}`}>
                    {formatRupiah(d.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(d)}
                    className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tombol Buat Catatan Baru */}
        {!isAdding ? (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="brutal-btn w-full py-2.5 bg-[#FB7185] text-xs uppercase gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Tambah Catatan Hutang/Piutang
          </button>
        ) : (
          <form onSubmit={handleAddDebt} className="p-3 border-2 border-[#121214] rounded-xl bg-[#F9F9FB] space-y-2.5 shadow-[2px_2px_0px_#121214]">
            <span className="text-xs font-black uppercase text-[#121214] block">Catatan Baru:</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('lent')}
                className={`py-1.5 text-xs font-black uppercase rounded-lg border-2 ${
                  type === 'lent' ? 'bg-[#A3E635] border-[#121214]' : 'bg-white opacity-60'
                }`}
              >
                Dia Ngutang (Piutang)
              </button>
              <button
                type="button"
                onClick={() => setType('borrowed')}
                className={`py-1.5 text-xs font-black uppercase rounded-lg border-2 ${
                  type === 'borrowed' ? 'bg-[#FB7185] border-[#121214]' : 'bg-white opacity-60'
                }`}
              >
                Saya Ngutang
              </button>
            </div>

            <input
              type="text"
              placeholder="Nama Orang (misal: Rian / Siska)"
              value={personName}
              onChange={e => setPersonName(e.target.value)}
              className="brutal-input w-full text-xs"
            />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Nominal (Rp)"
              value={amountStr ? new Intl.NumberFormat('id-ID').format(parseInt(amountStr.replace(/\D/g, ''), 10) || 0) : ''}
              onChange={e => setAmountStr(e.target.value.replace(/\D/g, ''))}
              className="brutal-input w-full text-xs font-black"
            />

            <input
              type="text"
              placeholder="Keperluan (misal: Talangan kopi / bensin)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="brutal-input w-full text-xs"
            />

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-600 block mb-1">
                Tenggat Bayar (Opsional):
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="brutal-input w-full text-xs font-bold"
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
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* Modal Konfirmasi Pelunasan & Dompet Terkait */}
        {settleTargetDebt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xs bg-white border-3 border-[#121214] rounded-2xl shadow-[6px_6px_0px_#121214] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#121214]">
                <span className="text-xs font-black uppercase text-[#121214]">
                  Konfirmasi Pelunasan
                </span>
                <button
                  type="button"
                  onClick={() => setSettleTargetDebt(null)}
                  className="p-1 rounded text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-neutral-50 border-2 border-[#121214] rounded-xl text-center space-y-0.5">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">
                  {settleTargetDebt.type === 'lent' ? 'Diterima dari:' : 'Dibayarkan ke:'}
                </span>
                <span className="text-sm font-black text-[#121214] block">
                  {settleTargetDebt.personName}
                </span>
                <span className="text-base font-black text-emerald-700 block">
                  {formatRupiah(settleTargetDebt.amount)}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-neutral-600 block mb-1">
                  {settleTargetDebt.type === 'lent' ? 'Masuk ke Dompet:' : 'Potong dari Dompet:'}
                </label>
                {wallets.length === 0 ? (
                  <span className="text-[10px] font-bold text-neutral-400 italic block py-2">
                    Belum ada dompet terdaftar
                  </span>
                ) : (
                  <select
                    value={settleWalletId}
                    onChange={e => setSettleWalletId(e.target.value)}
                    className="brutal-input w-full text-xs font-bold bg-white"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmSettleWithWallet(true)}
                  className="brutal-btn w-full py-2 bg-[#A3E635] text-[#121214] text-xs uppercase cursor-pointer"
                >
                  {settleTargetDebt.type === 'lent' ? (
                    <span className="flex items-center justify-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Lunas & Masuk Saldo
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Lunas & Potong Saldo
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSettleWithWallet(false)}
                  className="brutal-btn w-full py-1.5 bg-neutral-100 text-[#121214] text-[10px] uppercase cursor-pointer"
                >
                  Tandai Lunas Saja (Tanpa Ubah Saldo)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action / Alert Overlay Modal */}
        <ActionModal {...actionModal} />

      </div>
    </div>
  );
};
