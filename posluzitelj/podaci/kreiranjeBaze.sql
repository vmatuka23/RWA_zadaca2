-- Creator:       MySQL Workbench 8.0.45/ExportSQLite Plugin 0.1.0
-- Author:        Vigo
-- Caption:       New Model
-- Project:       Name of the project
-- Changed:       2026-01-23 17:16
-- Created:       2026-01-23 13:38

-- Schema: vmatuka23
BEGIN;
CREATE TABLE "korisnik"(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "korisnickoIme" TEXT NOT NULL,
  "lozinkaHash" TEXT NOT NULL,
  "sol" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "uloga" TEXT NOT NULL CHECK("uloga" IN('gost', 'korisnik', 'moderator', 'admin')),
  "blokiran" INTEGER DEFAULT 0 CHECK("blokiran" IN (0,1)),
  "aktiviran" INTEGER DEFAULT 0 CHECK("aktiviran" IN (0,1)),
  "ime" TEXT,
  "prezime" TEXT,
  "datumRegistracije" TEXT,
  CONSTRAINT "korisnickoIme_UNIQUE"
    UNIQUE("korisnickoIme"),
  CONSTRAINT "email_UNIQUE"
    UNIQUE("email")
);

-- Tablica za aktivacijske tokene
CREATE TABLE "aktivacijski_token"(
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
CREATE TABLE "kolekcija"(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "naziv" TEXT NOT NULL,
  "opis" TEXT,
  "istaknutaSlika" TEXT,
  "javno" INTEGER DEFAULT 0 CHECK("javno" IN (0,1))
);
CREATE TABLE "korisnik_kolekcija"(
  "korisnikId" INTEGER NOT NULL,
  "kolekcijaId" INTEGER NOT NULL,
  PRIMARY KEY("korisnikId","kolekcijaId"),
  CONSTRAINT "fk_korisnik"
    FOREIGN KEY("korisnikId")
    REFERENCES "korisnik"("id"),
  CONSTRAINT "fk_kolekcija"
    FOREIGN KEY("kolekcijaId")
    REFERENCES "kolekcija"("id")
);
CREATE INDEX "korisnik_kolekcija.fk_kolekcija_idx" ON "korisnik_kolekcija" ("kolekcijaId");
CREATE TABLE "multimedija"(
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "naziv" TEXT NOT NULL,
  "tip" TEXT,
  "putanja" TEXT,
  "kolekcijaId" INTEGER NOT NULL,
  "javno" INTEGER DEFAULT 0 CHECK("javno" IN (0,1)),
  "datumDodavanja" TEXT,
  "autor" TEXT,
  CONSTRAINT "fk_kolekcija"
    FOREIGN KEY("kolekcijaId")
    REFERENCES "kolekcija"("id")
);
CREATE INDEX "multimedija.fk_kolekcija_Idx" ON "multimedija" ("kolekcijaId");
COMMIT;
