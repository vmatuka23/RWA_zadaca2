import { RestKorisnik } from "./restKorisnik.js";
import { RestTMDB } from "./restTMDB.js";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";
import {Application} from "express";
import { RestKolekcija } from "./restKolekcija.js";
import { RestMultimedija } from "./restMultimedija.js";
import { RestKorisnikKolekcija } from "./restKorisnik_kolekcija.js";

export function pripremiPutanjeResursKorisnikKolekcija(server: Application) {
  let restKolekcijaKorisnik = new RestKorisnikKolekcija();
  server.post("/api/korisnik-kolekcija",restKolekcijaKorisnik.postVeza.bind(restKolekcijaKorisnik));
  server.delete("/api/korisnik-kolekcija", restKolekcijaKorisnik.deleteVeza.bind(restKolekcijaKorisnik));
  server.get("/api/korisnik-kolekcija/korisnik/:id", restKolekcijaKorisnik.getKolekcijeZaKorisnika.bind(restKolekcijaKorisnik));
  server.get("/api/korisnik-kolekcija/kolekcija/:id", restKolekcijaKorisnik.getKorisniciZaKolekciju.bind(restKolekcijaKorisnik));
}

export function pripremiPutanjeResursKolekcije(server: Application) {
  let restKolekcija = new RestKolekcija();
  server.get("/api/kolekcije", restKolekcija.getKolekcije.bind(restKolekcija));
  server.post("/api/kolekcije", restKolekcija.postKolekcija.bind(restKolekcija));
  server.get("/api/kolekcije/:id", restKolekcija.getKolekcijaPoId.bind(restKolekcija));
  server.put("/api/kolekcije/:id", restKolekcija.putKolekcija.bind(restKolekcija));
  server.delete("/api/kolekcije/:id", restKolekcija.deleteKolekcija.bind(restKolekcija));
  server.post("/api/kolekcije/:id/multimedija", restKolekcija.dodajMultimediju.bind(restKolekcija));
  server.delete("/api/kolekcije/:id/multimedija/:multimedijaId", restKolekcija.ukloniMultimediju.bind(restKolekcija));
}

export function pripremiPutanjeResursMultimedije(server: Application) {
  let restMultimedija = new RestMultimedija();
  server.get("/api/multimedija", restMultimedija.getMultimedija.bind(restMultimedija));
  server.post("/api/multimedija", restMultimedija.postMultimedija.bind(restMultimedija));
  server.get("/api/multimedija/:id", restMultimedija.getMultimedijaPoId.bind(restMultimedija));
  server.put("/api/multimedija/:id", restMultimedija.putMultimedija.bind(restMultimedija));
  server.delete("/api/multimedija/:id", restMultimedija.deleteMultimedija.bind(restMultimedija));
}

export function pripremiPutanjeResursTMDB(server:Application,konf:Konfiguracija) {
  let restTMDB = new RestTMDB(konf.dajKonf()["tmdbApiKeyV3"]);
  server.get("/api/tmdb/zanr", restTMDB.getZanr.bind(restTMDB));
  server.get("/api/tmdb/filmovi", restTMDB.getFilmovi.bind(restTMDB));
  server.get("/api/tmdb/nasumceFilm", restTMDB.dohvatiNasumceFilm.bind(restTMDB));
}

export function pripremiPutanjeResursKorisnika(server:Application,konf:Konfiguracija) {
  let restKorisnik = new RestKorisnik();
  server.get("/api/korisnici", restKorisnik.getKorisnici.bind(restKorisnik));
  server.post("/api/korisnici", restKorisnik.postKorisnici.bind(restKorisnik));
  server.put("/api/korisnici", restKorisnik.putKorisnici.bind(restKorisnik));
  server.delete(
    "/api/korisnici",
    restKorisnik.deleteKorisnici.bind(restKorisnik),
  );

  server.get(
    "/api/korisnici/:korime",
    restKorisnik.getKorisnik.bind(restKorisnik),
  );
  server.post(
    "/api/korisnici/:korime/prijava",
    restKorisnik.getKorisnikPrijava.bind(restKorisnik),
  );
  server.post(
    "/api/korisnici/:korime",
    restKorisnik.postKorisnik.bind(restKorisnik),
  );
  server.put(
    "/api/korisnici/:korime",
    restKorisnik.putKorisnik.bind(restKorisnik),
  );
  server.delete(
    "/api/korisnici/:korime",
    restKorisnik.deleteKorisnik.bind(restKorisnik),
  );
}
