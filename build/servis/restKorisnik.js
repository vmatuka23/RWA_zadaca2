import Baza from "../zajednicko/sqliteBaza.js";
import KorisnikDAO from "../zajednicko/dao/korisnikDAO.js";
import { Validacija } from "../zajednicko/validacija.js";
import { kreirajSHA256 } from "../zajednicko/kodovi.js";
export class RestKorisnik {
    kdao;
    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite"); // ili tvoja baza
        db.spoji();
        this.kdao = new KorisnikDAO(db);
    }
    async getKorisnici(zahtjev, odgovor) {
        odgovor.type("application/json");
        const korisnici = await this.kdao.dajSveKorisnike();
        odgovor.send(JSON.stringify(korisnici));
    }
    async postKorisnici(zahtjev, odgovor) {
        odgovor.type("application/json");
        let podaci = zahtjev.body;
        let poruka = await this.kdao.dodajKorisnika(podaci);
        odgovor.send(JSON.stringify(poruka));
    }
    ;
    deleteKorisnici(zahtjev, odgovor) {
        odgovor.type("application/json");
        odgovor.status(501);
        let poruka = { greska: "metoda nije implementirana" };
        odgovor.send(JSON.stringify(poruka));
    }
    ;
    putKorisnici(zahtjev, odgovor) {
        odgovor.type("application/json");
        odgovor.status(501);
        let poruka = { greska: "metoda nije implementirana" };
        odgovor.send(JSON.stringify(poruka));
    }
    ;
    async getKorisnik(zahtjev, odgovor) {
        odgovor.type("application/json");
        let korime = zahtjev.params["korime"];
        if (korime == undefined) {
            odgovor.send({ greska: "Nepostojeće korime" });
            return;
        }
        let korisnik = await this.kdao.dajKorisnikaPoKorisnickomImenu(korime);
        console.log(korisnik);
        odgovor.send(JSON.stringify(korisnik));
    }
    ;
    getKorisnikPrijava(zahtjev, odgovor) {
        odgovor.type("application/json");
        let korime = zahtjev.params["korime"];
        if (!korime || !Validacija.korisnickoIme(korime)) {
            odgovor.status(400).json({ greska: "Neispravno korisničko ime." });
            return;
        }
        if (!Validacija.lozinka(zahtjev.body.lozinka)) {
            odgovor.status(400).json({
                greska: "Lozinka mora imati najmanje 6 znakova, 1 slovo i 1 broj."
            });
            return;
        }
        this.kdao.dajKorisnikaPoKorisnickomImenu(korime).then(async (korisnik) => {
            if (korisnik == null) {
                odgovor.status(401).json({ greska: "Krivi podaci!" });
                return;
            }
            // provjeri je li korisnik blokiran
            if (korisnik.blokiran) {
                odgovor.status(403).json({ greska: "Račun je blokiran" });
                return;
            }
            // hash iz baze: koristi kreirajSHA256 sa solju
            const sol = korisnik.sol;
            const hashUneseneLozinke = kreirajSHA256(zahtjev.body.lozinka, sol);
            if (hashUneseneLozinke !== korisnik.lozinkaHash) {
                // pogrešna lozinka
                await this.kdao.povecajBrojNeuspjesnihPrijava(korisnik.id);
                // provjeri je li dostignut limit 3
                const korisnikPoId = await this.kdao.dajKorisnikaPoId(korisnik.id);
                const noviBroj = (korisnikPoId?.blokiran || 0) + 1;
                if (noviBroj >= 3) {
                    await this.kdao.postaviBlokiran(korisnik.id, true);
                    odgovor.status(403).json({ greska: "Račun je blokiran nakon 3 neuspješne prijave" });
                    return;
                }
                odgovor.status(401).json({ greska: "Krivi podaci!" });
                return;
            }
            await this.kdao.resetirajBrojNeuspjesnihPrijava(korisnik.id);
            // SPREMANJE SESIJE
            let sesijaKorisnik = {
                id: korisnik.id,
                korime: korisnik.korisnickoIme,
                uloga: korisnik.uloga || "korisnik"
            };
            zahtjev.session.korisnik = sesijaKorisnik;
            odgovor.status(200).json({
                poruka: "Prijava uspješna",
                korisnik: {
                    korisnickoIme: sesijaKorisnik.korime,
                    uloga: sesijaKorisnik.uloga
                }
            });
        });
    }
    ;
    postKorisnik(zahtjev, odgovor) {
        odgovor.type("application/json");
        odgovor.status(405);
        let poruka = { greska: "metoda nije dopuštena" };
        odgovor.send(JSON.stringify(poruka));
    }
    ;
    async deleteKorisnik(zahtjev, odgovor) {
        odgovor.type("application/json");
        let korime = zahtjev.params["korime"];
        if (zahtjev.params["korime"] != undefined) {
            const korisnik = await this.kdao.dajKorisnikaPoKorisnickomImenu(korime);
            if (korisnik && korisnik.id) {
                await this.kdao.obrisiKorisnika(korisnik.id);
                let poruka = { ok: "obrisan" };
                odgovor.send(JSON.stringify(poruka));
                return;
            }
        }
        odgovor.status(400);
        let poruka = { greska: "Nedostaje podatak" };
        odgovor.send(JSON.stringify(poruka));
    }
    ;
    async putKorisnik(zahtjev, odgovor) {
        odgovor.type("application/json");
        let korime = zahtjev.params["korime"];
        if (korime == undefined) {
            odgovor.status(401);
            odgovor.send(JSON.stringify({ greska: "Krivi podaci!" }));
            return;
        }
        const korisnik = await this.kdao.dajKorisnikaPoKorisnickomImenu(korime);
        if (korisnik && korisnik.id) {
            const podaci = { ...korisnik, ...zahtjev.body };
            let poruka = await this.kdao.azurirajKorisnika(podaci);
            odgovor.send(JSON.stringify(poruka));
        }
        else {
            odgovor.status(404);
            odgovor.send(JSON.stringify({ greska: "Korisnik nije pronađen" }));
        }
    }
    ;
}
//# sourceMappingURL=restKorisnik.js.map