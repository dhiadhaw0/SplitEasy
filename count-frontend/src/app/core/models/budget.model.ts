import { Category } from './enums';

export type BudgetPeriod = 'MONTHLY' | 'YEARLY';

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  MONTHLY: 'Mensuel',
  YEARLY: 'Annuel'
};

export interface Budget {
  id: number;
  /** Null means this budget covers every category combined. */
  category: Category | null;
  amountLimit: number;
  period: BudgetPeriod;
  spent: number;
  remaining: number;
  /** 0-100+; can exceed 100 when the budget is blown. */
  percentage: number;
  exceeded: boolean;
  createdAt: string;
}

export interface BudgetRequest {
  category: Category | null;
  amountLimit: number;
  period: BudgetPeriod;
}
