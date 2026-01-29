import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from './config';

@Injectable({
  providedIn: 'root',
})
export class UserCollectionService {
  
  constructor(
    private http: HttpClient,
    private config: Config
  ) { }

  addUserToCollection(kolekcijaId: number, korisnikId: number): Observable<any> {
    return this.http.post(`${this.config.apiBaseUrl}/api/kolekcije/${kolekcijaId}/korisnici`, {
      korisnikId
    });
  }

  removeUserFromCollection(kolekcijaId: number, korisnikId: number): Observable<any> {
    return this.http.delete(`${this.config.apiBaseUrl}/api/kolekcije/${kolekcijaId}/korisnici/${korisnikId}`);
  }

  getUserCollections(korisnikId: number): Observable<any> {
    return this.http.get(`${this.config.apiBaseUrl}/api/korisnici/${korisnikId}/kolekcije`);
  }
}
