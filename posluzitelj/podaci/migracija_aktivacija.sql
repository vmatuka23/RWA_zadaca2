-- Migracija za dodavanje aktivacijske funkcionalnosti
-- Izvršiti na postojećoj bazi podataka

-- 1. Dodaj stupac 'aktiviran' u tablicu korisnik (ako ne postoji)
-- SQLite ne podržava IF NOT EXISTS za ALTER TABLE, pa koristimo pristup s try-catch u kodu
-- ili ručno provjeravamo postoji li stupac

-- Dodaj stupac aktiviran - svi postojeći korisnici dobivaju vrijednost 1 (aktivirani)
ALTER TABLE korisnik ADD COLUMN aktiviran INTEGER DEFAULT 1 CHECK(aktiviran IN (0,1));

-- 2. Kreiraj tablicu za aktivacijske tokene
CREATE TABLE IF NOT EXISTS "aktivacijski_token"(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "korisnikId" INTEGER NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "datumKreiranja" TEXT NOT NULL,
  "datumIsteka" TEXT NOT NULL,
  "iskoristen" INTEGER DEFAULT 0 CHECK("iskoristen" IN (0,1)),
  CONSTRAINT "fk_korisnik_aktivacija"
    FOREIGN KEY("korisnikId")
    REFERENCES "korisnik"("id")
);

-- 3. Kreiraj indeks za brže pretraživanje tokena
CREATE INDEX IF NOT EXISTS "idx_aktivacijski_token_token" ON "aktivacijski_token" ("token");
CREATE INDEX IF NOT EXISTS "idx_aktivacijski_token_korisnik" ON "aktivacijski_token" ("korisnikId");
