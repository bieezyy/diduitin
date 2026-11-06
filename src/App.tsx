import { useEffect, useState, lazy, Suspense } from 'react';
import { db, seedInitialDataIfNeeded } from './db';
import type { Wallet, Transaction, WishlistTarget, DebtMemo, Subscription } from './types';
import { RealitiCheck } from './components/RealitiCheck';
import { TransactionList } from './components/TransactionList';
import { QuickEntryModal } from './components/QuickEntryModal';
import { WalletsModal } from './components/WalletsModal';
import { LottieLoader } from './components/LottieLoader';
import { ActionModal, type AlertModalState } from './components/ActionModal';
import { Plus, Settings, Wallet as WalletIcon, User, Zap } from 'lucide-react';

// Lazy loading modal-modal sekunder untuk memangkas initial bundle
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const WishlistModal = lazy(() => import('./components/WishlistModal').then(m => ({ default: m.WishlistModal })));
const SplitBillModal = lazy(() => import('./components/SplitBillModal').then(m => ({ default: m.SplitBillModal })));
const DebtMemoModal = lazy(() => import('./components/DebtMemoModal').then(m => ({ default: m.DebtMemoModal })));
const SubscriptionModal = lazy(() => import('./components/SubscriptionModal').then(m => ({ default: m.SubscriptionModal })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const WrappedCardModal = lazy(() => import('./components/WrappedCardModal').then(m => ({ default: m.WrappedCardModal })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const PinLockModal = lazy(() => import('./components/PinLockModal').then(m => ({ default: m.PinLockModal })));
const BankSyncModal = lazy(() => import('./components/BankSyncModal').then(m => ({ default: m.BankSyncModal })));

export function App() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wishlists, setWishlists] = useState<WishlistTarget[]>([]);
  const [debts, setDebts] = useState<DebtMemo[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [selectedWalletFilterId, setSelectedWalletFilterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isWalletsOpen, setIsWalletsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'budget' | 'settings'>('settings');
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isDebtOpen, setIsDebtOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBankSyncOpen, setIsBankSyncOpen] = useState(false);
  const [isAppUnlocked, setIsAppUnlocked] = useState(false);
  const [appAlert, setAppAlert] = useState<AlertModalState>({
    isOpen: false,
    title: '',
    message: ''
  });

  const loadData = async () => {
    try {
      await seedInitialDataIfNeeded();
      const allWallets = await db.wallets.toArray();
      const allTransactions = await db.transactions.reverse().sortBy('timestamp');
      const allWishlists = await db.wishlists.toArray();
      const allDebts = await db.debts.reverse().sortBy('createdAt');
      const allSubs = await db.subscriptions.toArray();

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const budgetRecord = await db.budgets.get(`b-${currentMonth}`);

      setWallets(allWallets);
      setTransactions(allTransactions);
      setWishlists(allWishlists);
      setDebts(allDebts);
      setSubscriptions(allSubs);
      if (budgetRecord) {
        setMonthlyBudget(budgetRecord.monthlyLimit);
      }

      // Inisialisasi tema dark / light
      const savedTheme = localStorage.getItem('diduitin_theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // First-time user onboarding detection
      const hasSeen = localStorage.getItem('diduitin_has_seen_onboarding');
      if (!hasSeen) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Gagal membaca data Dexie:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem('diduitin_has_seen_onboarding', 'true');
    setIsOnboardingOpen(false);
  };

  const handleTriggerQuickEntry = () => {
    if (wallets.length === 0) {
      setAppAlert({
        isOpen: true,
        type: 'warning',
        title: 'Belum Ada Dompet',
        message: 'Kamu belum memiliki dompet atau rekening. Buat dompet pertama dulu ya sebelum mencatat transaksi!',
        confirmText: '+ Buat Dompet Sekarang',
        cancelText: 'Nanti Dulu',
        onConfirm: () => {
          setAppAlert(prev => ({ ...prev, isOpen: false }));
          setIsWalletsOpen(true);
        },
        onCancel: () => setAppAlert(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setEditingTransaction(null);
    setIsQuickEntryOpen(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Global Keyboard Shortcuts (Desktop / Electron Power Users)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jangan tangkap shortcut jika user sedang mengetik di input atau textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Escape') {
        setIsQuickEntryOpen(false);
        setIsWalletsOpen(false);
        setIsSettingsOpen(false);
        setIsWishlistOpen(false);
        setIsSplitBillOpen(false);
        setIsDebtOpen(false);
        setIsSubscriptionOpen(false);
        setIsWrappedOpen(false);
        setEditingTransaction(null);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleTriggerQuickEntry();
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setIsWalletsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wallets]);

  // Auto-Lock Timer saat App di-minimize / blur (Nomor 14)
  useEffect(() => {
    let backgroundTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleVisibilityChange = () => {
      const savedPin = localStorage.getItem('diduitin_user_pin');
      if (!savedPin) return; // Jika belum pasang PIN, tidak perlu auto-lock

      if (document.hidden) {
        // Kunci otomatis setelah 1 menit di background
        backgroundTimeout = setTimeout(() => {
          setIsAppUnlocked(false);
        }, 60000);
      } else {
        if (backgroundTimeout) {
          clearTimeout(backgroundTimeout);
          backgroundTimeout = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (backgroundTimeout) clearTimeout(backgroundTimeout);
    };
  }, []);

  // Hitung saldo: Jika filter dompet aktif, tampilkan saldo dompet itu, jika tidak akumulasi total
  const displayBalance = selectedWalletFilterId
    ? wallets.find(w => w.id === selectedWalletFilterId)?.balance || 0
    : wallets.reduce((acc, w) => acc + w.balance, 0);

  // Hitung pengeluaran bulan berjalan
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = transactions.filter(
    tx => tx.type === 'expense' && tx.date.startsWith(currentMonth)
  );

  const monthlyExpense = monthExpenses
    .filter(tx => {
      if (selectedWalletFilterId) {
        return tx.walletId === selectedWalletFilterId;
      }
      return true;
    })
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Perhitungan Khusus Wrapped Modal
  const needAmount = monthExpenses
    .filter(tx => tx.nature === 'need' || (!tx.nature && tx.category !== 'fomo'))
    .reduce((acc, tx) => acc + tx.amount, 0);
  const wantAmount = monthExpenses
    .filter(tx => tx.nature === 'want' || tx.category === 'fomo')
    .reduce((acc, tx) => acc + tx.amount, 0);
  const totalNeedWant = needAmount + wantAmount;
  const needPercent = totalNeedWant > 0 ? Math.round((needAmount / totalNeedWant) * 100) : 50;
  const wantPercent = totalNeedWant > 0 ? 100 - needPercent : 50;
  const regretExpense = monthExpenses
    .filter(tx => tx.mood === 'regret')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const categoryTotals = monthExpenses.reduce((acc, tx) => {
    const cat = tx.category.toLowerCase().trim();
    acc[cat] = (acc[cat] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategoryEntry = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];
  const topCategory = topCategoryEntry ? { name: topCategoryEntry[0], amount: topCategoryEntry[1] } : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F0F3] sm:py-6 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] min-h-[420px] bg-white border-3 border-[#121214] rounded-3xl shadow-[8px_8px_0px_#121214] flex flex-col items-center justify-center">
          <LottieLoader text="Memuat Catatan diduitin..." size={140} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F3] sm:py-6 flex items-center justify-center">
      {/* Mobile-Only Device Frame Shell */}
      <div className="w-full max-w-[440px] min-h-screen sm:min-h-[860px] sm:max-h-[92vh] bg-[#F9F9FB] sm:border-3 sm:border-[#121214] sm:rounded-3xl sm:shadow-[8px_8px_0px_#121214] flex flex-col relative overflow-y-auto overflow-x-hidden">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b-2 border-[#121214] px-4 py-3">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#A3E635] border-2 border-[#121214] flex items-center justify-center font-black text-sm shadow-[1.5px_1.5px_0px_#121214]">
                d.
              </div>
              <div>
                <span className="font-black text-base text-[#121214] tracking-tight">diduitin</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBankSyncOpen(true)}
                className="p-2 border-2 border-[#121214] rounded-lg hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer bg-[#A3E635]"
                title="Auto-Sync Bank & E-Wallet"
              >
                <Zap className="w-4 h-4 text-[#121214] stroke-[2.5]" />
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-2 border-2 border-[#121214] rounded-lg hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer bg-sky-100"
                title="Profil"
              >
                <User className="w-4 h-4 text-[#121214]" />
              </button>
              <button
                onClick={() => setIsWalletsOpen(true)}
                className="p-2 border-2 border-[#121214] rounded-lg hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Dompet"
              >
                <WalletIcon className="w-4 h-4 text-[#121214]" />
              </button>
              <button
                onClick={() => {
                  setSettingsMode('settings');
                  setIsSettingsOpen(true);
                }}
                className="p-2 border-2 border-[#121214] rounded-lg hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                title="Pengaturan"
              >
                <Settings className="w-4 h-4 text-[#121214]" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="w-full p-4 flex-1 pb-24">
          {/* Realiti Check Hero Section */}
          <RealitiCheck
            totalBalance={displayBalance}
            monthlyExpense={monthlyExpense}
            monthlyBudget={monthlyBudget}
            wallets={wallets}
            transactions={transactions}
            debts={debts}
            selectedWalletFilterId={selectedWalletFilterId}
            onSelectWalletFilter={setSelectedWalletFilterId}
            onOpenQuickEntry={handleTriggerQuickEntry}
            onOpenWalletsModal={() => setIsWalletsOpen(true)}
            onSetBudgetModal={() => {
              setSettingsMode('budget');
              setIsSettingsOpen(true);
            }}
            onOpenWishlistModal={() => setIsWishlistOpen(true)}
            onOpenDebtModal={() => setIsDebtOpen(true)}
            onOpenSubscriptionModal={() => setIsSubscriptionOpen(true)}
            onOpenWrappedModal={() => setIsWrappedOpen(true)}
          />

          {/* Transaction History Section */}
          <TransactionList
            transactions={transactions}
            wallets={wallets}
            selectedWalletFilterId={selectedWalletFilterId}
            onRefresh={loadData}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsQuickEntryOpen(true);
            }}
          />
        </main>

        {/* Bottom Sticky Action Button for Mobile */}
        <div className="sticky bottom-4 left-0 right-0 px-4 w-full z-20 pointer-events-none mt-auto">
          <button
            onClick={handleTriggerQuickEntry}
            className="brutal-btn w-full py-3.5 bg-[#A3E635] text-[#121214] text-xs font-black uppercase tracking-wide gap-2 pointer-events-auto shadow-[4px_4px_0px_#121214] cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            Catat Transaksi Cepat
          </button>
        </div>
      </div>

      {/* Modals */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => {
          setIsQuickEntryOpen(false);
          setEditingTransaction(null);
        }}
        wallets={wallets}
        onSuccess={loadData}
        editTransaction={editingTransaction}
        activeFilterWalletId={selectedWalletFilterId}
      />

      <WalletsModal
        isOpen={isWalletsOpen}
        onClose={() => setIsWalletsOpen(false)}
        wallets={wallets}
        selectedWalletFilterId={selectedWalletFilterId}
        onSelectWalletFilter={setSelectedWalletFilterId}
        onRefresh={loadData}
        onOpenBankSync={() => setIsBankSyncOpen(true)}
      />

      <Suspense fallback={null}>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            currentBudget={monthlyBudget}
            totalBalance={displayBalance}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onRefresh={loadData}
            mode={settingsMode}
          />
        )}

        {isWishlistOpen && (
          <WishlistModal
            isOpen={isWishlistOpen}
            onClose={() => setIsWishlistOpen(false)}
            wishlists={wishlists}
            wallets={wallets}
            onRefresh={loadData}
          />
        )}

        {isSplitBillOpen && (
          <SplitBillModal
            isOpen={isSplitBillOpen}
            onClose={() => setIsSplitBillOpen(false)}
            onRefresh={loadData}
          />
        )}

        {isDebtOpen && (
          <DebtMemoModal
            isOpen={isDebtOpen}
            onClose={() => setIsDebtOpen(false)}
            debts={debts}
            wallets={wallets}
            onRefresh={loadData}
          />
        )}

        {isSubscriptionOpen && (
          <SubscriptionModal
            isOpen={isSubscriptionOpen}
            onClose={() => setIsSubscriptionOpen(false)}
            subscriptions={subscriptions}
            wallets={wallets}
            onRefresh={loadData}
          />
        )}

        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={handleCloseOnboarding}
          />
        )}

        {isProfileOpen && (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}

        {isBankSyncOpen && (
          <BankSyncModal
            isOpen={isBankSyncOpen}
            onClose={() => setIsBankSyncOpen(false)}
            wallets={wallets}
            onRefresh={loadData}
            onNavigateToWallets={() => {
              setIsBankSyncOpen(false);
              setIsWalletsOpen(true);
            }}
          />
        )}

        {isWrappedOpen && (
          <WrappedCardModal
            isOpen={isWrappedOpen}
            onClose={() => setIsWrappedOpen(false)}
            monthlyExpense={monthlyExpense}
            monthlyBudget={monthlyBudget}
            needPercent={needPercent}
            wantPercent={wantPercent}
            regretExpense={regretExpense}
            topCategory={topCategory}
          />
        )}

        {!isAppUnlocked && (
          <PinLockModal onUnlock={() => setIsAppUnlocked(true)} />
        )}
      </Suspense>

      {/* App Level Action / Alert Overlay Modal */}
      <ActionModal {...appAlert} />
    </div>
  );
}

export default App;
