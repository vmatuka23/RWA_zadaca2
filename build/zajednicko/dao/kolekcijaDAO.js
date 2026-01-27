export default class KolekcijaDAO {
    db;
    constructor(db) {
        this.db = db;
    }
    async dodajKolekciju(k) {
        const sql = `INSERT INTO kolekcija (naziv, opis, istaknutaSlika, javno)
                     VALUES (?, ?, ?, ?)`;
        const podaci = [k.naziv, k.opis ?? null, k.istaknutaSlika ?? null, k.javno ?? 0];
        const rez = await this.db.ubaciAzurirajPodatke(sql, podaci);
        return { id: rez.lastID };
    }
    async dajKolekcijuPoId(id) {
        const sql = `SELECT * FROM kolekcija WHERE id = ?`;
        const rez = await this.db.dajPodatke(sql, [id]);
        return rez.length > 0 ? rez[0] : null;
    }
    async dajSveKolekcije() {
        const sql = `SELECT * FROM kolekcija`;
        return await this.db.dajPodatke(sql, []);
    }
    async azurirajKolekciju(k) {
        if (!k.id)
            throw new Error("Kolekcija ID je obavezan za ažuriranje");
        const sql = `UPDATE kolekcija SET naziv = ?, opis = ?, istaknutaSlika = ?, javno = ? WHERE id = ?`;
        const podaci = [k.naziv, k.opis ?? null, k.istaknutaSlika ?? null, k.javno ?? 0, k.id];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }
    async obrisiKolekciju(id) {
        const sql = `DELETE FROM kolekcija WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [id]);
    }
    async dajJavneKolekcije() {
        const sql = `SELECT * FROM kolekcija WHERE javno = 1`;
        return await this.db.dajPodatke(sql, []);
    }
    async dajKolekcijeKorisnika(korisnikId) {
        const sql = `SELECT * FROM kolekcija WHERE javno = 1 OR id IN (
            SELECT kolekcijaId FROM korisnik_kolekcija WHERE korisnikId = ?
        )`;
        return await this.db.dajPodatke(sql, [korisnikId]);
    }
    async jeVlasnikKolekcije(kolekcijaId, korisnikId) {
        const sql = `SELECT * FROM korisnik_kolekcija WHERE kolekcijaId = ? AND korisnikId = ?`;
        const rez = await this.db.dajPodatke(sql, [kolekcijaId, korisnikId]);
        return rez.length > 0;
    }
    async dodajVlasnikaKolekciji(kolekcijaId, korisnikId) {
        const sql = `INSERT INTO korisnik_kolekcija (korisnikId, kolekcijaId) VALUES (?, ?)`;
        return await this.db.ubaciAzurirajPodatke(sql, [korisnikId, kolekcijaId]);
    }
    async dodajMultimedijuKolekciji(kolekcijaId, multimedijaId) {
        const sql = `UPDATE multimedija SET kolekcijaId = ? WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [kolekcijaId, multimedijaId]);
    }
    async ukloniMultimedijuIzKolekcije(kolekcijaId, multimedijaId) {
        const sql = `UPDATE multimedija SET kolekcijaId = NULL WHERE id = ? AND kolekcijaId = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [multimedijaId, kolekcijaId]);
    }
}
//# sourceMappingURL=kolekcijaDAO.js.map