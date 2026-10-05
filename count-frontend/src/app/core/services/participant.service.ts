import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Participant } from '../models/participant.model';
import { withSilentErrors } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class ParticipantService {

  private readonly http = inject(HttpClient);

  private baseUrl(groupId: number): string {
    return `${environment.apiUrl}/groups/${groupId}/participants`;
  }

  list(groupId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(this.baseUrl(groupId));
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  add(groupId: number, name: string, silent = false): Observable<Participant> {
    return this.http.post<Participant>(this.baseUrl(groupId), { name }, silent ? withSilentErrors() : {});
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  rename(groupId: number, participantId: number, name: string, silent = false): Observable<Participant> {
    return this.http.put<Participant>(`${this.baseUrl(groupId)}/${participantId}`, { name }, silent ? withSilentErrors() : {});
  }

  delete(groupId: number, participantId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(groupId)}/${participantId}`);
  }

  claim(groupId: number, participantId: number): Observable<Participant> {
    return this.http.post<Participant>(`${this.baseUrl(groupId)}/${participantId}/claim`, {});
  }
}
