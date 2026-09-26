import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ExpenseListFilters, ExpenseRequest } from '../models/expense.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {

  private readonly http = inject(HttpClient);

  private baseUrl(groupId: number): string {
    return `${environment.apiUrl}/groups/${groupId}/expenses`;
  }

  list(groupId: number, filters: ExpenseListFilters = {}): Observable<Page<Expense>> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 20));
    if (filters.category) {
      params = params.set('category', filters.category);
    }
    if (filters.participantId != null) {
      params = params.set('participantId', String(filters.participantId));
    }
    return this.http.get<Page<Expense>>(this.baseUrl(groupId), { params });
  }

  get(groupId: number, expenseId: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.baseUrl(groupId)}/${expenseId}`);
  }

  create(groupId: number, request: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(this.baseUrl(groupId), request);
  }

  update(groupId: number, expenseId: number, request: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl(groupId)}/${expenseId}`, request);
  }

  delete(groupId: number, expenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(groupId)}/${expenseId}`);
  }
}
