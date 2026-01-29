export default class MultimedijaDAO {
    db;
    constructor(db) {
        this.db = db;
    }
    async dodajSadrzaj(m) {
        const sql = `INSERT INTO multimedija
            (naziv, tip, putanja, kolekcijaId, javno, datumDodavanja, autor)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const podaci = [
            m.naziv, m.tip, m.putanja, m.kolekcijaId,
            m.javno ?? 0, m.datumDodavanja ?? null, m.autor ?? null
        ];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }
    async dajSadrzajPoId(id) {
        const sql = `SELECT * FROM multimedija WHERE id = ?`;
        const rez = await this.db.dajPodatke(sql, [id]);
        return rez.length > 0 ? rez[0] : null;
    }
    async dajSveSadrzaje(kolekcijaId) {
        let sql = `SELECT * FROM multimedija`;
        let podaci = [];
        if (kolekcijaId !== undefined) {
            sql += ` WHERE kolekcijaId = ?`;
            podaci.push(kolekcijaId);
        }
        return await this.db.dajPodatke(sql, podaci);
    }
    async azurirajSadrzaj(m) {
        if (!m.id)
            throw new Error("Sadržaj ID je obavezan za ažuriranje");
        const sql = `UPDATE multimedija SET
            naziv = ?, tip = ?, putanja = ?, kolekcijaId = ?, javno = ?, datumDodavanja = ?, autor = ?
            WHERE id = ?`;
        const podaci = [
            m.naziv, m.tip, m.putanja, m.kolekcijaId, m.javno ?? 0, m.datumDodavanja ?? null, m.autor ?? null, m.id
        ];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }
    async obrisiSadrzaj(id) {
        const sql = `DELETE FROM multimedija WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [id]);
    }
    async dajJavnoSadrzaje() {
        const sql = `SELECT * FROM multimedija WHERE javno = 1`;
        return await this.db.dajPodatke(sql, []);
    }
    async dajSadrzajePristupPovezano(korisnikId) {
        const sql = `SELECT * FROM multimedija WHERE javno = 1 OR kolekcijaId IN (
            SELECT kolekcijaId FROM korisnik_kolekcija WHERE korisnikId = ?
        )`;
        return await this.db.dajPodatke(sql, [korisnikId]);
    }
    async jeVlasnikKolekcije(kolekcijaId, korisnikId) {
        const sql = `SELECT * FROM korisnik_kolekcija WHERE kolekcijaId = ? AND korisnikId = ?`;
        const rez = await this.db.dajPodatke(sql, [kolekcijaId, korisnikId]);
        return rez.length > 0;
    }
}
//# sourceMappingURL=multimedijaDAO.js.map