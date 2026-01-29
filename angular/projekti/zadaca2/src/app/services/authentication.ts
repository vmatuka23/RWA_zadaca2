import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { Config } from './config';
import { User, LoginRequest, RegisterRequest, LoginResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class Authentication {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUser = signal<User | null>(null);

  constructor(
    private http: HttpClient,
    private config: Config
  ) { }

  async initialize(): Promise<void> {
    await this.fetchCurrentUser().toPromise();
  }

  fetchCurrentUser(): Observable<User | null> {
    return this.http.get<User>(`${this.config.apiBaseUrl}/api/korisnik`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.currentUser.set(user);
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.config.apiBaseUrl}/api/login`, credentials).pipe(
      tap(response => {
        if (response.korisnik) {
          this.currentUserSubject.next(response.korisnik);
          this.currentUser.set(response.korisnik);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.config.apiBaseUrl}/api/register`, data);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.config.apiBaseUrl}/api/logout`, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.currentUser.set(null);
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.uloga);
  }
}
