import "express-session";
import { SesijaKorisnikI } from "./servisI/korisniciI.js";

declare module "express-session" {
    interface SessionData {
        korisnik?: SesijaKorisnikI;
    }
}
