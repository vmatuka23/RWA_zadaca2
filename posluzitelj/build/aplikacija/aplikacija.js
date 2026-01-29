import cors from "cors";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
export class Aplikacija {
    server;
    konf;
    constructor(server, konf) {
        this.server = server;
        this.konf = konf;
    }
    //Inicijalizira osnovne middleware-e za parsiranje JSON-a, URL-a, itd.
    inicijalizirajParsere() {
        this.server.use(express.json());
        this.server.use(express.urlencoded({ extended: true }));
    }
    //Inicijalizira CORS sa dozvolama za localhost i spider.foi.hr
    inicijalizirajCORS() {
        this.server.use(cors({
            origin: (origin, povratniPoziv) => {
                console.log("CORS origen:", origin);
                if (!origin || origin.startsWith('http://spider.foi.hr:') ||
                    origin.startsWith('http://localhost:')) {
                    povratniPoziv(null, true); // Dozvoljeno
                }
                else {
                    povratniPoziv(new Error('Nije dozvoljeno zbog CORS'));
                }
            },
            optionsSuccessStatus: 200,
            credentials: true
        }));
    }
    //Inicijalizira sesije i kolačiće
    inicijalizirajSesiju() {
        this.server.use(cookieParser());
        // session middleware
        this.server.use(session({
            secret: this.konf.dajKonf().tajniKljucSesija,
            resave: false,
            saveUninitialized: false, // Ne kreiraj prazne sesije
            cookie: {
                httpOnly: true,
                secure: false, // true ako je HTTPS, na localhost treba false
                sameSite: 'lax', // Allow cookies to be sent with navigation
                maxAge: 1000 * 60 * 60 // 1 sat
            }
        }));
        // Debug middleware to log session info
        this.server.use((req, res, next) => {
            if (req.path.startsWith('/api')) {
                console.log(`API Request: ${req.method} ${req.path}, Session User:`, req.session?.korisnik?.korisnickoIme || 'Not logged in');
            }
            next();
        });
    }
    //Postavlja statičke datoteke - Angular aplikacija i multimedija
    inicijalizirajStaticneDatoteke() {
        // Serviranje Angular aplikacije iz angular/browser foldera
        this.server.use(express.static("angular/browser", {
            maxAge: '1d',
            setHeaders: (res, path) => {
                // Postavi ispravne MIME tipove
                if (path.endsWith('.js')) {
                    res.setHeader('Content-Type', 'application/javascript');
                }
                else if (path.endsWith('.css')) {
                    res.setHeader('Content-Type', 'text/css');
                }
            }
        }));
        // Serviranje multimedije
        this.server.use("/podaci", express.static("podaci"));
    }
    //Inicijalizira sve  komponente aplikacije
    inicijaliziraj() {
        this.inicijalizirajParsere();
        this.inicijalizirajCORS();
        this.inicijalizirajSesiju();
        this.inicijalizirajStaticneDatoteke();
    }
    dajServer() {
        return this.server;
    }
}
//# sourceMappingURL=aplikacija.js.map