import { provjeriAutentikaciju, generirajSol as generirajSolAut } from "../servis/autentikacija.js";
import Baza from "../zajednicko/sqliteBaza.js";
import KorisnikDAO from "../zajednicko/dao/korisnikDAO.js";
import AktivacijskiTokenDAO from "../zajednicko/dao/aktivacijskiTokenDAO.js";
import { kreirajSHA256 } from "../zajednicko/kodovi.js";
import { emailServis } from "../servis/emailServis.js";
export class AplikacijaRute {
    kdao;
    atdao;
    db;
    constructor() {
        this.db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        this.db.spoji();
        this.kdao = new KorisnikDAO(this.db);
        this.atdao = new AktivacijskiTokenDAO(this.db);
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
            // Provjeri je li račun aktiviran putem emaila
            if (korisnik.aktiviran === 0) {
                odgovor.status(403).json({
                    greska: "Račun nije aktiviran. Provjerite svoj email za aktivacijski link.",
                    kod: "NEAKTIVIRAN"
                });
                return;
            }
            if (korisnik.blokiran) {
                odgovor.status(403).json({ greska: "Račun je blokiran" });
                return;
            }
            // hash iz baze: koristi kreirajSHA256 sa soli
            const sol = korisnik.sol;
            const hashUneseneLozinke = kreirajSHA256(lozinka, sol);
            console.log('Login attempt for:', korisnickoIme);
            console.log('Salt from DB:', sol);
            console.log('Computed hash:', hashUneseneLozinke);
            console.log('Stored hash:', korisnik.lozinkaHash);
            console.log('Match:', hashUneseneLozinke === korisnik.lozinkaHash);
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
            // Eksplicitno spremi sesiju prije slanja odgovora
            zahtjev.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    odgovor.status(500).json({ greska: "Greška pri spremanju sesije" });
                    return;
                }
                // Reset broja neuspješnih prijava
                this.kdao.resetirajBrojNeuspjesnihPrijava(korisnik.id);
                console.log('Login successful, session saved for:', korisnik.korisnickoIme);
                odgovor.json({
                    poruka: "Uspješno ste prijavljeni",
                    korisnik: zahtjev.session.korisnik
                });
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
                aktiviran: 0, // Novi korisnici nisu aktivirani dok ne potvrde email
                ime: ime || null,
                prezime: prezime || null,
                datumRegistracije: new Date().toLocaleDateString("de-DE") // dd.mm.yyyy format
            };
            await this.kdao.dodajKorisnika(noviKorisnik);
            // Dohvati upravo kreiranog korisnika da dobijemo ID
            const kreiraniKorisnik = await this.kdao.dajKorisnikaPoKorisnickomImenu(korisnickoIme);
            if (!kreiraniKorisnik || !kreiraniKorisnik.id) {
                odgovor.status(500).json({ greska: "Greška pri kreiranju korisnika" });
                return;
            }
            // Generiraj aktivacijski token
            const aktivacijskiTokenVrijednost = emailServis.generirajAktivacijskiToken();
            // Spremi token u bazu
            const aktivacijskiToken = {
                korisnikId: kreiraniKorisnik.id,
                token: aktivacijskiTokenVrijednost,
                datumKreiranja: emailServis.dajTrenutniDatum(),
                datumIsteka: emailServis.izracunajDatumIsteka(),
                iskoristen: 0
            };
            await this.atdao.dodajToken(aktivacijskiToken);
            // Pošalji aktivacijski email
            try {
                const previewUrl = await emailServis.posaljiAktivacijskiEmail(korisnickoIme, email, aktivacijskiTokenVrijednost);
                console.log("Aktivacijski email poslan za korisnika:", korisnickoIme);
                if (previewUrl) {
                    console.log("Preview URL:", previewUrl);
                }
            }
            catch (emailGreska) {
                console.error("Greška pri slanju aktivacijskog emaila:", emailGreska);
                // Ne prekidamo registraciju ako email ne uspije - admin može ručno aktivirati
            }
            odgovor.status(201).json({
                poruka: "Registracija uspješna! Provjerite svoj email za aktivacijski link."
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
    /**
     * GET /api/aktiviraj - Aktivacija korisničkog računa putem tokena iz emaila
     * Query: { token: string }
     */
    async aktivirajRacun(zahtjev, odgovor) {
        const token = zahtjev.query["token"];
        if (!token) {
            // Ako nema tokena, vrati HTML stranicu s greškom
            odgovor.type("text/html");
            odgovor.send(this.generirajAktivacijskuStranicu(false, "Nedostaje aktivacijski token. Provjerite link iz emaila."));
            return;
        }
        try {
            // Provjeri postoji li token u bazi
            const aktivacijskiToken = await this.atdao.dajTokenPoVrijednosti(token);
            if (!aktivacijskiToken) {
                odgovor.type("text/html");
                odgovor.send(this.generirajAktivacijskuStranicu(false, "Aktivacijski token nije pronađen. Možda je već iskorišten ili je neispravan."));
                return;
            }
            // Provjeri je li token već iskorišten
            if (aktivacijskiToken.iskoristen === 1) {
                odgovor.type("text/html");
                odgovor.send(this.generirajAktivacijskuStranicu(false, "Ovaj aktivacijski link je već iskorišten. Vaš račun bi trebao biti aktiviran."));
                return;
            }
            // Provjeri je li token istekao
            const datumIsteka = new Date(aktivacijskiToken.datumIsteka);
            const sada = new Date();
            if (sada > datumIsteka) {
                odgovor.type("text/html");
                odgovor.send(this.generirajAktivacijskuStranicu(false, "Aktivacijski link je istekao. Kontaktirajte administratora za novi link."));
                return;
            }
            // Dohvati korisnika
            const korisnik = await this.kdao.dajKorisnikaPoId(aktivacijskiToken.korisnikId);
            if (!korisnik) {
                odgovor.type("text/html");
                odgovor.send(this.generirajAktivacijskuStranicu(false, "Korisnički račun nije pronađen."));
                return;
            }
            // Aktiviraj korisnika
            await this.kdao.postaviAktiviran(korisnik.id, true);
            // Označi token kao iskorišten
            await this.atdao.oznaciTokenKaoIskoristen(aktivacijskiToken.id);
            console.log(`Korisnik ${korisnik.korisnickoIme} uspješno aktiviran`);
            // Vrati uspješnu HTML stranicu
            odgovor.type("text/html");
            odgovor.send(this.generirajAktivacijskuStranicu(true, `Vaš račun "${korisnik.korisnickoIme}" je uspješno aktiviran! Sada se možete prijaviti.`));
        }
        catch (err) {
            console.error("Greška pri aktivaciji računa:", err);
            odgovor.type("text/html");
            odgovor.send(this.generirajAktivacijskuStranicu(false, "Došlo je do greške pri aktivaciji. Pokušajte ponovno ili kontaktirajte administratora."));
        }
    }
    /**
     * Generira HTML stranicu za prikaz rezultata aktivacije
     * @param uspjeh - Je li aktivacija uspjela
     * @param poruka - Poruka za prikaz
     * @returns HTML string
     */
    generirajAktivacijskuStranicu(uspjeh, poruka) {
        const boja = uspjeh ? "#4CAF50" : "#f44336";
        const naslov = uspjeh ? "Aktivacija uspješna!" : "Greška pri aktivaciji";
        const ikona = uspjeh ? "✓" : "✗";
        return `
<!DOCTYPE html>
<html lang="hr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${naslov} - RWA Aplikacija</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        .ikona {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: ${boja};
            color: white;
            font-size: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        h1 {
            color: #333;
            margin-bottom: 16px;
            font-size: 24px;
        }
        .poruka {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .button {
            display: inline-block;
            background: #4a90d9;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: background 0.3s;
        }
        .button:hover {
            background: #357abd;
        }
        .footer {
            margin-top: 24px;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="ikona">${ikona}</div>
        <h1>${naslov}</h1>
        <p class="poruka">${poruka}</p>
        <a href="/" class="button">Idi na prijavu</a>
        <p class="footer">© 2026 RWA Aplikacija</p>
    </div>
</body>
</html>
        `;
    }
    /**
     * POST /api/ponovo-posalji-aktivaciju - Ponovno slanje aktivacijskog emaila
     * Body: { email: string }
     */
    async ponovoPosaljiAktivaciju(zahtjev, odgovor) {
        odgovor.type("application/json");
        const { email } = zahtjev.body;
        if (!email) {
            odgovor.status(400).json({ greska: "Email adresa je obavezna" });
            return;
        }
        try {
            // Pronađi korisnika po emailu
            const korisnik = await this.kdao.dajKorisnikaPoEmailu(email);
            if (!korisnik) {
                // Iz sigurnosnih razloga ne otkrivamo postoji li email
                odgovor.json({
                    poruka: "Ako račun s tom email adresom postoji, aktivacijski link će biti poslan."
                });
                return;
            }
            // Provjeri je li već aktiviran
            if (korisnik.aktiviran === 1) {
                odgovor.json({
                    poruka: "Račun je već aktiviran. Možete se prijaviti."
                });
                return;
            }
            // Obriši stare tokene za ovog korisnika
            await this.atdao.obrisiTokeneZaKorisnika(korisnik.id);
            // Generiraj novi aktivacijski token
            const aktivacijskiTokenVrijednost = emailServis.generirajAktivacijskiToken();
            // Spremi novi token
            const aktivacijskiToken = {
                korisnikId: korisnik.id,
                token: aktivacijskiTokenVrijednost,
                datumKreiranja: emailServis.dajTrenutniDatum(),
                datumIsteka: emailServis.izracunajDatumIsteka(),
                iskoristen: 0
            };
            await this.atdao.dodajToken(aktivacijskiToken);
            // Pošalji aktivacijski email
            await emailServis.posaljiAktivacijskiEmail(korisnik.korisnickoIme, korisnik.email, aktivacijskiTokenVrijednost);
            console.log("Ponovno poslan aktivacijski email za:", korisnik.korisnickoIme);
            odgovor.json({
                poruka: "Aktivacijski link je poslan na vašu email adresu."
            });
        }
        catch (err) {
            console.error("Greška pri ponovnom slanju aktivacije:", err);
            odgovor.status(500).json({ greska: "Greška pri slanju emaila" });
        }
    }
    // Registriraj sve API rute
    pripremiRute(server) {
        // ===== AUTENTIFIKACIJSKE API RUTE =====
        server.post("/api/login", (req, res) => this.login(req, res));
        server.post("/api/register", (req, res) => this.register(req, res));
        server.post("/api/logout", (req, res) => this.logout(req, res));
        // ===== AKTIVACIJA RAČUNA =====
        server.get("/api/aktiviraj", (req, res) => this.aktivirajRacun(req, res));
        server.post("/api/ponovo-posalji-aktivaciju", (req, res) => this.ponovoPosaljiAktivaciju(req, res));
        // ===== KORISNIK INFO =====
        server.get("/api/korisnik", provjeriAutentikaciju, (req, res) => this.dajKorisnika(req, res));
    }
}
//# sourceMappingURL=aplikacijaRute.js.map