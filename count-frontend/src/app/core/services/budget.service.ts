import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Budget, BudgetRequest } from '../models/budget.model';
import { withSilentErrors } from '../interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
export class BudgetService {

  private readonly http = inject(HttpClient);

  private baseUrl(groupId: number): string {
    return `${environment.apiUrl}/groups/${groupId}/budgets`;
  }

  list(groupId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.baseUrl(groupId));
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  create(groupId: number, request: BudgetRequest, silent = false): Observable<Budget> {
    return this.http.post<Budget>(this.baseUrl(groupId), request, silent ? withSilentErrors() : {});
  }

  /** @param silent when true, suppresses the global error snackbar (the caller shows the error itself). */
  update(groupId: number, budgetId: number, request: BudgetRequest, silent = false): Observable<Budget> {
    return this.http.put<Budget>(`${this.baseUrl(groupId)}/${budgetId}`, request, silent ? withSilentErrors() : {});
  }

  delete(groupId: number, budgetId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(groupId)}/${budgetId}`);
  }
}
