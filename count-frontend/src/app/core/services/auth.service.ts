import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';

interface JwtPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly baseUrl = `${environment.apiUrl}/auth`;

  /** Current user, or null when logged out. Initialized from storage, honoring JWT expiration. */
  readonly currentUser = signal<User | null>(this.restoreUserFromStorage());

  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(response => this.applySession(response))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(response => this.applySession(response))
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  private applySession(response: AuthResponse): void {
    this.tokenStorage.saveToken(response.token);
    this.tokenStorage.saveUser(response.user);
    this.currentUser.set(response.user);
  }

  private restoreUserFromStorage(): User | null {
    const token = this.tokenStorage.getToken();
    const user = this.tokenStorage.getUser();
    if (!token || !user || this.isTokenExpired(token)) {
      this.tokenStorage.clear();
      return null;
    }
    return user;
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return true;
    }
    return payload.exp * 1000 <= Date.now();
  }

  private decodeJwtPayload(token: string): JwtPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map(char => '%' + char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}
