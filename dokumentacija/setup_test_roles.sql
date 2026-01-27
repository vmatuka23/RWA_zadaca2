-- Setup script for test users with proper roles
-- Run this after registering users through the /register endpoint

-- Update admin1 to have admin role
UPDATE korisnik SET uloga = 'admin' WHERE korisnickoIme = 'admin1';

-- Update moderator1 to have moderator role
UPDATE korisnik SET uloga = 'moderator' WHERE korisnickoIme = 'moderator1';

-- Verify the updates
SELECT id, korisnickoIme, uloga FROM korisnik WHERE korisnickoIme IN ('admin1', 'moderator1', 'korisnik1', 'korisnik2');
