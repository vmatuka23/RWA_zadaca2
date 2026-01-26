export default class KorisnikKolekcijaDAO {
    db;
    constructor(db) {
        this.db = db;
    }
    async dodajVezu(podatak) {
        const sql = `INSERT INTO korisnik_kolekcija (korisnikId, kolekcijaId)
                     VALUES (?, ?)`;
        const podaci = [podatak.korisnikId, podatak.kolekcijaId];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }
    async obrisiVezu(korisnikId, kolekcijaId) {
        const sql = `DELETE FROM korisnik_kolekcija
                     WHERE korisnikId = ? AND kolekcijaId = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [korisnikId, kolekcijaId]);
    }
    async dajSveKolekcijeZaKorisnika(korisnikId) {
        const sql = `SELECT * FROM korisnik_kolekcija WHERE korisnikId = ?`;
        return await this.db.dajPodatke(sql, [korisnikId]);
    }
    async dajSveKorisnikeZaKolekciju(kolekcijaId) {
        const sql = `SELECT * FROM korisnik_kolekcija WHERE kolekcijaId = ?`;
        return await this.db.dajPodatke(sql, [kolekcijaId]);
    }
    async postojiVeza(korisnikId, kolekcijaId) {
        const sql = `SELECT 1 FROM korisnik_kolekcija
                     WHERE korisnikId = ? AND kolekcijaId = ?`;
        const rez = await this.db.dajPodatke(sql, [korisnikId, kolekcijaId]);
        return rez.length > 0;
    }
}
//# sourceMappingURL=korisnik_kolekcijaDAO.js.map