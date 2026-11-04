import type { CategoryItem } from '../types';

export const EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: 'ngopi', name: '#ngopi', color: '#FDE047', iconName: 'Coffee', type: 'expense' },
  { id: 'makan', name: '#makan', color: '#BEF264', iconName: 'Utensils', type: 'expense' },
  { id: 'healing', name: '#healing', color: '#DDD6FE', iconName: 'Sparkles', type: 'expense' },
  { id: 'fomo', name: '#fomo', color: '#FECDD3', iconName: 'Zap', type: 'expense' },
  { id: 'kostan', name: '#kostan', color: '#BAE6FD', iconName: 'Home', type: 'expense' },
  { id: 'belanja', name: '#belanja', color: '#FED7AA', iconName: 'ShoppingBag', type: 'expense' },
  { id: 'subs', name: '#subs', color: '#E9D5FF', iconName: 'Tv', type: 'expense' },
  { id: 'bensin', name: '#transport', color: '#CBD5E1', iconName: 'Fuel', type: 'expense' },
  { id: 'darurat', name: '#darurat', color: '#FDA4AF', iconName: 'AlertCircle', type: 'expense' }
];

export const INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'gaji', name: '#gaji', color: '#A3E635', iconName: 'Banknote', type: 'income' },
  { id: 'freelance', name: '#freelance', color: '#38BDF8', iconName: 'Laptop', type: 'income' },
  { id: 'cuan_invest', name: '#cuan', color: '#FACC15', iconName: 'TrendingUp', type: 'income' },
  { id: 'angpao', name: '#angpao', color: '#F43F5E', iconName: 'Gift', type: 'income' }
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
