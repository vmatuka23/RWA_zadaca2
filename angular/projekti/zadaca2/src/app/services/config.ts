import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppConfig {
  apiBaseUrl: string;
  tmdbImageBaseUrl: string;
  maxFileSize: number;
  itemsPerPage: number;
}

@Injectable({
  providedIn: 'root',
})
export class Config {
  private config?: AppConfig;

  constructor(private http: HttpClient) { }

  async loadConfig(): Promise<void> {
    if (!this.config) {
      this.config = await firstValueFrom(
        this.http.get<AppConfig>('/config.json')
      );
    }
  }

  get apiBaseUrl(): string {
    return this.config?.apiBaseUrl || 'http://localhost:12034';
  }

  get tmdbImageBaseUrl(): string {
    return this.config?.tmdbImageBaseUrl || 'https://image.tmdb.org/t/p';
  }

  get maxFileSize(): number {
    return this.config?.maxFileSize || 1048576;
  }

  get itemsPerPage(): number {
    return this.config?.itemsPerPage || 4;
  }
}
