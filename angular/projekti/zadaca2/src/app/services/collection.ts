import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from './config';
import { Collection, CollectionResponse, CreateCollectionRequest } from '../models/collection.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  
  constructor(
    private http: HttpClient,
    private config: Config
  ) { }

  getCollections(page: number = 1, all: boolean = false): Observable<CollectionResponse> {
    let params = new HttpParams().set('page', page.toString());
    if (all) {
      params = params.set('all', 'true');
    }
    return this.http.get<CollectionResponse>(`${this.config.apiBaseUrl}/api/kolekcije`, { params });
  }

  getPublicCollections(page: number = 1): Observable<CollectionResponse> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<CollectionResponse>(`${this.config.apiBaseUrl}/api/kolekcije/javne`, { params });
  }

  getCollection(id: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.config.apiBaseUrl}/api/kolekcije/${id}`);
  }

  createCollection(data: CreateCollectionRequest): Observable<Collection> {
    return this.http.post<Collection>(`${this.config.apiBaseUrl}/api/kolekcije`, data);
  }

  updateCollection(id: number, data: Partial<CreateCollectionRequest>): Observable<Collection> {
    return this.http.put<Collection>(`${this.config.apiBaseUrl}/api/kolekcije/${id}`, data);
  }

  deleteCollection(id: number): Observable<any> {
    return this.http.delete(`${this.config.apiBaseUrl}/api/kolekcije/${id}`);
  }
}
