import { Category } from './enums';

export interface ParticipantStat {
  participantId: number;
  name: string;
  paid: number;
  consumed: number;
}

export interface GroupStats {
  totalSpent: number;
  expenseCount: number;
  byCategory: Partial<Record<Category, number>>;
  byParticipant: ParticipantStat[];
}
