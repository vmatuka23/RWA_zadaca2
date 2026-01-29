/**
 * DAO (Data Access Object) za upravljanje aktivacijskim tokenima
 * Omogućuje CRUD operacije nad tablicom aktivacijski_token
 */
export default class AktivacijskiTokenDAO {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Dodaje novi aktivacijski token u bazu
     * @param aktivacijskiToken - Podaci o tokenu
     * @returns Rezultat umetanja
     */
    async dodajToken(aktivacijskiToken) {
        const sql = `INSERT INTO aktivacijski_token
            (korisnikId, token, datumKreiranja, datumIsteka, iskoristen)
            VALUES (?, ?, ?, ?, ?)`;
        const podaci = [
            aktivacijskiToken.korisnikId,
            aktivacijskiToken.token,
            aktivacijskiToken.datumKreiranja,
            aktivacijskiToken.datumIsteka,
            aktivacijskiToken.iskoristen ?? 0
        ];
        return await this.db.ubaciAzurirajPodatke(sql, podaci);
    }
    /**
     * Dohvaća token po vrijednosti tokena
     * @param token - Vrijednost tokena
     * @returns Aktivacijski token ili null
     */
    async dajTokenPoVrijednosti(token) {
        const sql = `SELECT * FROM aktivacijski_token WHERE token = ?`;
        const rez = await this.db.dajPodatke(sql, [token]);
        return rez.length > 0 ? rez[0] : null;
    }
    /**
     * Dohvaća sve tokene za određenog korisnika
     * @param korisnikId - ID korisnika
     * @returns Lista aktivacijskih tokena
     */
    async dajTokeneZaKorisnika(korisnikId) {
        const sql = `SELECT * FROM aktivacijski_token WHERE korisnikId = ?`;
        return await this.db.dajPodatke(sql, [korisnikId]);
    }
    /**
     * Označava token kao iskorišten
     * @param tokenId - ID tokena
     * @returns Rezultat ažuriranja
     */
    async oznaciTokenKaoIskoristen(tokenId) {
        const sql = `UPDATE aktivacijski_token SET iskoristen = 1 WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [tokenId]);
    }
    /**
     * Briše token po ID-u
     * @param tokenId - ID tokena za brisanje
     * @returns Rezultat brisanja
     */
    async obrisiToken(tokenId) {
        const sql = `DELETE FROM aktivacijski_token WHERE id = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [tokenId]);
    }
    /**
     * Briše sve istekle tokene
     * @returns Rezultat brisanja
     */
    async obrisiIstekleTokene() {
        const sql = `DELETE FROM aktivacijski_token WHERE datumIsteka < datetime('now')`;
        return await this.db.ubaciAzurirajPodatke(sql, []);
    }
    /**
     * Briše sve tokene za određenog korisnika
     * @param korisnikId - ID korisnika
     * @returns Rezultat brisanja
     */
    async obrisiTokeneZaKorisnika(korisnikId) {
        const sql = `DELETE FROM aktivacijski_token WHERE korisnikId = ?`;
        return await this.db.ubaciAzurirajPodatke(sql, [korisnikId]);
    }
    /**
     * Provjerava je li token valjan (nije istekao i nije iskorišten)
     * @param token - Vrijednost tokena
     * @returns true ako je token valjan, false inače
     */
    async jeTokenValjan(token) {
        const aktivacijskiToken = await this.dajTokenPoVrijednosti(token);
        if (!aktivacijskiToken) {
            return false;
        }
        // Provjeri je li token već iskorišten
        if (aktivacijskiToken.iskoristen === 1) {
            return false;
        }
        // Provjeri je li token istekao
        const datumIsteka = new Date(aktivacijskiToken.datumIsteka);
        const sada = new Date();
        return sada < datumIsteka;
    }
}
//# sourceMappingURL=aktivacijskiTokenDAO.js.map