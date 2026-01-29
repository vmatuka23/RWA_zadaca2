import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export default class Baza {
	private vezaDB:any;
	private putanjaSQLliteDatoteka;

	constructor(putanjaSQLliteDatoteka: string) {
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
	
	async ubaciAzurirajPodatke(sql: string, podaci: Array<string | number | null>) {
		try {
			const rezultat = await this.vezaDB.run(sql,podaci);
            return rezultat;
		} catch (err) {
			console.error("Greška pri izvršavanju upita:", err);
			throw err;
		}
	}
	
	async dajPodatke(sql: string, podaci: Array<string | number>) {
		try {
			const rezultat = await this.vezaDB.all(sql,podaci);
			return rezultat;
		} catch (err) {
			console.error("Greška pri izvršavanju upita:", err);
			throw err;
		}
  }

    async izvrsiUpit(sql:string) {
        try {
            const rezultat = await this.vezaDB.all(sql);
            return rezultat;
        } catch (err) {
            console.error('Greška pri izvršavanju upita:', err);
            throw err;
        }
    }

    async zatvoriVezu() {
        await this.vezaDB.close();
    }
}
