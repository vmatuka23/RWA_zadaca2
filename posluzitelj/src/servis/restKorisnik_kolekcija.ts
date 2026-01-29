import { Request, Response } from "express";
import Baza from "../zajednicko/sqliteBaza.js";
import KorisnikKolekcijaDAO from "../zajednicko/dao/korisnik_kolekcijaDAO.js";
import KorisnikDAO from "../zajednicko/dao/korisnikDAO.js";
import KolekcijaDAO from "../zajednicko/dao/kolekcijaDAO.js";

export class RestKorisnikKolekcija {
    private dao: KorisnikKolekcijaDAO;
    private korisnikDao: KorisnikDAO;
    private kolekcijaDao: KolekcijaDAO;

    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        db.spoji();
        this.dao = new KorisnikKolekcijaDAO(db);
        this.korisnikDao = new KorisnikDAO(db);
        this.kolekcijaDao = new KolekcijaDAO(db);
    }

    // POST /api/korisnik-kolekcija
    // Uloga: moderator, admin
    async postVeza(req: Request, res: Response) {
        res.type("application/json");
        
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da dodate vezu" });
            return;
        }

        const uloga = req.session.korisnik.uloga;

        if (uloga !== "moderator" && uloga !== "admin") {
            res.status(403).json({ greska: "Morate biti moderator ili admin da dodelite korisnika kolekciji" });
            return;
        }

        const { korisnikId, kolekcijaId } = req.body;

        if (!korisnikId || !kolekcijaId) {
            res.status(400).json({ greska: "Nedostaju korisnikId i kolekcijaId" });
            return;
        }

        try {
            // Provjeri da korisnik i kolekcija postoje
            const korisnik = await this.korisnikDao.dajKorisnikaPoId(korisnikId);
            if (!korisnik) {
                res.status(404).json({ greska: "Korisnik ne postoji" });
                return;
            }

            const kolekcija = await this.kolekcijaDao.dajKolekcijuPoId(kolekcijaId);
            if (!kolekcija) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }

            const postoji = await this.dao.postojiVeza(korisnikId, kolekcijaId);
            if (postoji) {
                res.status(400).json({ greska: "Korisnik je već dodan u kolekciju" });
                return;
            }

            await this.dao.dodajVezu({ korisnikId, kolekcijaId });
            res.status(201).json({ status: "uspjeh", poruka: "Korisnik dodan u kolekciju" });
        } catch (err: any) {
            res.status(500).json({ greska: err.message });
        }
    }

    // DELETE /api/korisnik-kolekcija
    // Uloga: moderator, admin
    async deleteVeza(req: Request, res: Response) {
        res.type("application/json");
        
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da izbrišete vezu" });
            return;
        }

        const uloga = req.session.korisnik.uloga;

        if (uloga !== "moderator" && uloga !== "admin") {
            res.status(403).json({ greska: "Morate biti moderator ili admin da uklonite korisnika iz kolekcije" });
            return;
        }

        const { korisnikId, kolekcijaId } = req.body;

        if (!korisnikId || !kolekcijaId) {
            res.status(400).json({ greska: "Nedostaju korisnikId i kolekcijaId" });
            return;
        }

        try {
            const postoji = await this.dao.postojiVeza(korisnikId, kolekcijaId);
            if (!postoji) {
                res.status(404).json({ greska: "Veza između korisnika i kolekcije ne postoji" });
                return;
            }

            await this.dao.obrisiVezu(korisnikId, kolekcijaId);
            res.status(200).json({ status: "uspjeh", poruka: "Korisnik uklonjen iz kolekcije" });
        } catch (err: any) {
            res.status(500).json({ greska: err.message });
        }
    }

    // GET /api/korisnik-kolekcija/korisnik/:id
    async getKolekcijeZaKorisnika(req: Request, res: Response) {
        res.type("application/json");
        
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni" });
            return;
        }

        const uloga = req.session.korisnik.uloga;

        if (uloga !== "moderator" && uloga !== "admin") {
            res.status(403).json({ greska: "Nemate pravo pristupa" });
            return;
        }

        try {
            const korisnikId = Number(req.params["id"]);
            const podaci = await this.dao.dajSveKolekcijeZaKorisnika(korisnikId);
            res.json(podaci);
        } catch (err: any) {
            res.status(500).json({ greska: err.message });
        }
    }

    // GET /api/korisnik-kolekcija/kolekcija/:id
    async getKorisniciZaKolekciju(req: Request, res: Response) {
        res.type("application/json");
        
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni" });
            return;
        }

        const uloga = req.session.korisnik.uloga;

        if (uloga !== "moderator" && uloga !== "admin") {
            res.status(403).json({ greska: "Nemate pravo pristupa" });
            return;
        }

        try {
            const kolekcijaId = Number(req.params["id"]);
            const podaci = await this.dao.dajSveKorisnikeZaKolekciju(kolekcijaId);
            res.json(podaci);
        } catch (err: any) {
            res.status(500).json({ greska: err.message });
        }
    }
}
