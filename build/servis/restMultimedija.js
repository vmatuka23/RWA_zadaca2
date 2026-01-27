export class RestMultimedija {
    db;
    constructor(db) {
        this.db = db;
    }
    // Dohvat svih multimedija
    getMultimedija(req, res) {
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        let sql = `SELECT * FROM multimedija`;
        const params = [];
        if (uloga === "gost") {
            sql += ` WHERE javno = 1`;
        }
        else if (uloga === "korisnik") {
            sql += ` WHERE javno = 1 OR kolekcijaId IN (
        SELECT kolekcijaId FROM korisnik_kolekcija WHERE korisnikId = ?
      )`;
            params.push(korisnikId);
        }
        this.db.all(sql, params, (err, rows) => {
            if (err)
                return res.status(500).json({ greska: err.message });
            return res.json(rows);
        });
    }
    // Dohvat jednog multimedijalnog zapisa po ID
    getMultimedijaPoId(req, res) {
        const id = Number(req.params["id"]);
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        this.db.get(`SELECT * FROM multimedija WHERE id=?`, [id], async (err, row) => {
            if (err)
                return res.status(500).json({ greska: err.message });
            if (!row)
                return res.status(404).json({ greska: "Multimedija ne postoji" });
            // Provjera prava pristupa
            if ((uloga === "gost" && row.javno !== true) ||
                (uloga === "korisnik" && row.javno !== true && !(await this.jeVlasnik(row.kolekcijaId, korisnikId)))) {
                return res.status(403).json({ greska: "Nemate pravo pristupa" });
            }
            return res.json(row);
        });
    }
    // Dodavanje nove multimedije
    postMultimedija(req, res) {
        const { naziv, tip, putanja, kolekcijaId, javno, autor } = req.body;
        if (!naziv || !kolekcijaId) {
            res.status(400).json({ greska: "Naziv i kolekcijaId su obavezni" });
            return;
        }
        const sql = `INSERT INTO multimedija 
      (naziv, tip, putanja, kolekcijaId, javno, datumDodavanja, autor)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`;
        this.db.run(sql, [naziv, tip || "", putanja || "", kolekcijaId, javno ? 1 : 0, autor || ""], function (err) {
            if (err)
                return res.status(500).json({ greska: err.message });
            return res.status(201).json({ id: this.lastID });
        });
    }
    // Ažuriranje multimedije
    putMultimedija(req, res) {
        const id = Number(req.params["id"]);
        const { naziv, tip, putanja, javno, autor } = req.body;
        const korisnikId = req.session?.korisnik?.id;
        const uloga = req.session?.korisnik?.uloga;
        this.db.get(`SELECT * FROM multimedija WHERE id=?`, [id], async (err, row) => {
            if (err) {
                res.status(500).json({ greska: err.message });
                return;
            }
            if (!row) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            if (!(await this.jeVlasnik(row.kolekcijaId, korisnikId)) && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu multimediju" });
                return;
            }
            const sql = `UPDATE multimedija SET naziv=?, tip=?, putanja=?, javno=?, autor=? WHERE id=?`;
            this.db.run(sql, [
                naziv || row.naziv,
                tip || row.tip,
                putanja || row.putanja,
                javno != null ? (javno ? 1 : 0) : row.javno,
                autor || row.autor,
                id,
            ], function (err) {
                if (err)
                    return res.status(500).json({ greska: err.message });
                return res.json({ poruka: "Uspješno ažurirano" });
            });
        });
    }
    // Brisanje multimedije
    deleteMultimedija(req, res) {
        const id = Number(req.params["id"]);
        const korisnikId = req.session?.korisnik?.id;
        const uloga = req.session?.korisnik?.uloga;
        this.db.get(`SELECT * FROM multimedija WHERE id=?`, [id], async (err, row) => {
            if (err) {
                res.status(500).json({ greska: err.message });
                return;
            }
            if (!row) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            if (!(await this.jeVlasnik(row.kolekcijaId, korisnikId)) && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo brisati ovu multimediju" });
                return;
            }
            this.db.run(`DELETE FROM multimedija WHERE id=?`, [id], function (err) {
                if (err)
                    return res.status(500).json({ greska: err.message });
                return res.json({ poruka: "Multimedija obrisana" });
            });
        });
    }
    // Pomoćna metoda: provjera vlasništva (async)
    async jeVlasnik(kolekcijaId, korisnikId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM korisnik_kolekcija WHERE kolekcijaId=? AND korisnikId=?`, [kolekcijaId, korisnikId], (err, row) => {
                if (err)
                    return reject(err);
                resolve(!!row);
            });
        });
    }
}
//# sourceMappingURL=restMultimedija.js.map