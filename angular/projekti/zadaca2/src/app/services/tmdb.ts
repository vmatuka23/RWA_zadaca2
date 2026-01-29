import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from './config';
import { TMDBSearchResponse, TMDBMovie, TMDBGenre } from '../models/tmdb.model';

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  
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

  getMovieDetails(id: number): Observable<TMDBMovie> {
    return this.http.get<TMDBMovie>(`${this.config.apiBaseUrl}/api/tmdb/filmovi/${id}`);
  }

  getGenres(): Observable<{ genres: TMDBGenre[] }> {
    return this.http.get<{ genres: TMDBGenre[] }>(`${this.config.apiBaseUrl}/api/tmdb/zanrovi`);
  }

  getImageUrl(path: string, size: string = 'w500'): string {
    return `${this.config.tmdbImageBaseUrl}/${size}${path}`;
  }
}
