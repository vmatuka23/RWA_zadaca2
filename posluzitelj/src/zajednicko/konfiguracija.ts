import dsPromise from "fs/promises";

type tipKonf = {
  stranicaLimit: string,
  tajniKljucSesija: string,
  tmdbApiKeyV3: string,
  tmdbApiKeyV4: string
};

export class Konfiguracija {
  private konf: tipKonf;
  constructor() {
    this.konf = this.initKonf();
  }

  private initKonf (){
    return { stranicaLimit: "", tajniKljucSesija:"", tmdbApiKeyV3: "", tmdbApiKeyV4: "" }
  }

  public dajKonf() {
    return this.konf;
  }

  public async ucitajKonfiguraciju() {
    console.log(this.konf)

    if (process.argv[2] == undefined)
      throw new Error("Nedostaje putanja do konfiguracijske datoteke!");
    let putanja: string = process.argv[2];

    var podaci: string = await dsPromise.readFile(putanja, { encoding: "utf-8" });
    this.pretvoriJSONkonfig(podaci);
    console.log(this.konf);
    this.provjeriPodatkeKonfiguracije();
  }

  private pretvoriJSONkonfig(podaci: string) {
    console.log(podaci);
    let konf:{[kljuc:string]:string} = {};
    var nizPodataka = podaci.split("\n");
    for (let podatak of nizPodataka) {
      var podatakNiz = podatak.split("=");
      var naziv = podatakNiz[0];
      if (typeof naziv != "string" || naziv == "") continue;
      var vrijednost: string = podatakNiz[1] ?? "";
      konf[naziv] = vrijednost;
    }

    this.konf = konf as tipKonf;
  }

  private provjeriPodatkeKonfiguracije(){
    if(this.konf.tmdbApiKeyV3==undefined || this.konf.tmdbApiKeyV3.trim() == ""){
      throw new Error("Fali TMDB API ključ u tmdbApiKeyV3");
    }

    if(this.konf.stranicaLimit==undefined || this.konf.stranicaLimit.trim() == ""){
      throw new Error("Fali stranicaLimit");
    }

    if(isNaN(parseInt(this.konf.stranicaLimit))){
      throw new Error("stranicaLimit mora biti broj");
    }
  }
}
