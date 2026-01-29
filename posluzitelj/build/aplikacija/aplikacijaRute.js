import { provjeriAutentikaciju, generirajSol as generirajSolAut, provjeriUlogu } from "../servis/autentikacija.js";
import Baza from "../zajednicko/sqliteBaza.js";
import KorisnikDAO from "../zajednicko/dao/korisnikDAO.js";
import { kreirajSHA256 } from "../zajednicko/kodovi.js";
import { readFileSync } from "fs";
import { resolve } from "path";
export class AplikacijaRute {
    kdao;
    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        db.spoji();
        this.kdao = new KorisnikDAO(db);
    }
    //Učitaj HTML datoteku sa putanje
    ucitajHTML(putanja) {
        try {
            return readFileSync(resolve(putanja), 'utf-8');
        }
        catch (err) {
            return "<h1>Greška 404 - Stranica nije pronađena</h1>";
        }
    }
    /**
     * POST /login - Prijava korisnika
     * Body: { korisnickoIme: string, lozinka: string }
     */
    async login(zahtjev, odgovor) {
        odgovor.type("application/json");
        const { korisnickoIme, lozinka } = zahtjev.body;
        if (!korisnickoIme || !lozinka) {
            odgovor.status(400).json({ greska: "Korisničko ime i lozinka su obavezni" });
            return;
        }
        try {
            const korisnik = await this.kdao.dajKorisnikaPoKorisnickomImenu(korisnickoIme);
            if (!korisnik) {
                odgovor.status(401).json({ greska: "Pogrešno korisničko ime ili lozinka" });
                return;
            }
            if (korisnik.blokiran) {
                odgovor.status(403).json({ greska: "Račun je blokiran" });
                return;
            }
            // hash iz baze: koristi kreirajSHA256 sa soli
            const sol = korisnik.sol;
            const hashUneseneLozinke = kreirajSHA256(lozinka, sol);
            if (hashUneseneLozinke !== korisnik.lozinkaHash) {
                await this.kdao.povecajBrojNeuspjesnihPrijava(korisnik.id);
                // provjeri limit 3
                const korisnikPoId = await this.kdao.dajKorisnikaPoId(korisnik.id);
                const noviBroj = (korisnikPoId?.blokiran || 0) + 1;
                if (noviBroj >= 3) {
                    await this.kdao.postaviBlokiran(korisnik.id, true);
                    odgovor.status(403).json({ greska: "Račun je blokiran nakon 3 neuspješne prijave" });
                    return;
                }
                odgovor.status(401).json({ greska: "Pogrešno korisničko ime ili lozinka" });
                return;
            }
            // Uspješna prijava - postavi sesiju
            zahtjev.session.korisnik = {
                id: korisnik.id,
                korisnickoIme: korisnik.korisnickoIme,
                email: korisnik.email,
                uloga: korisnik.uloga,
                ime: korisnik.ime || "",
                prezime: korisnik.prezime || ""
            };
            // Reset broja neuspješnih prijava
            await this.kdao.resetirajBrojNeuspjesnihPrijava(korisnik.id);
            odgovor.json({
                poruka: "Uspješno ste prijavljeni",
                korisnik: zahtjev.session.korisnik
            });
        }
        catch (err) {
            odgovor.status(500).json({ greska: err.message });
        }
    }
    //Odjava korisnika
    async logout(zahtjev, odgovor) {
        odgovor.type("application/json");
        zahtjev.session.destroy((err) => {
            if (err) {
                odgovor.status(500).json({ greska: "Greška pri odjavi" });
            }
            else {
                odgovor.clearCookie('connect.sid');
                odgovor.json({ poruka: "Uspješno ste odjavljeni" });
            }
        });
    }
    /**
     * POST /register - Registracija novog korisnika
     * Body: { korisnickoIme: string, lozinka: string, email: string, ime?: string, prezime?: string }
     */
    async register(zahtjev, odgovor) {
        odgovor.type("application/json");
        const { korisnickoIme, lozinka, email, ime, prezime } = zahtjev.body;
        // Validacija
        if (!korisnickoIme || !lozinka || !email) {
            odgovor.status(400).json({
                greska: "Korisničko ime, lozinka i email su obavezni"
            });
            return;
        }
        if (lozinka.length < 6) {
            odgovor.status(400).json({
                greska: "Lozinka mora imati najmanje 6 karaktera"
            });
            return;
        }
        try {
            // Provjeri postoji li korisnik sa tim korisničkim imenom
            const postojeciKorisnik = await this.kdao.dajKorisnikaPoKorisnickomImenu(korisnickoIme);
            if (postojeciKorisnik) {
                odgovor.status(409).json({
                    greska: "Korisničko ime je već zauzeto"
                });
                return;
            }
            // Generiraj sol i kreiraj hash
            const sol = generirajSolAut();
            const lozinkaHash = kreirajSHA256(lozinka, sol);
            // Kreiraj novog korisnika
            const noviKorisnik = {
                korisnickoIme,
                lozinkaHash,
                sol,
                email,
                uloga: "korisnik", // Novi korisnici su po defaultu "korisnik"
                blokiran: 0,
                ime: ime || null,
                prezime: prezime || null,
                datumRegistracije: new Date().toLocaleDateString("de-DE") // dd.mm.yyyy format
            };
            await this.kdao.dodajKorisnika(noviKorisnik);
            odgovor.status(201).json({
                poruka: "Registracija uspješna, možete se sada prijaviti"
            });
        }
        catch (err) {
            odgovor.status(500).json({ greska: err.message });
        }
    }
    //GET /korisnik - Dohvati podatke trenutno prijavljenog korisnika
    async dajKorisnika(zahtjev, odgovor) {
        odgovor.type("application/json");
        if (!zahtjev.session || !zahtjev.session.korisnik) {
            odgovor.status(401).json({ greska: "Niste prijavljeni" });
            return;
        }
        odgovor.json(zahtjev.session.korisnik);
    }
    // =================== PAGE RENDERING ROUTES ===================
    //GET - Početna stranica
    prikazIndex(zahtjev, odgovor) {
        const html = this.ucitajHTML("src/aplikacija/html/index.html");
        odgovor.send(html);
    }
    //GET /prijava
    prikazPrijava(zahtjev, odgovor) {
        const html = this.ucitajHTML("src/aplikacija/html/prijava.html");
        odgovor.send(html);
    }
    //GET /registracija
    prikazRegistracija(zahtjev, odgovor) {
        const html = this.ucitajHTML("src/aplikacija/html/registracija.html");
        odgovor.send(html);
    }
    // GET /kolekcije
    prikazKolekcije(zahtjev, odgovor) {
        const html = this.ucitajHTML("src/aplikacija/html/kolekcije.html");
        odgovor.send(html);
    }
    // GET /sadrzaj
    prikazSadrzaj(zahtjev, odgovor) {
        const html = this.ucitajHTML("src/aplikacija/html/sadrzaj.html");
        odgovor.send(html);
    }
    // GET /moderator
    prikazModerator(zahtjev, odgovor) {
        const html = this.ucitajHTML("src/aplikacija/html/moderator.html");
        odgovor.send(html);
    }
    // GET /korisnici
    prikazKorisnici(zahtjev, odgovor) {
        const html = this.ucitajHTML("src/aplikacija/html/korisnici.html");
        odgovor.send(html);
    }
    // Registriraj sve rute
    pripremiRute(server) {
        // ===== JAVNE RUTE =====
        server.get("/", (req, res) => this.prikazIndex(req, res));
        server.get("/prijava", (req, res) => this.prikazPrijava(req, res));
        server.get("/registracija", (req, res) => this.prikazRegistracija(req, res));
        // ===== AUTENTIFIKACIJSKE RUTE =====
        server.post("/login", (req, res) => this.login(req, res));
        server.post("/register", (req, res) => this.register(req, res));
        server.post("/logout", (req, res) => this.logout(req, res));
        // ===== ZAŠTIĆENE RUTE - REGISTRIRANI KORISNICI =====
        server.get("/kolekcije", provjeriAutentikaciju, (req, res) => this.prikazKolekcije(req, res));
        server.get("/sadrzaj", provjeriAutentikaciju, (req, res) => this.prikazSadrzaj(req, res));
        server.get("/korisnik", provjeriAutentikaciju, (req, res) => this.dajKorisnika(req, res));
        // ===== ZAŠTIĆENE RUTE - MODERATOR =====
        server.get("/moderator", provjeriAutentikaciju, provjeriUlogu(["moderator", "admin"]), (req, res) => this.prikazModerator(req, res));
        // ===== ZAŠTIĆENE RUTE - ADMIN =====
        server.get("/korisnici", provjeriAutentikaciju, provjeriUlogu(["admin"]), (req, res) => this.prikazKorisnici(req, res));
    }
}
//# sourceMappingURL=aplikacijaRute.js.map