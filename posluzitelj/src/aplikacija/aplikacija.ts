import cors from "cors";
import express, { Application } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";

export class Aplikacija {
    private server: Application;
    private konf: Konfiguracija;

    constructor(server: Application, konf: Konfiguracija) {
        this.server = server;
        this.konf = konf;
    }

    //Inicijalizira osnovne middleware-e za parsiranje JSON-a, URL-a, itd.
    public inicijalizirajParsere(): void {
        this.server.use(express.json());
        this.server.use(express.urlencoded({ extended: true }));
    }

    //Inicijalizira CORS sa dozvolama za localhost i spider.foi.hr
    public inicijalizirajCORS(): void {
        this.server.use(cors({
            origin: (origin, povratniPoziv) => {
                console.log("CORS origen:", origin);
                if (!origin || origin.startsWith('http://spider.foi.hr:') ||
                    origin.startsWith('http://localhost:')) {
                    povratniPoziv(null, true); // Dozvoljeno
                } else {
                    povratniPoziv(new Error('Nije dozvoljeno zbog CORS'));
                }
            },
            optionsSuccessStatus: 200,
            credentials: true
        }));
    }

    //Inicijalizira sesije i kolačiće
    public inicijalizirajSesiju(): void {
        this.server.use(cookieParser());

        // session middleware
        this.server.use(session({
            secret: this.konf.dajKonf().tajniKljucSesija,
            resave: false,
            saveUninitialized: false, // Ne kreiraj prazne sesije
            cookie: {
                httpOnly: true,
                secure: false, // true ako je HTTPS, na localhost treba false
                maxAge: 1000 * 60 * 60 // 1 sat
            }
        }));
    }

    //Postavlja statičke datoteke iz aplikacija/html i css foldera
    public inicijalizirajStaticneDatoteke(): void {
        // Postavi HTML i CSS fajlove
        this.server.use(express.static("src/aplikacija/html"));
        this.server.use(express.static("src/aplikacija/css"));
        this.server.use(express.static("src/aplikacija/js"));
        this.server.use(express.static("dokumentacija"));
        this.server.use("/podaci", express.static("podaci"));
    }

    //Inicijalizira sve  komponente aplikacije
    public inicijaliziraj(): void {
        this.inicijalizirajParsere();
        this.inicijalizirajCORS();
        this.inicijalizirajSesiju();
        this.inicijalizirajStaticneDatoteke();
    }

    public dajServer(): Application {
        return this.server;
    }
}
