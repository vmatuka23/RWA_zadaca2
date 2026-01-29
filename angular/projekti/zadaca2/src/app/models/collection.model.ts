export interface Collection {
  id: number;
  naziv: string;
  opis?: string;
  javno: boolean;
  korisnikId: number;
  istaknutaSlika?: string;
  brojStavki?: number;
  datumKreiranja?: string;
}

export interface CollectionResponse {
  kolekcije: Collection[];
  ukupno: number;
  limitPoStranici: number;
  stranica: number;
}

export interface CreateCollectionRequest {
  naziv: string;
  opis?: string;
  javno: boolean;
}
