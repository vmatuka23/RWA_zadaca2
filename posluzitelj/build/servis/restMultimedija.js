import Baza from "../zajednicko/sqliteBaza.js";
import MultimedijaDAO from "../zajednicko/dao/multimedijaDAO.js";
import * as fs from "fs/promises";
import * as path from "path";
export class RestMultimedija {
    mdao;
    uploadDir = "podaci/multimedija";
    dozvoljeneTipoveSlike = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    dozvoljeneTipoviVideo = ["video/mp4", "video/webm", "video/quicktime"];
    maksVelicinaSlike = 500 * 1024; // 500 KB
    maksVelizinaVidea = 1 * 1024 * 1024; // 1 MB
    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        db.spoji();
        this.mdao = new MultimedijaDAO(db);
    }
    //Validira i detektira tip multimedije (slika ili video)
    detektujTipMultimedije(mimeType) {
        if (this.dozvoljeneTipoveSlike.includes(mimeType)) {
            return "slika";
        }
        else if (this.dozvoljeneTipoviVideo.includes(mimeType)) {
            return "video";
        }
        return null;
    }
    //Validira veličinu datoteke prema tipu
    validacijaVeličineUKorisnika(tip, veličina) {
        if (tip === "slika") {
            return veličina <= this.maksVelicinaSlike;
        }
        else if (tip === "video") {
            return veličina <= this.maksVelizinaVidea;
        }
        return false;
    }
    //Čisti naziv datoteke od opasnih znakova
    očistiNazivDatoteke(naziv) {
        return naziv
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .replace(/_{2,}/g, "_")
            .substring(0, 100);
    }
    async postMultimedija(req, res) {
        res.type("application/json");
        // Validacija sesije
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da kreirate multimediju" });
            return;
        }
        const { naziv, kolekcijaId, javno, autor } = req.body;
        // Validacija obaveznih polja
        if (!naziv || !kolekcijaId || !req.file) {
            res.status(400).json({ greska: "Naziv, kolekcijaId i datoteka su obavezni" });
            return;
        }
        try {
            const tipMultimedije = this.detektujTipMultimedije(req.file.mimetype);
            if (!tipMultimedije) {
                res.status(400).json({ greska: "Nepodržan tip datoteke. Dozvoljeni su: JPEG, PNG, GIF, WebP (slike) ili MP4, WebM, MOV (video)" });
                return;
            }
            // Validacija veličine
            if (!this.validacijaVeličineUKorisnika(tipMultimedije, req.file.size)) {
                const maxSize = tipMultimedije === "slika" ? "500 KB" : "1 MB";
                res.status(400).json({ greska: `Datoteka je prevelika. Maksimalna veličina za ${tipMultimedije} je ${maxSize}` });
                // Obriši privremenu datoteku
                await fs.unlink(req.file.path).catch(() => { });
                return;
            }
            // Provjeri ima li korisnik pristup kolekciji (nije guest)
            if (req.session.korisnik.uloga === "gost") {
                res.status(403).json({ greska: "Gosti ne mogu dodavati multimediju" });
                await fs.unlink(req.file.path).catch(() => { });
                return;
            }
            // Kreiraj direktorij ako ne postoji
            await fs.mkdir(this.uploadDir, { recursive: true }).catch(() => { });
            // Generiraj ime datoteke
            const timestamp = Date.now();
            const ext = path.extname(req.file.originalname);
            const očistoNazie = this.očistiNazivDatoteke(path.basename(req.file.originalname, ext));
            const novaImeDatoteke = `${očistoNazie}_${timestamp}${ext}`;
            const novaStaza = path.join(this.uploadDir, novaImeDatoteke);
            // Premjesti datoteku iz privremene lokacije
            await fs.rename(req.file.path, novaStaza);
            // Kreiraj objekt multimedije za bazu
            const novaMultimedija = {
                naziv: naziv.substring(0, 255),
                tip: tipMultimedije,
                putanja: novaStaza,
                kolekcijaId: parseInt(kolekcijaId),
                javno: javno ? 1 : 0,
                autor: autor ? autor.substring(0, 255) : "",
                datumDodavanja: new Date().toISOString()
            };
            // Spremi u bazu
            const rezultat = await this.mdao.dodajSadrzaj(novaMultimedija);
            res.status(201).json({ status: "uspjeh", poruka: "Multimedija uspješno učitana", id: rezultat });
        }
        catch (err) {
            // Obriši datoteku ako se nes zeznulo
            if (req.file?.path) {
                await fs.unlink(req.file.path).catch(() => { });
            }
            res.status(500).json({ greska: `Greška pri dodavanju multimedije: ${err.message}` });
        }
    }
    async postMultimedijaURL(req, res) {
        res.type("application/json");
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da dodate multimediju" });
            return;
        }
        const { naziv, tip, putanja, kolekcijaId, javno } = req.body;
        if (!naziv || !kolekcijaId || !putanja) {
            res.status(400).json({ greska: "Naziv, kolekcijaId i putanja (URL) su obavezni" });
            return;
        }
        if (req.session.korisnik.uloga === "gost") {
            res.status(403).json({ greska: "Gosti ne mogu dodavati multimediju" });
            return;
        }
        try {
            // Kreiraj objekt multimedije za bazu
            const novaMultimedija = {
                naziv: naziv.substring(0, 255),
                tip: tip || "slika",
                putanja: putanja,
                kolekcijaId: parseInt(kolekcijaId),
                javno: javno ? 1 : 0,
                autor: "",
                datumDodavanja: new Date().toISOString()
            };
            const rezultat = await this.mdao.dodajSadrzaj(novaMultimedija);
            res.status(201).json({ status: "uspjeh", poruka: "Multimedija uspješno dodana", id: rezultat });
        }
        catch (err) {
            res.status(500).json({ greska: `Greška pri dodavanju multimedije: ${err.message}` });
        }
    }
    async deleteMultimedija(req, res) {
        res.type("application/json");
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da izbrišete multimediju" });
            return;
        }
        const id = Number(req.params["id"]);
        const korisnikId = req.session.korisnik.id;
        const uloga = req.session.korisnik.uloga;
        if (!id || isNaN(id)) {
            res.status(400).json({ greska: "Neispravan ID multimedije" });
            return;
        }
        try {
            // Provjeri postoji li multimedija
            const multimedija = await this.mdao.dajSadrzajPoId(id);
            if (!multimedija) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            // Provjeri dozvole pristupa, admin i mod mogu brisati sve, a korisnici mogu samo svoje i javne
            const jeVlasnik = await this.mdao.jeVlasnikKolekcije(multimedija.kolekcijaId, korisnikId);
            const imaDozvolu = uloga === "admin" || uloga === "moderator" || jeVlasnik;
            if (!imaDozvolu) {
                res.status(403).json({ greska: "Nemate dozvolu da izbrišete ovu multimediju. Trebate biti dio kolekcije da je upravljate." });
                return;
            }
            // Obriši datoteku sa servera
            if (multimedija.putanja) {
                await fs.unlink(multimedija.putanja).catch((err) => {
                    console.warn(`Upozorenje: Nije moguće obrisati datoteku ${multimedija.putanja}: ${err.message}`);
                });
            }
            // Obriši iz baze
            await this.mdao.obrisiSadrzaj(id);
            res.status(201).json({ status: "uspjeh", poruka: "Multimedija uspješno obrisana" });
        }
        catch (err) {
            res.status(500).json({ greska: `Greška pri brisanju multimedije: ${err.message}` });
        }
    }
    async getMultimedijaPoId(req, res) {
        res.type("application/json");
        const id = Number(req.params["id"]);
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        if (!id || isNaN(id)) {
            res.status(400).json({ greska: "Neispravan ID multimedije" });
            return;
        }
        try {
            const multimedija = await this.mdao.dajSadrzajPoId(id);
            if (!multimedija) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            // Provjera pristupa bazirana na uloze
            let imaListanje = false;
            if (multimedija.javno === 1) {
                // Javno dostupno svima
                imaListanje = true;
            }
            else if (uloga && uloga !== "gost") {
                // Privatna multimedija - samo vlasnici kolekcije, moderatori i admini
                if (uloga === "admin" || uloga === "moderator") {
                    imaListanje = true;
                }
                else if (korisnikId && (await this.mdao.jeVlasnikKolekcije(multimedija.kolekcijaId, korisnikId))) {
                    imaListanje = true;
                }
            }
            if (!imaListanje) {
                res.status(403).json({ greska: "Nemate dozvolu pristupa ovoj multimediji" });
                return;
            }
            res.json(multimedija);
        }
        catch (err) {
            res.status(500).json({ greska: `Greška pri dohvaćanju multimedije: ${err.message}` });
        }
    }
    async getMultimedija(req, res) {
        res.type("application/json");
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        const kolekcijaIdParam = req.query['kolekcijaId'];
        const kolekcijaId = kolekcijaIdParam ? parseInt(kolekcijaIdParam) : undefined;
        try {
            let multimedije;
            if (kolekcijaId) {
                multimedije = await this.mdao.dajSveSadrzaje(kolekcijaId);
            }
            else if (!uloga || uloga === "gost") {
                multimedije = await this.mdao.dajJavnoSadrzaje();
            }
            else if (uloga === "korisnik") {
                multimedije = await this.mdao.dajSadrzajePristupPovezano(korisnikId);
            }
            else {
                multimedije = await this.mdao.dajSveSadrzaje();
            }
            res.json(multimedije);
        }
        catch (err) {
            res.status(500).json({ greska: `Greška pri dohvaćanju multimedije: ${err.message}` });
        }
    }
    async putMultimedija(req, res) {
        res.type("application/json");
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da uredite multimediju" });
            return;
        }
        const id = Number(req.params["id"]);
        const { naziv, javno, autor } = req.body;
        const korisnikId = req.session.korisnik.id;
        const uloga = req.session.korisnik.uloga;
        if (!id || isNaN(id)) {
            res.status(400).json({ greska: "Neispravan ID multimedije" });
            return;
        }
        try {
            const multimedija = await this.mdao.dajSadrzajPoId(id);
            if (!multimedija) {
                res.status(404).json({ greska: "Multimedija ne postoji" });
                return;
            }
            // Provjera dozvola
            const jeVlasnik = await this.mdao.jeVlasnikKolekcije(multimedija.kolekcijaId, korisnikId);
            const imaDozvolu = uloga === "admin" || uloga === "moderator" || jeVlasnik;
            if (!imaDozvolu) {
                res.status(403).json({ greska: "Nemate dozvolu da uredite ovu multimediju. Trebate biti dio kolekcije da je upravljate." });
                return;
            }
            const azuriranaMultimedija = {
                ...multimedija,
                naziv: naziv || multimedija.naziv,
                javno: javno != null ? (javno ? 1 : 0) : (multimedija.javno ?? 0),
                autor: autor || multimedija.autor || "",
                id
            };
            await this.mdao.azurirajSadrzaj(azuriranaMultimedija);
            res.json({ status: "uspjeh", poruka: "Multimedija uspješno ažurirana" });
        }
        catch (err) {
            res.status(500).json({ greska: `Greška pri ažuriranju multimedije: ${err.message}` });
        }
    }
}
//# sourceMappingURL=restMultimedija.js.map