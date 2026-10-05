import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExchangeRateHistory } from '../models/exchange-rate.model';
import { Currency } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {

  private readonly http = inject(HttpClient);

  getHistory(from: Currency, to: Currency, days = 30): Observable<ExchangeRateHistory> {
    const params = new HttpParams().set('from', from).set('to', to).set('days', String(days));
    return this.http.get<ExchangeRateHistory>(`${environment.apiUrl}/exchange-rates/history`, { params });
  }
}
