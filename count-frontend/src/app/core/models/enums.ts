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

export type SplitType = 'EQUAL' | 'AMOUNTS' | 'SHARES' | 'PERCENTAGES';

export const SPLIT_TYPE_LABELS: Record<SplitType, string> = {
  EQUAL: 'Égal',
  AMOUNTS: 'Montants',
  SHARES: 'Parts',
  PERCENTAGES: '%'
};

export type ExpenseType = 'EXPENSE' | 'TRANSFER';

export type Currency = 'EUR' | 'USD' | 'TND' | 'GBP' | 'MAD' | 'CHF';

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'TND', 'GBP', 'MAD', 'CHF'];
