import Baza from "../sqliteBaza.js";

export interface Kolekcija {
    id?: number;
    naziv: string;
    opis?: string;
    istaknutaSlika?: string;
    javno?: number; // 0 ili 1
}

export default class KolekcijaDAO {
    private db: Baza;

    constructor(db: Baza) {
        this.db = db;
    }

    async dodajKolekciju(k: Kolekcija) {
        const sql = `INSERT INTO kolekcija (naziv, opis, istaknutaSlika, javno)
                     VALUES (?, ?, ?, ?)`;
        const podaci = [k.naziv, k.opis ?? null, k.istaknutaSlika ?? null, k.javno ?? 0];
        const rez = await this.db.ubaciAzurirajPodatke(sql, podaci);
        return { id: rez.lastID };
    }

    async dajKolekcijuPoId(id: number): Promise<Kolekcija | null> {
        const sql = `SELECT * FROM kolekcija WHERE id = ?`;
        const rez = await this.db.dajPodatke(sql, [id]);
        return rez.length > 0 ? rez[0] : null;
    }

    async dajSveKolekcije(): Promise<Kolekcija[]> {
        const sql = `SELECT * FROM kolekcija`;
        return await this.db.dajPodatke(sql, []);
    }

    async azurirajKolekciju(k: Kolekcija) {
        if (!k.id) throw new Error("Kolekcija ID je obavezan za ažuriranje");
        const sql = `UPDATE kolekcija SET naziv = ?, opis = ?, istaknutaSlika = ?, javno = ? WHERE id = ?`;
        const podaci = [k.naziv, k.opis ?? null, k.istaknutaSlika ?? null, k.javno ?? 0, k.id];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }

    async obrisiKolekciju(id: number) {
        const sql = `DELETE FROM kolekcija WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [id]);
    }

    async dajJavneKolekcije(): Promise<Kolekcija[]> {
        const sql = `SELECT * FROM kolekcija WHERE javno = 1`;
        return await this.db.dajPodatke(sql, []);
    }

    async dajKolekcijeKorisnika(korisnikId: number): Promise<Kolekcija[]> {
        const sql = `SELECT * FROM kolekcija WHERE javno = 1 OR id IN (
            SELECT kolekcijaId FROM korisnik_kolekcija WHERE korisnikId = ?
        )`;
        return await this.db.dajPodatke(sql, [korisnikId]);
    }

    async jeVlasnikKolekcije(kolekcijaId: number, korisnikId: number): Promise<boolean> {
        const sql = `SELECT * FROM korisnik_kolekcija WHERE kolekcijaId = ? AND korisnikId = ?`;
        const rez = await this.db.dajPodatke(sql, [kolekcijaId, korisnikId]);
        return rez.length > 0;
    }

    async dodajVlasnikaKolekciji(kolekcijaId: number, korisnikId: number) {
        const sql = `INSERT INTO korisnik_kolekcija (korisnikId, kolekcijaId) VALUES (?, ?)`;
        return await this.db.ubaciAzurirajPodatke(sql, [korisnikId, kolekcijaId]);
    }

    async dodajMultimedijuKolekciji(kolekcijaId: number, multimedijaId: number) {
        const sql = `UPDATE multimedija SET kolekcijaId = ? WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [kolekcijaId, multimedijaId]);
    }

    async ukloniMultimedijuIzKolekcije(kolekcijaId: number, multimedijaId: number) {
        const sql = `UPDATE multimedija SET kolekcijaId = NULL WHERE id = ? AND kolekcijaId = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [multimedijaId, kolekcijaId]);
    }
}
