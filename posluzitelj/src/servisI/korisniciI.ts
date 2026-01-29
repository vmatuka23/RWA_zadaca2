export interface KorisnikI {
  ime:string;
  prezime:string;
  email:string;
  korime:string;
  lozinka:string | null;
}

export interface SesijaKorisnikI {
    id: number;
    korime: string;
    uloga: string;
}