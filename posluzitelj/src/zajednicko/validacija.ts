
export class Validacija {

    static korisnickoIme(korime: string): boolean {
        if (!korime || typeof korime !== 'string') return false;
        // minimalno 3 znaka, samo slova, brojevi i _ -
        return /^[A-Za-z0-9_-]{3,}$/.test(korime);
    }

    static lozinka(lozinka: string): boolean {
        if (!lozinka || typeof lozinka !== 'string') return false;
        // minimalno 6 znakova, barem 1 slovo i 1 broj
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(lozinka);
    }

    static email(email: string): boolean {
        if (!email || typeof email !== 'string') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    static ime(ime: string): boolean {
        if (!ime || typeof ime !== 'string') return false;
        return ime.length >= 2;
    }

    static prezime(prezime: string): boolean {
        if (!prezime || typeof prezime !== 'string') return false;
        return prezime.length >= 2;
    }

    static uloga(uloga: string): boolean {
        return ["gost", "korisnik", "moderator", "admin"].includes(uloga);
    }

}
