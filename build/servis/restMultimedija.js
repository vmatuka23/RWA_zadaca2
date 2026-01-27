import Baza from "../zajednicko/sqliteBaza.js";
import MultimedijaDAO from "../zajednicko/dao/multimedijaDAO.js";
export class RestMultimedija {
    mdao;
    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        db.spoji();
        this.mdao = new MultimedijaDAO(db);
    }
    async getMultimedija(req, res) {
        res.type("application/json");
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        try {
            let multimedije;
            if (uloga === "gost") {
                multimedije = await this.mdao.dajJavnoSadrzaje();
            }
            else if (uloga === "korisnik") {
                multimedije = await this.mdao.dajSadrzajePristupPovezano(korisnikId);
            }
            else {
                multimedije = await this.mdao.dajSveSadrzaje();
            }
            res.send(JSON.stringify(multimedije));
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async getMultimedijaPoId(req, res) {
        res.type("application/json");
        const id = Number(req.params["id"]);
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        try {
            const row = await this.mdao.dajSadrzajPoId(id);
            if (!row) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            // Provjera prava pristupa
            if ((uloga === "gost" && row.javno !== 1) ||
                (uloga === "korisnik" && row.javno !== 1 && !(await this.mdao.jeVlasnikKolekcije(row.kolekcijaId, korisnikId)))) {
                res.status(403).json({ greska: "Nemate pravo pristupa" });
                return;
            }
            res.json(row);
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async postMultimedija(req, res) {
        res.type("application/json");
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da kreirate multimediju" });
            return;
        }
        const { naziv, tip, putanja, kolekcijaId, javno, autor } = req.body;
        if (!naziv || !kolekcijaId) {
            res.status(400).json({ greska: "Naziv i kolekcijaId su obavezni" });
            return;
        }
        try {
            const novaMultimedija = {
                naziv,
                tip: tip || "",
                putanja: putanja || "",
                kolekcijaId,
                javno: javno ? 1 : 0,
                autor: autor || "",
                datumDodavanja: new Date().toISOString()
            };
            const poruka = await this.mdao.dodajSadrzaj(novaMultimedija);
            res.status(201).json(poruka);
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async putMultimedija(req, res) {
        res.type("application/json");
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da uredite multimediju" });
            return;
        }
        const id = Number(req.params["id"]);
        const { naziv, tip, putanja, javno, autor } = req.body;
        const korisnikId = req.session?.korisnik?.id;
        const uloga = req.session?.korisnik?.uloga;
        try {
            const row = await this.mdao.dajSadrzajPoId(id);
            if (!row) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            if (!(await this.mdao.jeVlasnikKolekcije(row.kolekcijaId, korisnikId)) && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu multimediju" });
                return;
            }
            const azuriranaMultimedija = {
                ...row,
                naziv: naziv || row.naziv,
                tip: tip || row.tip,
                putanja: putanja || row.putanja,
                javno: javno != null ? (javno ? 1 : 0) : (row.javno ?? 0),
                autor: autor || row.autor || "",
                id
            };
            await this.mdao.azurirajSadrzaj(azuriranaMultimedija);
            res.json({ poruka: "Uspješno ažurirano" });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async deleteMultimedija(req, res) {
        res.type("application/json");
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da izbrišete multimediju" });
            return;
        }
        const id = Number(req.params["id"]);
        const korisnikId = req.session?.korisnik?.id;
        const uloga = req.session?.korisnik?.uloga;
        try {
            const row = await this.mdao.dajSadrzajPoId(id);
            if (!row) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            if (!(await this.mdao.jeVlasnikKolekcije(row.kolekcijaId, korisnikId)) && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo brisati ovu multimediju" });
                return;
            }
            await this.mdao.obrisiSadrzaj(id);
            res.json({ poruka: "Multimedija obrisana" });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
}
//# sourceMappingURL=restMultimedija.js.map