export interface Multimedija {
  id?: number;           // id je opcionalan pri kreiranju
  naziv: string;
  tip?: string;
  putanja?: string;
  kolekcijaId: number;
  javno?: boolean;       // 0 ili 1 u bazi, ali u TS možemo koristiti boolean
  datumDodavanja?: string;
  autor?: string;
}
