import { Request, Response } from "express";
import Baza from "../zajednicko/sqliteBaza.js";
import KolekcijaDAO, { Kolekcija } from "../zajednicko/dao/kolekcijaDAO.js";

export class RestKolekcija {
  private kdao: KolekcijaDAO;

  constructor() {
    const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
    db.spoji();
    this.kdao = new KolekcijaDAO(db);
  }

  async getKolekcije(req: Request, res: Response) {
    res.type("application/json");
    const uloga = req.session?.korisnik?.uloga;
    const korisnikId = req.session?.korisnik?.id;

    try {
      let kolekcije: Kolekcija[];

      if (uloga === "gost") {
        kolekcije = await this.kdao.dajJavneKolekcije();
      } else if (uloga === "korisnik") {
        kolekcije = await this.kdao.dajKolekcijeKorisnika(korisnikId!);
      } else {
        kolekcije = await this.kdao.dajSveKolekcije();
      }

      res.send(JSON.stringify(kolekcije));
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

      if (
        (uloga === "gost" && row.javno !== 1) ||
        (uloga === "korisnik" && row.javno !== 1 && !(await this.kdao.jeVlasnikKolekcije(id, korisnikId!)))
      ) {
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

    const { naziv, opis, istaknutaSlika, javno } = req.body as Kolekcija;
    const korisnikId = req.session?.korisnik?.id;

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
      
      // Automatski dodaj vlasnika u korisnik_kolekcija
      if ((poruka as any).id) {
        await this.kdao.dodajVlasnikaKolekciji((poruka as any).id, korisnikId!);
      }

      res.status(201).json(poruka);
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async putKolekcija(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    if (!req.session?.korisnik) {
        res.status(401).json({ greska: "Morate biti prijavljeni da uredite kolekciju" });
        return;
    }
    const id = Number(req.params["id"]);
    const { naziv, opis, istaknutaSlika, javno } = req.body as Kolekcija;
    const korisnikId = req.session?.korisnik?.id;
    const uloga = req.session?.korisnik?.uloga;

    try {
      const row = await this.kdao.dajKolekcijuPoId(id);
      if (!row) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      if (!(await this.kdao.jeVlasnikKolekcije(id, korisnikId!)) && uloga !== "moderator" && uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
        return;
      }

      const azuriranaKolekcija: Kolekcija = {
        id,
        naziv: naziv || row.naziv,
        opis: opis || row.opis || "",
        istaknutaSlika: istaknutaSlika || row.istaknutaSlika || "",
        javno: javno != null ? (javno ? 1 : 0) : (row.javno ?? 0)
      };

      await this.kdao.azurirajKolekciju(azuriranaKolekcija);
      res.json({ poruka: "Kolekcija uspješno ažurirana" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async deleteKolekcija(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    if (!req.session?.korisnik) {
        res.status(401).json({ greska: "Morate biti prijavljeni da izbrišete kolekciju" });
        return;
    }
    const id = Number(req.params["id"]);
    const korisnikId = req.session?.korisnik?.id;
    const uloga = req.session?.korisnik?.uloga;

    try {
      const row = await this.kdao.dajKolekcijuPoId(id);
      if (!row) {
        res.status(404).json({ greska: "Kolekcija ne postoji" });
        return;
      }

      if (!(await this.kdao.jeVlasnikKolekcije(id, korisnikId!)) && uloga !== "moderator" && uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo brisati ovu kolekciju" });
        return;
      }

      await this.kdao.obrisiKolekciju(id);
      res.json({ poruka: "Kolekcija obrisana" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async dodajMultimediju(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const kolekcijaId = Number(req.params["id"]);
    const { multimedijaId } = req.body;
    const korisnikId = req.session?.korisnik?.id;

    try {
      const vlasnik = await this.kdao.jeVlasnikKolekcije(kolekcijaId, korisnikId!);
      if (!vlasnik && req.session?.korisnik?.uloga !== "moderator" && req.session?.korisnik?.uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
        return;
      }

      await this.kdao.dodajMultimedijuKolekciji(kolekcijaId, multimedijaId);
      res.json({ poruka: "Multimedija dodana u kolekciju" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }

  async ukloniMultimediju(req: Request, res: Response): Promise<void> {
    res.type("application/json");
    const kolekcijaId = Number(req.params["id"]);
    const multimedijaId = Number(req.params["multimedijaId"]);
    const korisnikId = req.session?.korisnik?.id;

    try {
      const vlasnik = await this.kdao.jeVlasnikKolekcije(kolekcijaId, korisnikId!);
      if (!vlasnik && req.session?.korisnik?.uloga !== "moderator" && req.session?.korisnik?.uloga !== "admin") {
        res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
        return;
      }

      await this.kdao.ukloniMultimedijuIzKolekcije(kolekcijaId, multimedijaId);
      res.json({ poruka: "Multimedija uklonjena iz kolekcije" });
    } catch (err: any) {
      res.status(500).json({ greska: err.message });
    }
  }
}
