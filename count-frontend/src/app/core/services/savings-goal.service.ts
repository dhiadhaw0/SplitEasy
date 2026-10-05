import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SavingsContributionRequest, SavingsGoal, SavingsGoalRequest } from '../models/savings-goal.model';
import { withSilentErrors } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class SavingsGoalService {

  private readonly http = inject(HttpClient);

  private baseUrl(groupId: number): string {
    return `${environment.apiUrl}/groups/${groupId}/savings-goals`;
  }

  list(groupId: number): Observable<SavingsGoal[]> {
    return this.http.get<SavingsGoal[]>(this.baseUrl(groupId));
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  create(groupId: number, request: SavingsGoalRequest, silent = false): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(this.baseUrl(groupId), request, silent ? withSilentErrors() : {});
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  update(groupId: number, goalId: number, request: SavingsGoalRequest, silent = false): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.baseUrl(groupId)}/${goalId}`, request, silent ? withSilentErrors() : {});
  }

  delete(groupId: number, goalId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(groupId)}/${goalId}`);
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  addContribution(groupId: number, goalId: number, request: SavingsContributionRequest, silent = false): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${this.baseUrl(groupId)}/${goalId}/contributions`, request, silent ? withSilentErrors() : {});
  }

  deleteContribution(groupId: number, goalId: number, contributionId: number): Observable<SavingsGoal> {
    return this.http.delete<SavingsGoal>(`${this.baseUrl(groupId)}/${goalId}/contributions/${contributionId}`);
  }
}
