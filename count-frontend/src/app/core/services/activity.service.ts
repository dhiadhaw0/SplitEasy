import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity } from '../models/activity.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {

  private readonly http = inject(HttpClient);

  list(groupId: number, page = 0, size = 20): Observable<Page<Activity>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Activity>>(`${environment.apiUrl}/groups/${groupId}/activities`, { params });
  }
}
