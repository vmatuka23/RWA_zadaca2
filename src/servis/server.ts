import cors from "cors";
import express, { Application } from "express";
import { dajPort } from "../zajednicko/esmPomocnik.js";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";
import { pripremiPutanjeResursTMDB, pripremiPutanjeResursKorisnika } from "./servis.js";

const server: Application = express();


function pokreniServer(server: Application, port: number) {
    server.listen(port, () => {
        console.log(`Server pokrenut na portu: ${port}`);
    });
}

function inicijalizirajPostavkeServera(server: Application) {
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

function inicijalizirajKonfiguraciju(): Konfiguracija {
    let konf = new Konfiguracija();
    konf.ucitajKonfiguraciju();
    return konf;
}

function pripremiPutanjeServera(server: Application, konf: Konfiguracija) {
    pripremiPutanjeResursTMDB(server, konf);
    pripremiPutanjeResursKorisnika(server, konf);
    server.use((zahtjev, odgovor) => {
        odgovor.status(404);
        var poruka = { greska: "nepostojeći resurs" };
        odgovor.send(JSON.stringify(poruka));
    });
}


function main(argv: Array<string>) {
    let port: number = dajPort("vmatuka");
    if (argv[3] != undefined) {
        port = parseInt(argv[3]);
    }

    let konf: Konfiguracija | null = null;
    try {
        konf = inicijalizirajKonfiguraciju();
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
        pripremiPutanjeServera(server, konf);
    }
    pokreniServer(server, port);
    
}

main(process.argv);