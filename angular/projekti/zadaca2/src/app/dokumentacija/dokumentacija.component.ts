import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dokumentacija',
  imports: [CommonModule],
  templateUrl: './dokumentacija.component.html',
  styleUrl: './dokumentacija.component.css'
})
export class DokumentacijaComponent {
  autor = {
    ime: 'Vigo Matuka',
    email: 'vmatuka23@foi.hr'
  };

  // Task 1 - REST API endpoints
  restApiEndpoints = [
    { endpoint: '/api/kolekcije', metoda: 'GET', opis: 'Dohvati sve kolekcije', implementirano: 'Da' },
    { endpoint: '/api/kolekcije', metoda: 'POST', opis: 'Kreiraj novu kolekciju', implementirano: 'Da' },
    { endpoint: '/api/kolekcije/:id', metoda: 'GET', opis: 'Dohvati kolekciju po ID-u', implementirano: 'Da' },
    { endpoint: '/api/kolekcije/:id', metoda: 'PUT', opis: 'Ažuriraj kolekciju', implementirano: 'Da' },
    { endpoint: '/api/kolekcije/:id', metoda: 'DELETE', opis: 'Obriši kolekciju', implementirano: 'Da' },
    { endpoint: '/api/kolekcije/javne', metoda: 'GET', opis: 'Dohvati javne kolekcije', implementirano: 'Da' },
    { endpoint: '/api/korisnici', metoda: 'GET', opis: 'Dohvati sve korisnike', implementirano: 'Da' },
    { endpoint: '/api/korisnici', metoda: 'POST', opis: 'Registracija korisnika', implementirano: 'Da' },
    { endpoint: '/api/korisnici/:korime/prijava', metoda: 'POST', opis: 'Prijava korisnika', implementirano: 'Da' },
    { endpoint: '/api/korisnici/:id', metoda: 'PUT', opis: 'Ažuriraj korisnika', implementirano: 'Da' },
    { endpoint: '/api/korisnici/:id/blokiraj', metoda: 'PUT', opis: 'Blokiraj/odblokiraj korisnika', implementirano: 'Da' },
    { endpoint: '/api/multimedija', metoda: 'GET', opis: 'Dohvati multimedijske sadržaje', implementirano: 'Da' },
    { endpoint: '/api/multimedija', metoda: 'POST', opis: 'Dodaj multimedijski sadržaj (upload)', implementirano: 'Da' },
    { endpoint: '/api/multimedija/url', metoda: 'POST', opis: 'Dodaj multimedijski sadržaj (URL)', implementirano: 'Da' },
    { endpoint: '/api/multimedija/:id', metoda: 'GET', opis: 'Dohvati multimedijski sadržaj po ID-u', implementirano: 'Da' },
    { endpoint: '/api/multimedija/:id', metoda: 'PUT', opis: 'Ažuriraj multimedijski sadržaj', implementirano: 'Da' },
    { endpoint: '/api/multimedija/:id', metoda: 'DELETE', opis: 'Obriši multimedijski sadržaj', implementirano: 'Da' },
    { endpoint: '/api/tmdb/zanr', metoda: 'GET', opis: 'Dohvati filmske žanrove (TMDB)', implementirano: 'Da' },
    { endpoint: '/api/tmdb/filmovi', metoda: 'GET', opis: 'Pretraži filmove po nazivu (TMDB)', implementirano: 'Da' },
    { endpoint: '/api/tmdb/nasumceFilm', metoda: 'GET', opis: 'Dohvati nasumične filmove (TMDB)', implementirano: 'Da' },
  ];

  // Task 1 - Functional requirements (Web stranice - posluzitelj)
  funkcionalniZahtjeviZadaca1 = [
    { uloga: 'Gost', funkcionalnost: 'Pregled javnih kolekcija', implementirano: 'Da' },
    { uloga: 'Gost', funkcionalnost: 'Prijava na sustav', implementirano: 'Da' },
    { uloga: 'Gost', funkcionalnost: 'Registracija na sustav', implementirano: 'Da' },
    { uloga: 'Korisnik', funkcionalnost: 'Upravljanje vlastitim kolekcijama', implementirano: 'Da' },
    { uloga: 'Korisnik', funkcionalnost: 'Dodavanje multimedijalnog sadržaja u kolekcije', implementirano: 'Da' },
    { uloga: 'Korisnik', funkcionalnost: 'Pregled sadržaja kolekcija', implementirano: 'Da' },
    { uloga: 'Korisnik', funkcionalnost: 'Pretraga filmova putem TMDB API-ja', implementirano: 'Da' },
    { uloga: 'Moderator', funkcionalnost: 'Kreiranje kolekcija', implementirano: 'Da' },
    { uloga: 'Moderator', funkcionalnost: 'Upravljanje vidljivošću kolekcija (javno/privatno)', implementirano: 'Da' },
    { uloga: 'Moderator', funkcionalnost: 'Dodjeljivanje korisnika kolekcijama', implementirano: 'Da' },
    { uloga: 'Moderator', funkcionalnost: 'Brisanje kolekcija', implementirano: 'Da' },
    { uloga: 'Administrator', funkcionalnost: 'Upravljanje korisnicima (pregled, blokiranje)', implementirano: 'Da' },
    { uloga: 'Administrator', funkcionalnost: 'Promjena uloga korisnika', implementirano: 'Da' },
    { uloga: 'Svi', funkcionalnost: 'Automatsko blokiranje nakon 3 neuspješne prijave', implementirano: 'Da' },
    { uloga: 'Svi', funkcionalnost: 'Navigacija između stranica', implementirano: 'Da' },
    { uloga: 'Svi', funkcionalnost: 'Pregled metapodataka multimedijskog sadržaja', implementirano: 'Da' },
  ];

  // Task 2 - Functional requirements (Angular aplikacija)
  funkcionalniZahtjeviZadaca2 = [
    { 
      funkcionalnost: 'Aktivacija korisničkog računa putem e-maila',
      implementirano: 'Ne',
      napomena: 'Nije implementirano u Angular aplikaciji'
    },
    { 
      funkcionalnost: 'Pretraga javnog multimedijalnog sadržaja (minimum 3 znaka)',
      implementirano: 'Ne',
      napomena: 'Nije implementirano u Angular aplikaciji (postoji samo TMDB pretraga na serveru)'
    },
    { 
      funkcionalnost: 'Filtriranje javnog multimedijalnog sadržaja po autoru',
      implementirano: 'Ne',
      napomena: 'Nije implementirano u Angular aplikaciji'
    },
    { 
      funkcionalnost: 'Filtriranje javnog multimedijalnog sadržaja po datumu',
      implementirano: 'Ne',
      napomena: 'Nije implementirano u Angular aplikaciji'
    },
  ];

  // Task 2 - Non-functional requirements
  nefunkcionalniZahtjeviZadaca2 = [
    { 
      zahtjev: 'Responzivni dizajn',
      implementirano: 'Djelomično',
      napomena: 'Osnovni Angular template, nije prilagođen za mobilne uređaje'
    },
    { 
      zahtjev: 'Validacija unosa na klijentu',
      implementirano: 'Ne',
      napomena: 'Nije implementirano u Angular aplikaciji'
    },
    { 
      zahtjev: 'Korisničko iskustvo (loading indikatori, error handling)',
      implementirano: 'Ne',
      napomena: 'Nije implementirano u Angular aplikaciji'
    },
    { 
      zahtjev: 'Dokumentacija dostupna kroz rutu /dokumentacija',
      implementirano: 'Da',
      napomena: 'Implementirano ovom komponentom'
    },
  ];

  poznatProblemi = [
    'Angular aplikacija je uglavnom prazan template bez implementiranih funkcionalnosti Task 2',
    'Sve funkcionalnosti Task 1 su implementirane samo na web stranicama (posluzitelj/build/aplikacija/html)',
    'REST API servisi na poslužitelju su implementirani i funkcionalni',
    'Nedostaje integracija Angular aplikacije s REST API-jima',
    'Nedostaje implementacija email aktivacije',
    'Nedostaje implementacija pretrage i filtriranja multimedijalnog sadržaja u Angular aplikaciji'
  ];
}
