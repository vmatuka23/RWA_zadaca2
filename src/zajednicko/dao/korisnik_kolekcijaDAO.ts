import Baza from "../sqliteBaza.js";

export interface KorisnikKolekcija {
    korisnikId: number;
    kolekcijaId: number;
}

export default class KorisnikKolekcijaDAO {
    private db: Baza;

    constructor(db: Baza) {
        this.db = db;
    }

    async dodajVezu(podatak: KorisnikKolekcija) {
        const sql = `INSERT INTO korisnik_kolekcija (korisnikId, kolekcijaId)
                     VALUES (?, ?)`;
        const podaci = [podatak.korisnikId, podatak.kolekcijaId];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }

    async obrisiVezu(korisnikId: number, kolekcijaId: number) {
        const sql = `DELETE FROM korisnik_kolekcija
                     WHERE korisnikId = ? AND kolekcijaId = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [korisnikId, kolekcijaId]);
    }

    async dajSveKolekcijeZaKorisnika(korisnikId: number): Promise<KorisnikKolekcija[]> {
        const sql = `SELECT * FROM korisnik_kolekcija WHERE korisnikId = ?`;
        return await this.db.dajPodatke(sql, [korisnikId]);
    }

    async dajSveKorisnikeZaKolekciju(kolekcijaId: number): Promise<KorisnikKolekcija[]> {
        const sql = `SELECT * FROM korisnik_kolekcija WHERE kolekcijaId = ?`;
        return await this.db.dajPodatke(sql, [kolekcijaId]);
    }

    async postojiVeza(korisnikId: number, kolekcijaId: number): Promise<boolean> {
        const sql = `SELECT 1 FROM korisnik_kolekcija
                     WHERE korisnikId = ? AND kolekcijaId = ?`;
        const rez = await this.db.dajPodatke(sql, [korisnikId, kolekcijaId]);
        return rez.length > 0;
    }
}
