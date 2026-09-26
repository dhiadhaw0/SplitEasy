import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Balance, Settlement, SettlementRequest } from '../models/balance.model';
import { Expense } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class BalanceService {

  private readonly http = inject(HttpClient);

  private baseUrl(groupId: number): string {
    return `${environment.apiUrl}/groups/${groupId}`;
  }

  getBalances(groupId: number): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${this.baseUrl(groupId)}/balances`);
  }

  getSettlements(groupId: number): Observable<Settlement[]> {
    return this.http.get<Settlement[]>(`${this.baseUrl(groupId)}/settlements`);
  }

  recordSettlement(groupId: number, request: SettlementRequest): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl(groupId)}/settlements`, request);
  }
}
