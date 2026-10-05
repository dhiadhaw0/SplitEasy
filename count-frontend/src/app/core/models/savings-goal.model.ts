export interface SavingsContribution {
  id: number;
  participantId: number;
  participantName: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  deadline: string | null;
  currentAmount: number;
  /** 0-100+; can exceed 100 if contributions overshoot the target. */
  percentage: number;
  achieved: boolean;
  contributions: SavingsContribution[];
  createdAt: string;
}

export interface SavingsGoalRequest {
  name: string;
  targetAmount: number;
  deadline: string | null;
}

export interface SavingsContributionRequest {
  participantId: number;
  amount: number;
  note: string | null;
}
