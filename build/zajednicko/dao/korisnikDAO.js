export default class KorisnikDAO {
    db;
    constructor(db) {
        this.db = db;
    }
    // Kreiranje korisnika
    async dodajKorisnika(korisnik) {
        const sql = `INSERT INTO korisnik
            (korisnickoIme, lozinkaHash, sol, email, uloga, blokiran, ime, prezime, datumRegistracije)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const podaci = [
            korisnik.korisnickoIme,
            korisnik.lozinkaHash,
            korisnik.sol,
            korisnik.email,
            korisnik.uloga,
            korisnik.blokiran ?? 0,
            korisnik.ime ?? null,
            korisnik.prezime ?? null,
            korisnik.datumRegistracije ?? null
        ];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }
    // Dohvat jednog korisnika po ID
    async dajKorisnikaPoId(id) {
        const sql = `SELECT * FROM korisnik WHERE id = ?`;
        const rez = await this.db.dajPodatke(sql, [id]);
        return rez.length > 0 ? rez[0] : null;
    }
    // Dohvat jednog korisnika po korisničkom imenu
    async dajKorisnikaPoKorisnickomImenu(korisnickoIme) {
        const sql = `SELECT * FROM korisnik WHERE korisnickoIme = ?`;
        const rez = await this.db.dajPodatke(sql, [korisnickoIme]);
        return rez.length > 0 ? rez[0] : null;
    }
    // Dohvat svih korisnika
    async dajSveKorisnike() {
        const sql = `SELECT * FROM korisnik`;
        return await this.db.dajPodatke(sql, []);
    }
    // Ažuriranje korisnika (npr. lozinka, blokiran status, uloga)
    async azurirajKorisnika(korisnik) {
        if (!korisnik.id)
            throw new Error("Korisnik ID je obavezan za ažuriranje");
        const sql = `UPDATE korisnik SET
            korisnickoIme = ?, lozinkaHash = ?, sol = ?, email = ?, uloga = ?, blokiran = ?, ime = ?, prezime = ?, datumRegistracije = ?
            WHERE id = ?`;
        const podaci = [
            korisnik.korisnickoIme,
            korisnik.lozinkaHash,
            korisnik.sol,
            korisnik.email,
            korisnik.uloga,
            korisnik.blokiran ?? 0,
            korisnik.ime ?? null,
            korisnik.prezime ?? null,
            korisnik.datumRegistracije ?? null,
            korisnik.id
        ];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }
    // Brisanje korisnika
    async obrisiKorisnika(id) {
        const sql = `DELETE FROM korisnik WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [id]);
    }
    // Blokiranje / odblokiranje
    async postaviBlokiran(id, blokiran) {
        const sql = `UPDATE korisnik SET blokiran = ? WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [blokiran ? 1 : 0, id]);
    }
}
//# sourceMappingURL=korisnikDAO.js.map