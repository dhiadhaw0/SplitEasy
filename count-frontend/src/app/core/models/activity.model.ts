export type ActivityType =
  | 'EXPENSE_CREATED'
  | 'EXPENSE_UPDATED'
  | 'EXPENSE_DELETED'
  | 'SETTLEMENT_RECORDED'
  | 'BUDGET_EXCEEDED'
  | 'SAVINGS_GOAL_ACHIEVED'
  | 'PARTICIPANT_JOINED';

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  EXPENSE_CREATED: 'receipt_long',
  EXPENSE_UPDATED: 'edit',
  EXPENSE_DELETED: 'delete',
  SETTLEMENT_RECORDED: 'check_circle',
  BUDGET_EXCEEDED: 'warning',
  SAVINGS_GOAL_ACHIEVED: 'savings',
  PARTICIPANT_JOINED: 'person_add'
};

export interface Activity {
  id: number;
  type: ActivityType;
  /** Precomputed, human-readable, already includes the actor's name. */
  message: string;
  actorId: number;
  actorName: string;
  createdAt: string;
}
