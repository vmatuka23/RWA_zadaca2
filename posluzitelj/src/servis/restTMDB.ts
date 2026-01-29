import { FilmoviTmdbI, ZanrTmdbI } from "../servisI/tmdbI.js";
import { dajNasumceBroj } from "../zajednicko/kodovi.js";
import { Request, Response } from "express";
import { TMDBklijent } from "./klijentTMDB.js";

export class RestTMDB {
  private tmdbKlijent:TMDBklijent;

  constructor(api_kljuc: string) {
    this.tmdbKlijent = new TMDBklijent(api_kljuc);
    console.log(api_kljuc);

    //this.tmdbKlijent.dohvatiFilm(500).then(console.log).catch(console.log);
  }

  getZanr(zahtjev: Request, odgovor: Response) {
    console.log(this);
    this.tmdbKlijent
      .dohvatiZanrove()
      .then((zanrovi:Array<ZanrTmdbI>) => {
        //console.log(zanrovi);
        odgovor.type("application/json");
        odgovor.json(zanrovi);
      })
      .catch((greska) => {
        odgovor.json(greska);
      });
  }

  getFilmovi(zahtjev: Request, odgovor: Response) {
    console.log(this);
    odgovor.type("application/json");

    let stranica = zahtjev.query["stranica"];
    let trazi = zahtjev.query["trazi"];

    if (
      stranica == null ||
      trazi == null ||
      typeof stranica != "string" ||
      typeof trazi != "string"
    ) {
      odgovor.status(417);
      odgovor.send({ greska: "neocekivani podaci" });
      return;
    }

    this.tmdbKlijent
      .pretraziFilmovePoNazivu(trazi, parseInt(stranica))
      .then((filmovi:FilmoviTmdbI) => {
        //console.log(filmovi);
        odgovor.send(filmovi);
      })
      .catch((greska) => {
        odgovor.json(greska);
      });
  }

  async dohvatiNasumceFilm(zahtjev: Request, odgovor: Response) {
    let zanr = zahtjev.query['zanr'] ?? "";
    if(typeof zanr == "string"){
    this.tmdbKlijent
      .pretraziFilmovePoNazivu(zanr, 1)
      .then((filmovi:FilmoviTmdbI) => {
        //console.log(filmovi);
        let rez = [
          filmovi.results[dajNasumceBroj(0, 20)],
          filmovi.results[dajNasumceBroj(0, 20)],
        ];
        odgovor.json(rez);
      })
      .catch((greska) => {
        odgovor.json(greska);
      });
    } else {
      odgovor.json({greska:"fali žanr"});
    }

  }
}
