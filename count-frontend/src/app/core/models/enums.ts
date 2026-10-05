export type Category =
  | 'FOOD'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'ACTIVITIES'
  | 'SHOPPING'
  | 'GROCERIES'
  | 'BILLS'
  | 'OTHER';

export const CATEGORIES: Category[] = [
  'FOOD',
  'TRANSPORT',
  'ACCOMMODATION',
  'ACTIVITIES',
  'SHOPPING',
  'GROCERIES',
  'BILLS',
  'OTHER'
];

export const CATEGORY_LABELS: Record<Category, string> = {
  FOOD: 'Nourriture',
  TRANSPORT: 'Transport',
  ACCOMMODATION: 'Hébergement',
  ACTIVITIES: 'Activités',
  SHOPPING: 'Shopping',
  GROCERIES: 'Courses',
  BILLS: 'Factures',
  OTHER: 'Autre'
};

export const CATEGORY_ICONS: Record<Category, string> = {
  FOOD: 'restaurant',
  TRANSPORT: 'directions_car',
  ACCOMMODATION: 'hotel',
  ACTIVITIES: 'local_activity',
  SHOPPING: 'shopping_bag',
  GROCERIES: 'local_grocery_store',
  BILLS: 'receipt',
  OTHER: 'more_horiz'
};

/** Soft background + matching text color for each category's icon chip (light mode). */
export const CATEGORY_COLORS: Record<Category, { bg: string; fg: string }> = {
  FOOD: { bg: '#fdece3', fg: '#c2410c' },
  TRANSPORT: { bg: '#e0f2fe', fg: '#0369a1' },
  ACCOMMODATION: { bg: '#ede9fe', fg: '#6d28d9' },
  ACTIVITIES: { bg: '#fef9c3', fg: '#a16207' },
  SHOPPING: { bg: '#fce7f3', fg: '#be185d' },
  GROCERIES: { bg: '#dcfce7', fg: '#15803d' },
  BILLS: { bg: '#e2e8f0', fg: '#334155' },
  OTHER: { bg: '#f1f5f9', fg: '#475569' }
};

export type SplitType = 'EQUAL' | 'AMOUNTS' | 'SHARES' | 'PERCENTAGES';

export const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  EQUAL: 'Égal',
  AMOUNTS: 'Montants',
  SHARES: 'Parts',
  PERCENTAGES: '%'
};

export type ExpenseType = 'EXPENSE' | 'TRANSFER';

export type RecurrenceInterval = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const RECURRENCE_INTERVALS: RecurrenceInterval[] = ['WEEKLY', 'MONTHLY', 'YEARLY'];

export const RECURRENCE_INTERVAL_LABELS: Record<RecurrenceInterval, string> = {
  WEEKLY: 'Chaque semaine',
  MONTHLY: 'Chaque mois',
  YEARLY: 'Chaque année'
};

export type Currency = 'EUR' | 'USD' | 'TND' | 'GBP' | 'MAD' | 'CHF';

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'TND', 'GBP', 'MAD', 'CHF'];
