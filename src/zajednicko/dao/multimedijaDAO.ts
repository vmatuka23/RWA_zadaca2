import Baza from "../sqliteBaza.js";

export interface Multimedija {
    id?: number;
    naziv: string;
    tip: string; // 'slika' | 'video' | 'film'
    putanja: string;
    kolekcijaId: number;
    javno?: number;
    datumDodavanja?: string;
    autor?: string;
}

export default class MultimedijaDAO {
    private db: Baza;

    constructor(db: Baza) {
        this.db = db;
    }

    async dodajSadrzaj(m: Multimedija) {
        const sql = `INSERT INTO multimedija
            (naziv, tip, putanja, kolekcijaId, javno, datumDodavanja, autor)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const podaci = [
            m.naziv, m.tip, m.putanja, m.kolekcijaId,
            m.javno ?? 0, m.datumDodavanja ?? null, m.autor ?? null
        ];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }

    async dajSadrzajPoId(id: number): Promise<Multimedija | null> {
        const sql = `SELECT * FROM multimedija WHERE id = ?`;
        const rez = await this.db.dajPodatke(sql, [id]);
        return rez.length > 0 ? rez[0] : null;
    }

    async dajSveSadrzaje(kolekcijaId?: number): Promise<Multimedija[]> {
        let sql = `SELECT * FROM multimedija`;
        let podaci: any[] = [];
        if (kolekcijaId !== undefined) {
            sql += ` WHERE kolekcijaId = ?`;
            podaci.push(kolekcijaId);
        }
        return await this.db.dajPodatke(sql, podaci);
    }

    async azurirajSadrzaj(m: Multimedija) {
        if (!m.id) throw new Error("Sadržaj ID je obavezan za ažuriranje");
        const sql = `UPDATE multimedija SET
            naziv = ?, tip = ?, putanja = ?, kolekcijaId = ?, javno = ?, datumDodavanja = ?, autor = ?
            WHERE id = ?`;
        const podaci = [
            m.naziv, m.tip, m.putanja, m.kolekcijaId, m.javno ?? 0, m.datumDodavanja ?? null, m.autor ?? null, m.id
        ];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }

    async obrisiSadrzaj(id: number) {
        const sql = `DELETE FROM multimedija WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [id]);
    }
}
