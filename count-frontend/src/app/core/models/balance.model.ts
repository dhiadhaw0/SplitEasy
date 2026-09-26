export interface Balance {
  participantId: number;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
}

export interface Settlement {
  fromParticipantId: number;
  fromName: string;
  toParticipantId: number;
  toName: string;
  amount: number;
}

export interface SettlementRequest {
  fromParticipantId: number;
  toParticipantId: number;
  amount: number;
  date: string; // format 'YYYY-MM-DD'
}
