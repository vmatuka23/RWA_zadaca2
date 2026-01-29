import { dajNasumceBroj } from "../zajednicko/kodovi.js";
export function provjeriAutentikaciju(req, res, next) {
    if (req.session && req.session.korisnik) {
        next();
    }
    else {
        res.status(401).json({ greska: "Niste prijavljeni" });
    }
}
export function provjeriUlogu(dozvoljeneUloge) {
    return (req, res, next) => {
        if (req.session &&
            req.session.korisnik &&
            dozvoljeneUloge.includes(req.session.korisnik.uloga)) {
            next();
        }
        else {
            res.status(403).json({ greska: "Nemate pravo pristupa" });
        }
    };
}
// Generira random sol od 4 znaka za heširanje lozinke
export function generirajSol() {
    const karakteri = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let sol = "";
    for (let i = 0; i < 4; i++) {
        sol += karakteri.charAt(dajNasumceBroj(0, karakteri.length));
    }
    return sol;
}
//# sourceMappingURL=autentikacija.js.map