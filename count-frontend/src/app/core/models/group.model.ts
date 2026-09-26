import { Currency } from './enums';
import { Participant } from './participant.model';

export interface GroupSummary {
  id: number;
  name: string;
  description: string | null;
  currency: Currency;
  participantCount: number;
  totalSpent: number;
  myBalance: number;
  updatedAt: string;
}

export interface GroupDetail {
  id: number;
  name: string;
  description: string | null;
  currency: Currency;
  inviteCode: string;
  createdById: number;
  participants: Participant[];
  myParticipantId: number | null;
  createdAt: string;
}

export interface GroupRequest {
  name: string;
  description: string | null;
  currency: Currency;
}

export interface InvitePreview {
  groupId: number;
  groupName: string;
  unlinkedParticipants: Participant[];
}

export interface JoinGroupRequest {
  inviteCode: string;
  participantId?: number | null;
  newParticipantName?: string | null;
}
