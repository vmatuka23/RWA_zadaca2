/**
 * Email servis za slanje aktivacijskih emailova
 * Koristi nodemailer za slanje emailova putem Gmail SMTP
 */

import nodemailer from "nodemailer";
import crypto from "crypto";

// Ciljni email za sve aktivacijske emailove (jer su ostali emailovi dummy)
const STVARNI_EMAIL = "vigo.matuka@gmail.com";

// Bazni URL za aktivacijske linkove
const BAZNI_URL = "http://localhost:12222";

// SMTP konfiguracija - učitava se iz konfiguracijske datoteke
interface SmtpKonfiguracija {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
}

// Globalna SMTP konfiguracija
let smtpKonf: SmtpKonfiguracija | null = null;

/**
 * Postavlja SMTP konfiguraciju iz glavne konfiguracije aplikacije
 * @param konf - Objekt s SMTP postavkama
 */
export function postaviSmtpKonfiguraciju(konf: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    smtpSecure: string;
}): void {
    smtpKonf = {
        host: konf.smtpHost?.trim() || "smtp.gmail.com",
        port: parseInt(konf.smtpPort?.trim() || "587"),
        secure: konf.smtpSecure?.trim() === "true",
        user: konf.smtpUser?.trim() || "",
        pass: konf.smtpPass?.trim() || ""
    };
    console.log("SMTP konfiguracija postavljena:");
    console.log("  Host:", smtpKonf.host);
    console.log("  Port:", smtpKonf.port);
    console.log("  User:", smtpKonf.user);
    console.log("  Secure:", smtpKonf.secure);
}

/**
 * Klasa za upravljanje slanjem emailova
 */
export class EmailServis {
    private transporter: nodemailer.Transporter | null = null;

    /**
     * Inicijalizira email transporter s Gmail SMTP
     */
    async inicijaliziraj(): Promise<void> {
        if (!smtpKonf || !smtpKonf.user || !smtpKonf.pass) {
            console.error("SMTP konfiguracija nije postavljena ili nedostaju kredencijali!");
            console.error("Provjerite smtpUser i smtpPass u konfiguracijskoj datoteci.");
            throw new Error("SMTP kredencijali nisu konfigurirani");
        }

        try {
            this.transporter = nodemailer.createTransport({
                host: smtpKonf.host,
                port: smtpKonf.port,
                secure: smtpKonf.secure,
                auth: {
                    user: smtpKonf.user,
                    pass: smtpKonf.pass,
                },
            });

            // Verificiraj konekciju
            await this.transporter.verify();
            console.log("Email servis uspješno inicijaliziran");
            console.log("Emailovi će se slati s:", smtpKonf.user);
        } catch (greska) {
            console.error("Greška pri inicijalizaciji email servisa:", greska);
            throw greska;
        }
    }

    /**
     * Generira jedinstveni aktivacijski token
     * @returns Nasumični hex string od 32 znaka
     */
    generirajAktivacijskiToken(): string {
        return crypto.randomBytes(32).toString("hex");
    }

    /**
     * Šalje aktivacijski email korisniku
     * @param korisnickoIme - Korisničko ime primatelja
     * @param email - Email adresa primatelja (ignorira se, šalje na STVARNI_EMAIL)
     * @param token - Aktivacijski token
     * @returns true ako je email uspješno poslan
     */
    async posaljiAktivacijskiEmail(
        korisnickoIme: string,
        email: string,
        token: string
    ): Promise<boolean> {
        if (!this.transporter) {
            await this.inicijaliziraj();
        }

        const aktivacijskiLink = `${BAZNI_URL}/api/aktiviraj?token=${token}`;

        const emailPoruka = {
            from: `"RWA Aplikacija" <${smtpKonf!.user}>`,
            to: STVARNI_EMAIL, // Svi emailovi idu na stvarni email za testiranje
            subject: "Aktivacija korisničkog računa - RWA Aplikacija",
            text: `
Pozdrav ${korisnickoIme}!

Dobrodošli u RWA Aplikaciju!

Za aktivaciju vašeg korisničkog računa, kliknite na sljedeći link:
${aktivacijskiLink}

Link je valjan 24 sata od trenutka registracije.

Ako niste kreirali račun na našoj aplikaciji, ignorirajte ovaj email.

Srdačan pozdrav,
RWA Tim
            `,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4a90d9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .button { display: inline-block; background: #4a90d9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .button:hover { background: #357abd; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { color: #888; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RWA Aplikacija</h1>
        </div>
        <div class="content">
            <h2>Pozdrav ${korisnickoIme}!</h2>
            <p>Dobrodošli u RWA Aplikaciju!</p>
            <p>Za aktivaciju vašeg korisničkog računa, kliknite na sljedeći gumb:</p>
            <p style="text-align: center;">
                <a href="${aktivacijskiLink}" class="button">Aktiviraj račun</a>
            </p>
            <p>Ili kopirajte ovaj link u preglednik:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">
                ${aktivacijskiLink}
            </p>
            <p class="warning">
                Link je valjan 24 sata od trenutka registracije.<br>
                Ako niste kreirali račun na našoj aplikaciji, ignorirajte ovaj email.
            </p>
        </div>
        <div class="footer">
            <p>© 2026 RWA Aplikacija - Sva prava pridržana</p>
        </div>
    </div>
</body>
</html>
            `,
        };

        try {
            const info = await this.transporter!.sendMail(emailPoruka);
            console.log("Aktivacijski email poslan:", info.messageId);
            console.log("Primatelj:", STVARNI_EMAIL);
            console.log("Korisnik:", korisnickoIme);
            return true;
        } catch (greska) {
            console.error("Greška pri slanju aktivacijskog emaila:", greska);
            throw greska;
        }
    }

    /**
     * Izračunava datum isteka tokena (24 sata od sada)
     * @returns ISO string datuma isteka
     */
    izracunajDatumIsteka(): string {
        const datum = new Date();
        datum.setHours(datum.getHours() + 24);
        return datum.toISOString();
    }

    /**
     * Vraća trenutni datum kao ISO string
     * @returns ISO string trenutnog datuma
     */
    dajTrenutniDatum(): string {
        return new Date().toISOString();
    }
}

// Singleton instanca email servisa
export const emailServis = new EmailServis();
