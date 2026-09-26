import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GroupStats } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {

  private readonly http = inject(HttpClient);

  getStats(groupId: number): Observable<GroupStats> {
    return this.http.get<GroupStats>(`${environment.apiUrl}/groups/${groupId}/stats`);
  }
}
