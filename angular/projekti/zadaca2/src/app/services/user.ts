import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from './config';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  
  constructor(
    private http: HttpClient,
    private config: Config
  ) { }

  getUsers(page: number = 1): Observable<{ korisnici: User[], ukupno: number, limitPoStranici: number }> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<{ korisnici: User[], ukupno: number, limitPoStranici: number }>(
      `${this.config.apiBaseUrl}/api/korisnici`, { params }
    );
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.config.apiBaseUrl}/api/korisnici/${id}`);
  }

  updateUser(id: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.config.apiBaseUrl}/api/korisnici/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.config.apiBaseUrl}/api/korisnici/id/${id}`);
  }

  activateUser(id: number): Observable<any> {
    return this.http.post(`${this.config.apiBaseUrl}/api/korisnici/${id}/aktiviraj`, {});
  }

  deactivateUser(id: number): Observable<any> {
    return this.http.post(`${this.config.apiBaseUrl}/api/korisnici/${id}/deaktiviraj`, {});
  }

  changeRole(id: number, novaUloga: string): Observable<any> {
    return this.http.put(`${this.config.apiBaseUrl}/api/korisnici/${id}/uloga`, { novaUloga });
  }
}
