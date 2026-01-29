export interface User {
  id: number;
  korisnickoIme: string;
  email: string;
  ime?: string;
  prezime?: string;
  uloga: 'admin' | 'moderator' | 'korisnik';
  aktiviran?: boolean;
}

export interface LoginRequest {
  korisnickoIme: string;
  lozinka: string;
}

export interface RegisterRequest {
  korisnickoIme: string;
  lozinka: string;
  email: string;
  ime?: string;
  prezime?: string;
}

export interface LoginResponse {
  poruka?: string;
  korisnik?: User;
}
