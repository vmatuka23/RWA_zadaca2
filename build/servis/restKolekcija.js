import Baza from "../zajednicko/sqliteBaza.js";
import KolekcijaDAO from "../zajednicko/dao/kolekcijaDAO.js";
const PAGE_LIMIT = 4; // Configured page limit
export class RestKolekcija {
    kdao;
    constructor() {
        const db = new Baza("podaci/RWA2025vmatuka23.sqlite");
        db.spoji();
        this.kdao = new KolekcijaDAO(db);
    }
    async getKolekcije(req, res) {
        res.type("application/json");
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        const page = parseInt(req.query['page']) || 1;
        const all = req.query['all'] === 'true';
        const offset = (page - 1) * PAGE_LIMIT;
        try {
            // Only logged-in users (korisnik, moderator, admin) can access their collections
            if (uloga !== "korisnik" && uloga !== "moderator" && uloga !== "admin") {
                res.status(401).json({ greska: "Morate biti prijavljeni kao korisnik" });
                return;
            }
            let kolekcije;
            if (uloga === "korisnik") {
                kolekcije = await this.kdao.dajKolekcijeKorisnika(korisnikId);
            }
            else {
                // moderator, admin
                kolekcije = await this.kdao.dajSveKolekcije();
            }
            // If all=true, skip pagination (used for dropdowns)
            if (all) {
                res.json({
                    kolekcije: kolekcije,
                    ukupno: kolekcije.length
                });
                return;
            }
            // Implement pagination
            const paginatedKolekcije = kolekcije.slice(offset, offset + PAGE_LIMIT);
            res.json({
                kolekcije: paginatedKolekcije,
                strana: page,
                limitPoStranici: PAGE_LIMIT,
                ukupno: kolekcije.length
            });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    // GET /api/kolekcije/javne - Public collections (for guests)
    async getJavneKolekcije(req, res) {
        res.type("application/json");
        const page = parseInt(req.query['page']) || 1;
        const offset = (page - 1) * PAGE_LIMIT;
        try {
            const javneKolekcije = await this.kdao.dajJavneKolekcije();
            const paginatedKolekcije = javneKolekcije.slice(offset, offset + PAGE_LIMIT);
            res.json({
                kolekcije: paginatedKolekcije,
                strana: page,
                limitPoStranici: PAGE_LIMIT,
                ukupno: javneKolekcije.length
            });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async getKolekcijaPoId(req, res) {
        res.type("application/json");
        const id = Number(req.params["id"]);
        const uloga = req.session?.korisnik?.uloga;
        const korisnikId = req.session?.korisnik?.id;
        try {
            const row = await this.kdao.dajKolekcijuPoId(id);
            if (!row) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }
            // Check access permissions
            // - Guests can only see public collections
            // - Users can see their own or public collections
            // - Moderators and admins can see all
            if (uloga === "gost") {
                if (row.javno !== 1) {
                    res.status(403).json({ greska: "Nemate pravo pristupa" });
                    return;
                }
            }
            else if (uloga === "korisnik") {
                const isOwner = await this.kdao.jeVlasnikKolekcije(id, korisnikId);
                if (row.javno !== 1 && !isOwner) {
                    res.status(403).json({ greska: "Nemate pravo pristupa" });
                    return;
                }
            }
            else if (uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo pristupa" });
                return;
            }
            res.json(row);
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async postKolekcija(req, res) {
        res.type("application/json");
        // Check if user is logged in first
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da kreirate kolekciju" });
            return;
        }
        const uloga = req.session.korisnik.uloga;
        // Only moderator and admin can create collections
        if (uloga !== "moderator" && uloga !== "admin") {
            res.status(403).json({ greska: "Morate biti moderator ili admin da kreirate kolekciju" });
            return;
        }
        const { naziv, opis, istaknutaSlika, javno } = req.body;
        const korisnikId = req.session.korisnik.id;
        if (!naziv) {
            res.status(400).json({ greska: "Naziv je obavezan" });
            return;
        }
        try {
            const novaKolekcija = {
                naziv,
                opis: opis || "",
                istaknutaSlika: istaknutaSlika || "",
                javno: javno ? 1 : 0
            };
            const poruka = await this.kdao.dodajKolekciju(novaKolekcija);
            // Automatically add creator as owner in korisnik_kolekcija
            if (poruka.id) {
                await this.kdao.dodajVlasnikaKolekciji(poruka.id, korisnikId);
            }
            res.status(201).json({ status: "uspjeh", kolekcijaId: poruka.id });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async putKolekcija(req, res) {
        res.type("application/json");
        const uloga = req.session?.korisnik?.uloga;
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da uredite kolekciju" });
            return;
        }
        const id = Number(req.params["id"]);
        const { naziv, opis, istaknutaSlika, javno } = req.body;
        const korisnikId = req.session.korisnik.id;
        try {
            const row = await this.kdao.dajKolekcijuPoId(id);
            if (!row) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }
            // Check if user is owner or has elevated role
            const isOwner = await this.kdao.jeVlasnikKolekcije(id, korisnikId);
            if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
                return;
            }
            const azuriranaKolekcija = {
                id,
                naziv: naziv || row.naziv,
                opis: opis !== undefined ? opis : (row.opis || ""),
                istaknutaSlika: istaknutaSlika !== undefined ? istaknutaSlika : (row.istaknutaSlika || ""),
                javno: javno !== undefined ? (javno ? 1 : 0) : (row.javno ?? 0)
            };
            await this.kdao.azurirajKolekciju(azuriranaKolekcija);
            res.status(200).json({ status: "uspjeh", poruka: "Kolekcija uspješno ažurirana" });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async deleteKolekcija(req, res) {
        res.type("application/json");
        const uloga = req.session?.korisnik?.uloga;
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da izbrišete kolekciju" });
            return;
        }
        const id = Number(req.params["id"]);
        const korisnikId = req.session.korisnik.id;
        try {
            const row = await this.kdao.dajKolekcijuPoId(id);
            if (!row) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }
            // Check if user is owner or has elevated role
            const isOwner = await this.kdao.jeVlasnikKolekcije(id, korisnikId);
            if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo brisati ovu kolekciju" });
                return;
            }
            await this.kdao.obrisiKolekciju(id);
            res.status(200).json({ status: "uspjeh", poruka: "Kolekcija obrisana" });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async dodajMultimediju(req, res) {
        res.type("application/json");
        const uloga = req.session?.korisnik?.uloga;
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da dodate multimediju" });
            return;
        }
        const kolekcijaId = Number(req.params["id"]);
        const { multimedijaId } = req.body;
        const korisnikId = req.session.korisnik.id;
        if (!multimedijaId) {
            res.status(400).json({ greska: "Nedostaje multimedijaId" });
            return;
        }
        try {
            // Check if collection exists
            const kolekcija = await this.kdao.dajKolekcijuPoId(kolekcijaId);
            if (!kolekcija) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }
            // Check if user is owner or has elevated role
            const isOwner = await this.kdao.jeVlasnikKolekcije(kolekcijaId, korisnikId);
            if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
                return;
            }
            await this.kdao.dodajMultimedijuKolekciji(kolekcijaId, multimedijaId);
            res.status(200).json({ status: "uspjeh", poruka: "Multimedija dodana u kolekciju" });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
    async ukloniMultimediju(req, res) {
        res.type("application/json");
        const uloga = req.session?.korisnik?.uloga;
        if (!req.session?.korisnik) {
            res.status(401).json({ greska: "Morate biti prijavljeni da uklonite multimediju" });
            return;
        }
        const kolekcijaId = Number(req.params["id"]);
        const multimedijaId = Number(req.params["multimedijaId"]);
        const korisnikId = req.session.korisnik.id;
        try {
            // Check if collection exists
            const kolekcija = await this.kdao.dajKolekcijuPoId(kolekcijaId);
            if (!kolekcija) {
                res.status(404).json({ greska: "Kolekcija ne postoji" });
                return;
            }
            // Check if user is owner or has elevated role
            const isOwner = await this.kdao.jeVlasnikKolekcije(kolekcijaId, korisnikId);
            if (!isOwner && uloga !== "moderator" && uloga !== "admin") {
                res.status(403).json({ greska: "Nemate pravo uređivati ovu kolekciju" });
                return;
            }
            await this.kdao.ukloniMultimedijuIzKolekcije(kolekcijaId, multimedijaId);
            res.status(200).json({ status: "uspjeh", poruka: "Multimedija uklonjena iz kolekcije" });
        }
        catch (err) {
            res.status(500).json({ greska: err.message });
        }
    }
}
//# sourceMappingURL=restKolekcija.js.map