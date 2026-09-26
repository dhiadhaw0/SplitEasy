export interface Participant {
  id: number;
  name: string;
  userId: number | null;
  linked: boolean;
}

export interface ParticipantRequest {
  name: string;
}
