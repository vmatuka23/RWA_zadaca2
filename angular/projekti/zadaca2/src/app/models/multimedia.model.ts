export interface Multimedia {
  id: number;
  naziv: string;
  tip: 'slika' | 'video';
  putanja: string;
  velicina?: number;
  korisnikId: number;
  kolekcijaId?: number;
  javno: boolean;
  datumKreiranja?: string;
}

export interface MultimediaResponse {
  multimedija: Multimedia[];
  ukupno: number;
  limitPoStranici: number;
  stranica: number;
}

export interface CreateMultimediaRequest {
  naziv: string;
  tip: 'slika' | 'video';
  putanja: string;
  kolekcijaId?: number;
  javno: boolean;
}
