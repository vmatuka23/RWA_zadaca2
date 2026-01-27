export class RestKolekcija {
    db;
    constructor(db) {
        this.db = db;
    }
    // -------------------------------------------------
    // Dohvat svih kolekcija
    getKolekcije(req, res) {
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        let sql = `SELECT * FROM kolekcija`;
        const params = [];
        if (uloga === "gost") {
            sql += ` WHERE javno = 1`;
        }
        else if (uloga === "korisnik") {
            sql += ` WHERE javno = 1 OR id IN (
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
    // -------------------------------------------------
    // Dohvat jedne kolekcije po ID
    getKolekcijaPoId(req, res) {
        const id = Number(req.params["id"]);
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        this.db.get(`SELECT * FROM kolekcija WHERE id=?`, [id], async (err, row) => {
            if (err)
                return res.status(500).json({ greska: err.message });
            if (!row)
                return res.status(404).json({ greska: "Kolekcija ne postoji" });
            if ((uloga === "gost" && row.javno !== true) ||
                (uloga === "korisnik" && row.javno !== true && !(await this.jeVlasnik(id, korisnikId)))) {
                return res.status(403).json({ greska: "Nemate pravo pristupa" });
            }
            return res.json(row);
        });
    }
    // -------------------------------------------------
    // Dodavanje nove kolekcije
    postKolekcija(req, res) {
        const { naziv, opis, istaknutaSlika, javno } = req.body;
        const korisnikId = req.session?.korisnik?.id;
        if (!naziv) {
            res.status(400).json({ greska: "Naziv je obavezan" });
            return;
        }
        const sql = `INSERT INTO kolekcija (naziv, opis, istaknutaSlika, javno) VALUES (?, ?, ?, ?)`;
        this.db.run(sql, [naziv, opis || "", istaknutaSlika || "", javno ? 1 : 0], function (err) {
            if (err)
                return res.status(500).json({ greska: err.message });
            const kolekcijaId = this.lastID;
            // Automatski dodaj vlasnika u korisnik_kolekcija
            const sqlLink = `INSERT INTO korisnik_kolekcija (korisnikId, kolekcijaId) VALUES (?, ?)`;
            req.app.locals["db"].run(sqlLink, [korisnikId, kolekcijaId], function (err) {
                if (err)
                    console.error("Greška pri povezivanju korisnika s kolekcijom", err);
            });
            return res.status(201).json({ id: kolekcijaId });
        });
    }
    // -------------------------------------------------
    // Ažuriranje kolekcije
    putKolekcija(req, res) {
        const id = Number(req.params["id"]);
        const { naziv, opis, istaknutaSlika, javno } = req.body;
        const korisnikId = req.session?.korisnik?.id;
        const uloga = req.session?.korisnik?.uloga;
        this.db.get(`SELECT * FROM kolekcija WHERE id=?`, [id], async (err, row) => {
            if (err) {
                res.status(500).json({ greska: err.message });
                return;
            }
            if (!row) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }
            if (!(await this.jeVlasnik(id, korisnikId)) && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
                return;
            }
            const sql = `UPDATE kolekcija SET naziv=?, opis=?, istaknutaSlika=?, javno=? WHERE id=?`;
            this.db.run(sql, [
                naziv || row.naziv,
                opis || row.opis,
                istaknutaSlika || row.istaknutaSlika,
                javno != null ? (javno ? 1 : 0) : row.javno,
                id,
            ], function (err) {
                if (err)
                    return res.status(500).json({ greska: err.message });
                return res.json({ poruka: "Kolekcija uspješno ažurirana" });
            });
        });
    }
    // -------------------------------------------------
    // Brisanje kolekcije
    deleteKolekcija(req, res) {
        const id = Number(req.params["id"]);
        const korisnikId = req.session?.korisnik?.id;
        const uloga = req.session?.korisnik?.uloga;
        this.db.get(`SELECT * FROM kolekcija WHERE id=?`, [id], async (err, row) => {
            if (err) {
                res.status(500).json({ greska: err.message });
                return;
            }
            if (!row) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }
            if (!(await this.jeVlasnik(id, korisnikId)) && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo brisati ovu kolekciju" });
                return;
            }
            this.db.run(`DELETE FROM kolekcija WHERE id=?`, [id], function (err) {
                if (err)
                    return res.status(500).json({ greska: err.message });
                return res.json({ poruka: "Kolekcija obrisana" });
            });
        });
    }
    // -------------------------------------------------
    // Dodavanje multimedije u kolekciju
    dodajMultimediju(req, res) {
        const kolekcijaId = Number(req.params["id"]);
        const { multimedijaId } = req.body;
        const korisnikId = req.session?.korisnik?.id;
        this.jeVlasnik(kolekcijaId, korisnikId).then((vlasnik) => {
            if (!vlasnik && req.session?.korisnik?.uloga !== "moderator" && req.session?.korisnik?.uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
                return;
            }
            const sql = `UPDATE multimedija SET kolekcijaId=? WHERE id=?`;
            this.db.run(sql, [kolekcijaId, multimedijaId], function (err) {
                if (err)
                    return res.status(500).json({ greska: err.message });
                return res.json({ poruka: "Multimedija dodana u kolekciju" });
            });
        });
    }
    // -------------------------------------------------
    // Uklanjanje multimedije iz kolekcije
    ukloniMultimediju(req, res) {
        const kolekcijaId = Number(req.params["id"]);
        const multimedijaId = Number(req.params["multimedijaId"]);
        const korisnikId = req.session?.korisnik?.id;
        this.jeVlasnik(kolekcijaId, korisnikId).then((vlasnik) => {
            if (!vlasnik && req.session?.korisnik?.uloga !== "moderator" && req.session?.korisnik?.uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
                return;
            }
            const sql = `UPDATE multimedija SET kolekcijaId=NULL WHERE id=? AND kolekcijaId=?`;
            this.db.run(sql, [multimedijaId, kolekcijaId], function (err) {
                if (err)
                    return res.status(500).json({ greska: err.message });
                return res.json({ poruka: "Multimedija uklonjena iz kolekcije" });
            });
        });
    }
    // -------------------------------------------------
    // Pomoćna metoda: provjera vlasništva kolekcije
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
//# sourceMappingURL=restKolekcija.js.map