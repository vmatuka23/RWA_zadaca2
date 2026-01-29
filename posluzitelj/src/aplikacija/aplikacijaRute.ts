import { Request, Response, Application } from "express";
import { provjeriAutentikaciju, generirajSol as generirajSolAut, provjeriUlogu } from "../servis/autentikacija.js";
import Baza from "../zajednicko/sqliteBaza.js";
import KorisnikDAO, { Korisnik } from "../zajednicko/dao/korisnikDAO.js";
import { kreirajSHA256 } from "../zajednicko/kodovi.js";
import { readFileSync } from "fs";
import { resolve } from "path";

export class AplikacijaRute {
    private kdao: KorisnikDAO;

    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        db.spoji();
        this.kdao = new KorisnikDAO(db);
    }

    //Učitaj HTML datoteku sa putanje
    private ucitajHTML(putanja: string): string {
        try {
            return readFileSync(resolve(putanja), 'utf-8');
        } catch (err) {
            return "<h1>Greška 404 - Stranica nije pronađena</h1>";
        }
    }

    /**
     * POST /login - Prijava korisnika
     * Body: { korisnickoIme: string, lozinka: string }
     */
    private async login(zahtjev: Request, odgovor: Response): Promise<void> {
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

            if ((korisnik as any).blokiran) {
                odgovor.status(403).json({ greska: "Račun je blokiran" });
                return;
            }

            // hash iz baze: koristi kreirajSHA256 sa soli
            const sol = korisnik.sol as string;
            const hashUneseneLozinke = kreirajSHA256(lozinka, sol);

            if (hashUneseneLozinke !== korisnik.lozinkaHash) {
                await this.kdao.povecajBrojNeuspjesnihPrijava(korisnik.id!);

                // provjeri limit 3
                const korisnikPoId = await this.kdao.dajKorisnikaPoId(korisnik.id!);
                const noviBroj = ((korisnikPoId?.blokiran || 0) as number) + 1;
                if (noviBroj >= 3) {
                    await this.kdao.postaviBlokiran(korisnik.id!, true);
                    odgovor.status(403).json({ greska: "Račun je blokiran nakon 3 neuspješne prijave" });
                    return;
                }

                odgovor.status(401).json({ greska: "Pogrešno korisničko ime ili lozinka" });
                return;
            }

            // Uspješna prijava - postavi sesiju
            zahtjev.session.korisnik = {
                id: korisnik.id!,
                korisnickoIme: korisnik.korisnickoIme,
                email: korisnik.email,
                uloga: korisnik.uloga,
                ime: korisnik.ime || "",
                prezime: korisnik.prezime || ""
            };

            // Reset broja neuspješnih prijava
            await this.kdao.resetirajBrojNeuspjesnihPrijava(korisnik.id!);

            odgovor.json({
                poruka: "Uspješno ste prijavljeni",
                korisnik: zahtjev.session.korisnik
            });
        } catch (err: any) {
            odgovor.status(500).json({ greska: err.message });
        }
    }

    //Odjava korisnika
    private async logout(zahtjev: Request, odgovor: Response): Promise<void> {
        odgovor.type("application/json");

        zahtjev.session.destroy((err) => {
            if (err) {
                odgovor.status(500).json({ greska: "Greška pri odjavi" });
            } else {
                odgovor.clearCookie('connect.sid');
                odgovor.json({ poruka: "Uspješno ste odjavljeni" });
            }
        });
    }

    /**
     * POST /register - Registracija novog korisnika
     * Body: { korisnickoIme: string, lozinka: string, email: string, ime?: string, prezime?: string }
     */
    private async register(zahtjev: Request, odgovor: Response): Promise<void> {
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
            const noviKorisnik: Korisnik = {
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
        } catch (err: any) {
            odgovor.status(500).json({ greska: err.message });
        }
    }

    //GET /korisnik - Dohvati podatke trenutno prijavljenog korisnika
    private async dajKorisnika(zahtjev: Request, odgovor: Response): Promise<void> {
        odgovor.type("application/json");

        if (!zahtjev.session || !zahtjev.session.korisnik) {
            odgovor.status(401).json({ greska: "Niste prijavljeni" });
            return;
        }

        odgovor.json(zahtjev.session.korisnik);
    }

    // =================== PAGE RENDERING ROUTES ===================

    //GET - Početna stranica
    private prikazIndex(zahtjev: Request, odgovor: Response): void {
        const html = this.ucitajHTML("src/aplikacija/html/index.html");
        odgovor.send(html);
    }

    //GET /prijava
    private prikazPrijava(zahtjev: Request, odgovor: Response): void {
        const html = this.ucitajHTML("src/aplikacija/html/prijava.html");
        odgovor.send(html);
    }

    //GET /registracija
    private prikazRegistracija(zahtjev: Request, odgovor: Response): void {
        const html = this.ucitajHTML("src/aplikacija/html/registracija.html");
        odgovor.send(html);
    }

    // GET /kolekcije
    private prikazKolekcije(zahtjev: Request, odgovor: Response): void {
        const html = this.ucitajHTML("src/aplikacija/html/kolekcije.html");
        odgovor.send(html);
    }

    // GET /sadrzaj
    private prikazSadrzaj(zahtjev: Request, odgovor: Response): void {
        const html = this.ucitajHTML("src/aplikacija/html/sadrzaj.html");
        odgovor.send(html);
    }

    // GET /moderator
    private prikazModerator(zahtjev: Request, odgovor: Response): void {
        const html = this.ucitajHTML("src/aplikacija/html/moderator.html");
        odgovor.send(html);
    }

    // GET /korisnici
    private prikazKorisnici(zahtjev: Request, odgovor: Response): void {
        const html = this.ucitajHTML("src/aplikacija/html/korisnici.html");
        odgovor.send(html);
    }

    // Registriraj sve rute
    public pripremiRute(server: Application): void {
        // ===== JAVNE RUTE =====
        server.get("/", (req: Request, res: Response) => this.prikazIndex(req, res));
        server.get("/prijava", (req: Request, res: Response) => this.prikazPrijava(req, res));
        server.get("/registracija", (req: Request, res: Response) => this.prikazRegistracija(req, res));

        // ===== AUTENTIFIKACIJSKE RUTE =====
        server.post("/login", (req: Request, res: Response) => this.login(req, res));
        server.post("/register", (req: Request, res: Response) => this.register(req, res));
        server.post("/logout", (req: Request, res: Response) => this.logout(req, res));

        // ===== ZAŠTIĆENE RUTE - REGISTRIRANI KORISNICI =====
        server.get("/kolekcije", provjeriAutentikaciju, (req: Request, res: Response) => this.prikazKolekcije(req, res));
        server.get("/sadrzaj", provjeriAutentikaciju, (req: Request, res: Response) => this.prikazSadrzaj(req, res));
        server.get("/korisnik", provjeriAutentikaciju, (req: Request, res: Response) => this.dajKorisnika(req, res));

        // ===== ZAŠTIĆENE RUTE - MODERATOR =====
        server.get("/moderator", provjeriAutentikaciju, provjeriUlogu(["moderator", "admin"]), (req: Request, res: Response) => this.prikazModerator(req, res));

        // ===== ZAŠTIĆENE RUTE - ADMIN =====
        server.get("/korisnici", provjeriAutentikaciju, provjeriUlogu(["admin"]), (req: Request, res: Response) => this.prikazKorisnici(req, res));
    }
}


