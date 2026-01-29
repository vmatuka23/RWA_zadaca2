import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from './config';
import { TMDBSearchResponse, TMDBMovie } from '../models/tmdb.model';

@Injectable({
  providedIn: 'root',
})
export class TmdbRest {
  
  constructor(
    private http: HttpClient,
    private config: Config
  ) { }

  searchMovies(query: string, page: number = 1): Observable<TMDBSearchResponse> {
    const params = new HttpParams()
      .set('trazi', query)
      .set('stranica', page.toString());
    return this.http.get<TMDBSearchResponse>(`${this.config.apiBaseUrl}/api/tmdb/filmovi`, { params });
  }

  getPopularMovies(page: number = 1): Observable<TMDBSearchResponse> {
    const params = new HttpParams().set('stranica', page.toString());
    return this.http.get<TMDBSearchResponse>(`${this.config.apiBaseUrl}/api/tmdb/popularni`, { params });
  }

  getMovieDetails(id: number): Observable<TMDBMovie> {
    return this.http.get<TMDBMovie>(`${this.config.apiBaseUrl}/api/tmdb/filmovi/${id}`);
  }
}
