export class Validacija {
    static korisnickoIme(korime) {
        if (!korime || typeof korime !== 'string')
            return false;
        // minimalno 3 znaka, samo slova, brojevi i _ -
        return /^[A-Za-z0-9_-]{3,}$/.test(korime);
    }
    static lozinka(lozinka) {
        if (!lozinka || typeof lozinka !== 'string')
            return false;
        // minimalno 6 znakova, barem 1 slovo i 1 broj
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(lozinka);
    }
    static email(email) {
        if (!email || typeof email !== 'string')
            return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    static ime(ime) {
        if (!ime || typeof ime !== 'string')
            return false;
        return ime.length >= 2;
    }
    static prezime(prezime) {
        if (!prezime || typeof prezime !== 'string')
            return false;
        return prezime.length >= 2;
    }
    static uloga(uloga) {
        return ["gost", "korisnik", "moderator", "admin"].includes(uloga);
    }
}
//# sourceMappingURL=validacija.js.map