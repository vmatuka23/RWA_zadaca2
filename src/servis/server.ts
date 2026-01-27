import cors from "cors";
import express, { Application } from "express";
import { dajPort } from "../zajednicko/esmPomocnik.js";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";
import { pripremiPutanjeResursTMDB, pripremiPutanjeResursKorisnika, pripremiPutanjeResursKolekcije, pripremiPutanjeResursMultimedije, pripremiPutanjeResursKorisnikKolekcija} from "./servis.js";
import session from "express-session";
import cookieParser from "cookie-parser";

const server: Application = express();

function inicijalizirajPostavkeServera(server: Application) {
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    server.use(cors({
        origin: (origin, povratniPoziv) => {
            console.log(origin);
            if (!origin || origin.startsWith('http://spider.foi.hr:') ||
                origin.startsWith('http://localhost:')) {
                povratniPoziv(null, true); // Dozvoljeno
            } else {
                povratniPoziv(new Error('Nije dozvoljeno zbog CORS'));
            }
        },
        optionsSuccessStatus: 200
    }));
}

function inicijalizirajSesiju(server: Application, konf: Konfiguracija) {
    server.use(cookieParser());

    // session middleware
    server.use(session({
        secret: konf.dajKonf().tajniKljucSesija,
        resave: false,
        saveUninitialized: false, // Ne kreiraj prazne sesije
        cookie: {
            httpOnly: true,
            secure: false, // true ako je HTTPS, na localhost treba false
            maxAge: 1000 * 60 * 60 // 1 sat
        }
    }));
}

async function inicijalizirajKonfiguraciju(): Promise<Konfiguracija> {
    let konf = new Konfiguracija();
    await konf.ucitajKonfiguraciju();
    return konf;
}

function pripremiPutanjeServera(server: Application, konf: Konfiguracija) {
    pripremiPutanjeResursTMDB(server, konf);
    pripremiPutanjeResursKorisnika(server, konf);
    pripremiPutanjeResursKolekcije(server);
    pripremiPutanjeResursMultimedije(server);
    pripremiPutanjeResursKorisnikKolekcija(server);
    server.use((zahtjev, odgovor) => {
        odgovor.status(404);
        var poruka = { greska: "nepostojeći resurs" };
        odgovor.send(JSON.stringify(poruka));
    });
}

function pokreniServer(server: Application, port: number) {
    server.listen(port, () => {
        console.log(`Server pokrenut na portu: ${port}`);
    });
    
    // Keep the process alive
    setInterval(() => {}, 1000);
}

async function main(argv: Array<string>) {
    let port: number = dajPort("vmatuka23");
    if (argv[3] != undefined) {
        port = parseInt(argv[3]);
    }

    let konf: Konfiguracija | null = null;

    try {
        konf = await inicijalizirajKonfiguraciju();
    } catch (greska: Error | any) {
        if (process.argv.length == 2)
            console.error("Potrebno je dati naziv datoteke");
        else if (greska.path != undefined)
            console.error("Nije moguće otvoriti datoteku: " + greska.path);
        else
            console.log(greska.message);

        process.exit();
    }

    inicijalizirajPostavkeServera(server);
    if (konf !== null){
        inicijalizirajSesiju(server, konf);
        pripremiPutanjeServera(server, konf);
    }
    pokreniServer(server, port);
    
}

main(process.argv).catch(err => {
    console.error("Fatal error in main:", err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});