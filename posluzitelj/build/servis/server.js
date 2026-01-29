import express from "express";
import { dajPort } from "../zajednicko/esmPomocnik.js";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";
import { pripremiPutanjeResursTMDB, pripremiPutanjeResursKorisnika, pripremiPutanjeResursKolekcije, pripremiPutanjeResursMultimedije, pripremiPutanjeResursKorisnikKolekcija } from "./servis.js";
import { Aplikacija } from "../aplikacija/aplikacija.js";
import { AplikacijaRute } from "../aplikacija/aplikacijaRute.js";
import * as path from "path";
const server = express();
function inicijalizirajPostavkeServera(server) {
    // Aplikacija klasa za inicijalizaciju parsera i CORS-a
    const app = new Aplikacija(server, new Konfiguracija());
    app.inicijalizirajParsere();
    app.inicijalizirajCORS();
}
function inicijalizirajSesiju(server, konf) {
    // Aplikacija klasa za inicijalizaciju sesije
    const app = new Aplikacija(server, konf);
    app.inicijalizirajSesiju();
}
async function inicijalizirajKonfiguraciju() {
    let konf = new Konfiguracija();
    await konf.ucitajKonfiguraciju();
    return konf;
}
function pripremiPutanjeServera(server, konf) {
    // Pripremi API autentifikacijske rute
    const appRute = new AplikacijaRute();
    appRute.pripremiRute(server);
    // Pripremi ostale API resurse
    pripremiPutanjeResursTMDB(server, konf);
    pripremiPutanjeResursKorisnika(server, konf);
    pripremiPutanjeResursKolekcije(server, konf);
    pripremiPutanjeResursMultimedije(server);
    pripremiPutanjeResursKorisnikKolekcija(server);
    // Inicijalizacija statičkih datoteka (Angular build)
    const app = new Aplikacija(server, konf);
    app.inicijalizirajStaticneDatoteke();
    // Catch-all ruta za Angular routing - MORA biti zadnja
    // Sve rute koje nisu /api/* ili /podaci/* vraćaju index.html za client-side routing
    server.use((req, res, next) => {
        // Ne presretaj zahtjeve za statičke resurse
        if (req.path.startsWith('/podaci/') || req.path.startsWith('/api/')) {
            return next();
        }
        // Za sve ostale rute, vrati Angular index.html
        res.sendFile(path.resolve('angular/browser/index.html'));
    });
}
function pokreniServer(server, port) {
    server.listen(port, () => {
        console.log(`Server pokrenut na portu: ${port}`);
    });
    // Održavaj proces aktivnim
    setInterval(() => { }, 1000);
}
async function main(argv) {
    // Port 12222 za lokalnu upotrebu
    let port = 12222;
    // Ako je proslijeđen kao argument, koristi taj port
    if (argv[3] != undefined) {
        port = parseInt(argv[3]);
    }
    else if (process.env['NODE_ENV'] === 'production') {
        // Na produkciji koristi dajPort
        port = dajPort("vmatuka23");
    }
    let konf = null;
    try {
        konf = await inicijalizirajKonfiguraciju();
    }
    catch (greska) {
        if (process.argv.length == 2)
            console.error("Potrebno je dati naziv datoteke");
        else if (greska.path != undefined)
            console.error("Nije moguće otvoriti datoteku: " + greska.path);
        else
            console.log(greska.message);
        process.exit();
    }
    inicijalizirajPostavkeServera(server);
    if (konf !== null) {
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
//# sourceMappingURL=server.js.map