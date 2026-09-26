import { Category, ExpenseType, SplitType } from './enums';
import { Participant } from './participant.model';

export interface Share {
  participantId: number;
  participantName: string;
  value: number | null;
  amount: number;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  date: string;
  category: Category;
  type: ExpenseType;
  splitType: SplitType;
  paidBy: Participant;
  shares: Share[];
  createdAt: string;
}

export interface ShareRequest {
  participantId: number;
  value: number | null;
}

export interface ExpenseRequest {
  title: string;
  amount: number;
  date: string; // format 'YYYY-MM-DD'
  category: Category | null;
  paidById: number;
  splitType: SplitType;
  shares: ShareRequest[];
}

export interface ExpenseListFilters {
  page?: number;
  size?: number;
  category?: Category | null;
  participantId?: number | null;
}
