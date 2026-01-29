import dsPromise from "fs/promises";
export class Konfiguracija {
    konf;
    constructor() {
        this.konf = this.initKonf();
    }
    initKonf() {
        return {
            stranicaLimit: "",
            tajniKljucSesija: "",
            tmdbApiKeyV3: "",
            tmdbApiKeyV4: "",
            smtpHost: "",
            smtpPort: "",
            smtpUser: "",
            smtpPass: "",
            smtpSecure: ""
        };
    }
    dajKonf() {
        return this.konf;
    }
    async ucitajKonfiguraciju() {
        console.log(this.konf);
        if (process.argv[2] == undefined)
            throw new Error("Nedostaje putanja do konfiguracijske datoteke!");
        let putanja = process.argv[2];
        var podaci = await dsPromise.readFile(putanja, { encoding: "utf-8" });
        this.pretvoriJSONkonfig(podaci);
        console.log(this.konf);
        this.provjeriPodatkeKonfiguracije();
    }
    pretvoriJSONkonfig(podaci) {
        console.log(podaci);
        let konf = {};
        var nizPodataka = podaci.split("\n");
        for (let podatak of nizPodataka) {
            var podatakNiz = podatak.split("=");
            var naziv = podatakNiz[0];
            if (typeof naziv != "string" || naziv == "")
                continue;
            var vrijednost = podatakNiz[1] ?? "";
            konf[naziv] = vrijednost;
        }
        this.konf = konf;
    }
    provjeriPodatkeKonfiguracije() {
        if (this.konf.tmdbApiKeyV3 == undefined || this.konf.tmdbApiKeyV3.trim() == "") {
            throw new Error("Fali TMDB API ključ u tmdbApiKeyV3");
        }
        if (this.konf.stranicaLimit == undefined || this.konf.stranicaLimit.trim() == "") {
            throw new Error("Fali stranicaLimit");
        }
        if (isNaN(parseInt(this.konf.stranicaLimit))) {
            throw new Error("stranicaLimit mora biti broj");
        }
    }
}
//# sourceMappingURL=konfiguracija.js.map