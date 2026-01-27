import Baza from "../zajednicko/sqliteBaza.js";
import KorisnikKolekcijaDAO from "../zajednicko/dao/korisnik_kolekcijaDAO.js";
export class RestKorisnikKolekcija {
    dao;
    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        db.spoji();
        this.dao = new KorisnikKolekcijaDAO(db);
    }
    // POST /api/korisnik-kolekcija
    async postVeza(req, res) {
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Niste prijavljeni" });
            return;
        }
        const { korisnikId, kolekcijaId } = req.body;
        if (!korisnikId || !kolekcijaId) {
            res.status(400).json({ greska: "Nedostaju podaci" });
            return;
        }
        const postoji = await this.dao.postojiVeza(korisnikId, kolekcijaId);
        if (postoji) {
            res.status(400).json({ greska: "Veza već postoji" });
            return;
        }
        await this.dao.dodajVezu({ korisnikId, kolekcijaId });
        res.status(201).json({ poruka: "Korisnik dodan u kolekciju" });
    }
    // DELETE /api/korisnik-kolekcija
    async deleteVeza(req, res) {
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Niste prijavljeni" });
            return;
        }
        const { korisnikId, kolekcijaId } = req.body;
        if (!korisnikId || !kolekcijaId) {
            res.status(400).json({ greska: "Nedostaju podaci" });
            return;
        }
        await this.dao.obrisiVezu(korisnikId, kolekcijaId);
        res.json({ poruka: "Korisnik uklonjen iz kolekcije" });
    }
    // GET /api/korisnik-kolekcija/korisnik/:id
    async getKolekcijeZaKorisnika(req, res) {
        const korisnikId = Number(req.params["id"]);
        const podaci = await this.dao.dajSveKolekcijeZaKorisnika(korisnikId);
        res.json(podaci);
    }
    // GET /api/korisnik-kolekcija/kolekcija/:id
    async getKorisniciZaKolekciju(req, res) {
        const kolekcijaId = Number(req.params["id"]);
        const podaci = await this.dao.dajSveKorisnikeZaKolekciju(kolekcijaId);
        res.json(podaci);
    }
}
//# sourceMappingURL=restKolekcija_korisnik.js.map