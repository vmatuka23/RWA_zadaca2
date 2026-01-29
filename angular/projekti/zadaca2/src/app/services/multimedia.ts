import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from './config';
import { Multimedia, MultimediaResponse, CreateMultimediaRequest } from '../models/multimedia.model';

@Injectable({
  providedIn: 'root',
})
export class MultimediaService {
  
  constructor(
    private http: HttpClient,
    private config: Config
  ) { }

  getMultimedia(kolekcijaId?: number, page: number = 1): Observable<MultimediaResponse> {
    let params = new HttpParams().set('page', page.toString());
    if (kolekcijaId) {
      params = params.set('kolekcijaId', kolekcijaId.toString());
    }
    return this.http.get<MultimediaResponse>(`${this.config.apiBaseUrl}/api/multimedija`, { params });
  }

  getMultimediaItem(id: number): Observable<Multimedia> {
    return this.http.get<Multimedia>(`${this.config.apiBaseUrl}/api/multimedija/${id}`);
  }

  createFromUrl(data: CreateMultimediaRequest): Observable<Multimedia> {
    return this.http.post<Multimedia>(`${this.config.apiBaseUrl}/api/multimedija/url`, data);
  }

  uploadFile(formData: FormData): Observable<Multimedia> {
    return this.http.post<Multimedia>(`${this.config.apiBaseUrl}/api/multimedija/ucitaj`, formData);
  }

  updateMultimedia(id: number, data: Partial<CreateMultimediaRequest>): Observable<Multimedia> {
    return this.http.put<Multimedia>(`${this.config.apiBaseUrl}/api/multimedija/${id}`, data);
  }

  deleteMultimedia(id: number): Observable<any> {
    return this.http.delete(`${this.config.apiBaseUrl}/api/multimedija/${id}`);
  }
}
