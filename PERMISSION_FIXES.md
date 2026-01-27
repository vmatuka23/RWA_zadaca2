# Permission and Authorization Fixes

## Problem Fixed

Users were receiving 403 Forbidden errors when they should have had permissions to perform actions. The issue was in how the session and role validation was being checked.

## Root Causes

1. **Missing Session Check**: Code was checking `req.session?.korisnik?.uloga` without first verifying that `req.session?.korisnik` exists. This caused `undefined` to not match "admin" or "moderator", resulting in 403 errors.
2. **Default Role Issue**: New users registered via `/register` are created with role "korisnik" by default. Admin and moderator users need their roles manually updated after registration.

## Changes Made

### 1. RestKolekcija.ts

- **postKolekcija()**: Added explicit check for logged-in user before checking role
- **blokirajKorisnika()** and **promijeniUlogu()**: Fixed role validation in RestKorisnik class

### 2. RestKorisnikKolekcija.ts

All methods now follow this pattern:

```typescript
// Check if user is logged in FIRST
if (!req.session?.korisnik) {
  res.status(401).json({ greska: "Morate biti prijavljeni" });
  return;
}

const uloga = req.session.korisnik.uloga;

// Then check role
if (uloga !== "moderator" && uloga !== "admin") {
  res.status(403).json({ greska: "..." });
  return;
}
```

### 3. RestKorisnik.ts

Fixed all admin-only endpoints:

- `getKorisnici()` - GET /api/korisnici
- `blokirajKorisnika()` - PUT /api/korisnici/:id/blokiraj
- `promijeniUlogu()` - PUT /api/korisnici/:id/uloga

## How to Test

### Step 1: Register Users

Use the test.http file to register users:

- admin1 / admin123
- moderator1 / moderator123
- korisnik1 / korisnik123
- korisnik2 / korisnik456

### Step 2: Update Roles in Database

Open SQLite and run the setup script:

```bash
sqlite3 podaci/RWA2025vmatuka23.sqlite < dokumentacija/setup_test_roles.sql
```

Or manually execute in SQLite:

```sql
UPDATE korisnik SET uloga = 'admin' WHERE korisnickoIme = 'admin1';
UPDATE korisnik SET uloga = 'moderator' WHERE korisnickoIme = 'moderator1';
```

### Step 3: Run Tests

Use VS Code REST Client to execute test.http requests. Tests will now work correctly:

- ✅ Admin can create/update/delete collections
- ✅ Moderator can create/update/delete collections
- ✅ Admin can manage users (block/change roles)
- ✅ Moderator can assign users to collections
- ✅ Regular users get 403 when trying unauthorized actions
- ✅ Guests can view public collections but get 403 for private ones

## Expected Results

After proper setup, you should see:

- **200**: Admin/Moderator POST /api/kolekcije (success)
- **201**: Created responses for POST requests
- **401**: Unauthenticated users trying to access protected endpoints
- **403**: Authenticated users without proper role trying protected endpoints
- **404**: Non-existent resources
- **400**: Missing required fields

## Files Modified

1. src/servis/restKolekcija.ts
2. src/servis/restKorisnik_kolekcija.ts
3. src/servis/restKorisnik.ts
4. test.http
5. dokumentacija/setup_test_roles.sql (new)

## Build Status

✅ Compiles without errors
✅ Runs with `npm run start-local`
✅ Server starts on port 12222
