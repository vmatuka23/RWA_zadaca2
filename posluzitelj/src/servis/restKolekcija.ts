import { Request, Response } from "express";
import Baza from "../zajednicko/sqliteBaza.js";
import KolekcijaDAO, { Kolekcija } from "../zajednicko/dao/kolekcijaDAO.js";
import KorisnikKolekcijaDAO from "../zajednicko/dao/korisnik_kolekcijaDAO.js";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";

export class RestKolekcija {
  private kdao: KolekcijaDAO;
  private korisnikKolekcijaDao: KorisnikKolekcijaDAO;
  private konf: Konfiguracija;

  constructor(konf: Konfiguracija) {
    const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
    db.spoji();
    this.kdao = new KolekcijaDAO(db);
    this.korisnikKolekcijaDao = new KorisnikKolekcijaDAO(db);
    this.konf = konf;
  }

  async getKolekcije(req: Request, res: Response) {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;
    const korisnikId = req.session?.korisnik?.id;
    const page = parseInt(req.query['page'] as string) || 1;
    const all = req.query['all'] === 'true';
    const PAGE_LIMIT = parseInt(this.konf.dajKonf().stranicaLimit);
    const offset = (page - 1) * PAGE_LIMIT;

    try {
      if (uloga !== "korisnik" && uloga !== "moderator" && uloga !== "admin") {
        res.status(401).json({ greska: "Morate biti prijavljeni kao korisnik" });
        return;
      }

      let kolekcije: Kolekcija[];

      if (uloga === "korisnik") {
        kolekcije = await this.kdao.dajKolekcijeKorisnika(korisnikId!);
      } else {
        // moderator, admin
        kolekcije = await this.kdao.dajSveKolekcije();
      }

      // All preskace paginaciju, koristi se za drop down
      if (all) {
        res.json({
          kolekcije: kolekcije,
          ukupno: kolekcije.length
        });
        return;
      }

      // Implementirana paginacija
      const paginatedKolekcije = kolekcije.slice(offset, offset + PAGE_LIMIT);
      
      res.json({
        kolekcije: paginatedKolekcije,
        strana: page,
        limitPoStranici: PAGE_LIMIT,
        ukupno: kolekcije.length
      });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  // GET /api/kolekcije/javne - Javne kolekcije (za goste)
  async getJavneKolekcije(req: Request, res: Response) {
    res.type("application/json");
    const page = parseInt(req.query['page'] as string) || 1;
    const PAGE_LIMIT = parseInt(this.konf.dajKonf().stranicaLimit);
    const offset = (page - 1) * PAGE_LIMIT;

    try {
      const javneKolekcije = await this.kdao.dajJavneKolekcije();
      const paginatedKolekcije = javneKolekcije.slice(offset, offset + PAGE_LIMIT);
      
      res.json({
        kolekcije: paginatedKolekcije,
        strana: page,
        limitPoStranici: PAGE_LIMIT,
        ukupno: javneKolekcije.length
      });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }
  async getKolekcijaPoId(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const id = Number(req.params["id"]);
    const uloga = req.session?.korisnik?.uloga;
    const korisnikId = req.session?.korisnik?.id;

    try {
      const row = await this.kdao.dajKolekcijuPoId(id);
      if (!row) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      // gledanje po ulogama
      if (uloga === "gost") {
        if (row.javno !== 1) {
          res.status(403).json({ greska: "Nemate pravo pristupa" });
          return;
        }
      } else if (uloga === "korisnik") {
        const isOwner = await this.kdao.jeVlasnikKolekcije(id, korisnikId!);
        if (row.javno !== 1 && !isOwner) {
          res.status(403).json({ greska: "Nemate pravo pristupa" });
          return;
        }
      } else if (uloga !== "moderator" && uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo pristupa" });
        return;
      }

      res.json(row);
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async postKolekcija(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    
    if (!req.session?.korisnik) {
      res.status(401).json({ greska: "Morate biti prijavljeni da kreirate kolekciju" });
      return;
    }

    const uloga = req.session.korisnik.uloga;

    if (uloga !== "moderator" && uloga !== "admin") {
      res.status(403).json({ greska: "Morate biti moderator ili admin da kreirate kolekciju" });
      return;
    }

    const { naziv, opis, istaknutaSlika, javno } = req.body as Kolekcija;
    const korisnikId = req.session.korisnik.id;

    if (!naziv) {
      res.status(400).json({ greska: "Naziv je obavezan" });
      return;
    }

    try {
      const novaKolekcija: Kolekcija = {
        naziv,
        opis: opis || "",
        istaknutaSlika: istaknutaSlika || "",
        javno: javno ? 1 : 0
      };

      const poruka = await this.kdao.dodajKolekciju(novaKolekcija);
      
      // Automatski dodaj kreatora kao vlasnika u korisnik_kolekcija
      if ((poruka as any).id) {
        await this.kdao.dodajVlasnikaKolekciji((poruka as any).id, korisnikId);
      }

      res.status(201).json({ status: "uspjeh", kolekcijaId: (poruka as any).id });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async putKolekcija(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;
    
    if (!req.session?.korisnik) {
      res.status(401).json({ greska: "Morate biti prijavljeni da uredite kolekciju" });
      return;
    }

    const id = Number(req.params["id"]);
    const { naziv, opis, istaknutaSlika, javno } = req.body as Kolekcija;
    const korisnikId = req.session.korisnik.id;

    try {
      const row = await this.kdao.dajKolekcijuPoId(id);
      if (!row) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      // Provjeri je li korisnik vlasnik ili ima povišenu ulogu
      const isOwner = await this.kdao.jeVlasnikKolekcije(id, korisnikId);
      if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
        return;
      }

      const azuriranaKolekcija: Kolekcija = {
        id,
        naziv: naziv || row.naziv,
        opis: opis !== undefined ? opis : (row.opis || ""),
        istaknutaSlika: istaknutaSlika !== undefined ? istaknutaSlika : (row.istaknutaSlika || ""),
        javno: javno !== undefined ? (javno ? 1 : 0) : (row.javno ?? 0)
      };

      await this.kdao.azurirajKolekciju(azuriranaKolekcija);
      res.status(200).json({ status: "uspjeh", poruka: "Kolekcija uspješno ažurirana" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async deleteKolekcija(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;
    
    if (!req.session?.korisnik) {
      res.status(401).json({ greska: "Morate biti prijavljeni da izbrišete kolekciju" });
      return;
    }

    const id = Number(req.params["id"]);
    const korisnikId = req.session.korisnik.id;

    try {
      const row = await this.kdao.dajKolekcijuPoId(id);
      if (!row) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      const isOwner = await this.kdao.jeVlasnikKolekcije(id, korisnikId);
      if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo brisati ovu kolekciju" });
        return;
      }

      await this.kdao.obrisiKolekciju(id);
      res.status(200).json({ status: "uspjeh", poruka: "Kolekcija obrisana" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async dodajMultimediju(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;

    if (!req.session?.korisnik) {
      res.status(401).json({ greska: "Morate biti prijavljeni da dodate multimediju" });
      return;
    }

    const kolekcijaId = Number(req.params["id"]);
    const { multimedijaId } = req.body;
    const korisnikId = req.session.korisnik.id;

    if (!multimedijaId) {
      res.status(400).json({ greska: "Nedostaje multimedijaId" });
      return;
    }

    try {
      const kolekcija = await this.kdao.dajKolekcijuPoId(kolekcijaId);
      if (!kolekcija) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      const isOwner = await this.kdao.jeVlasnikKolekcije(kolekcijaId, korisnikId);
      if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
        return;
      }

      await this.kdao.dodajMultimedijuKolekciji(kolekcijaId, multimedijaId);
      res.status(200).json({ status: "uspjeh", poruka: "Multimedija dodana u kolekciju" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async ukloniMultimediju(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;

    if (!req.session?.korisnik) {
      res.status(401).json({ greska: "Morate biti prijavljeni da uklonite multimediju" });
      return;
    }

    const kolekcijaId = Number(req.params["id"]);
    const multimedijaId = Number(req.params["multimedijaId"]);
    const korisnikId = req.session.korisnik.id;

    try {
      const kolekcija = await this.kdao.dajKolekcijuPoId(kolekcijaId);
      if (!kolekcija) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      const isOwner = await this.kdao.jeVlasnikKolekcije(kolekcijaId, korisnikId);
      if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
        return;
      }

      await this.kdao.ukloniMultimedijuIzKolekcije(kolekcijaId, multimedijaId);
      res.status(200).json({ status: "uspjeh", poruka: "Multimedija uklonjena iz kolekcije" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async dodajKorisnika(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;

    if (!req.session?.korisnik) {
      res.status(401).json({ greska: "Morate biti prijavljeni" });
      return;
    }

    if (uloga !== "moderator" && uloga !== "admin") {
      res.status(403).json({ greska: "Morate biti moderator ili admin da dodate korisnika u kolekciju" });
      return;
    }

    const kolekcijaId = Number(req.params["id"]);
    const { korisnikId } = req.body;

    if (!korisnikId) {
      res.status(400).json({ greska: "Nedostaje korisnikId" });
      return;
    }

    try {
      const kolekcija = await this.kdao.dajKolekcijuPoId(kolekcijaId);
      if (!kolekcija) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      const postoji = await this.korisnikKolekcijaDao.postojiVeza(korisnikId, kolekcijaId);
      if (postoji) {
        res.status(400).json({ greska: "Korisnik je već dodan u kolekciju" });
        return;
      }

      await this.korisnikKolekcijaDao.dodajVezu({ korisnikId, kolekcijaId });
      res.status(201).json({ status: "uspjeh", poruka: "Korisnik dodan u kolekciju" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async ukloniKorisnika(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;

    if (!req.session?.korisnik) {
      res.status(401).json({ greska: "Morate biti prijavljeni" });
      return;
    }

    if (uloga !== "moderator" && uloga !== "admin") {
      res.status(403).json({ greska: "Morate biti moderator ili admin da uklonite korisnika iz kolekcije" });
      return;
    }

    const kolekcijaId = Number(req.params["id"]);
    const korisnikId = Number(req.params["korisnikId"]);

    try {
      const kolekcija = await this.kdao.dajKolekcijuPoId(kolekcijaId);
      if (!kolekcija) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      const postoji = await this.korisnikKolekcijaDao.postojiVeza(korisnikId, kolekcijaId);
      if (!postoji) {
        res.status(404).json({ greska: "Veza između korisnika i kolekcije ne postoji" });
        return;
      }

      await this.korisnikKolekcijaDao.obrisiVezu(korisnikId, kolekcijaId);
      res.status(200).json({ status: "uspjeh", poruka: "Korisnik uklonjen iz kolekcije" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }
}
