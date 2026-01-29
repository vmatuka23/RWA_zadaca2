import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
export default class Baza {
    vezaDB;
    putanjaSQLliteDatoteka;
    constructor(putanjaSQLliteDatoteka) {
        this.putanjaSQLliteDatoteka = putanjaSQLliteDatoteka;
        this.vezaDB = null;
    }
    async spoji() {
        this.vezaDB = await open({
            filename: this.putanjaSQLliteDatoteka,
            driver: sqlite3.Database
        });
        await this.vezaDB.exec('PRAGMA foreign_keys = ON;');
    }
    async ubaciAzurirajPodatke(sql, podaci) {
        try {
            const rezultat = await this.vezaDB.run(sql, podaci);
            return rezultat;
        }
        catch (err) {
            console.error("Greška pri izvršavanju upita:", err);
            throw err;
        }
    }
    async dajPodatke(sql, podaci) {
        try {
            const rezultat = await this.vezaDB.all(sql, podaci);
            return rezultat;
        }
        catch (err) {
            console.error("Greška pri izvršavanju upita:", err);
            throw err;
        }
    }
    async izvrsiUpit(sql) {
        try {
            const rezultat = await this.vezaDB.all(sql);
            return rezultat;
        }
        catch (err) {
            console.error('Greška pri izvršavanju upita:', err);
            throw err;
        }
    }
    async zatvoriVezu() {
        await this.vezaDB.close();
    }
}
//# sourceMappingURL=sqliteBaza.js.map