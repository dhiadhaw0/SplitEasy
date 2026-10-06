import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OnboardingStatus } from '../models/onboarding.model';

@Injectable({ providedIn: 'root' })
export class OnboardingService {

  private readonly http = inject(HttpClient);

  getStatus(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingStatus>(`${environment.apiUrl}/users/me/onboarding`);
  }
}
