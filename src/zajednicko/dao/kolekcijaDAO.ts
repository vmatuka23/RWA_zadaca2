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
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
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
}
