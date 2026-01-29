document.addEventListener("DOMContentLoaded", async () => {
  const korisnik = await Zajednicko.inicijaliziraj();

  if (korisnik) {
    preusmjeriPoUlozi(korisnik.uloga);
    return;
  }

  const forma = document.getElementById("formaPrijave");

  if (forma) {
    forma.addEventListener("submit", async (e) => {
      e.preventDefault();
      await obradiPrijavu();
    });
  }

  async function obradiPrijavu() {
    const korisnickoIme = document.getElementById("korisnickoIme").value.trim();
    const lozinka = document.getElementById("lozinka").value;

    if (!korisnickoIme || !lozinka) {
      Zajednicko.prikaziPoruku(
        "Molimo unesite korisničko ime i lozinku.",
        "greska",
      );
      return;
    }

    try {
      const odgovor = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ korisnickoIme, lozinka }),
      });

      const podaci = await odgovor.json();

      if (!odgovor.ok) {
        if (odgovor.status === 403) {
          Zajednicko.prikaziPoruku(
            "Vaš račun je blokiran. Kontaktirajte administratora.",
            "greska",
          );
          return;
        }
        Zajednicko.prikaziPoruku(
          podaci.greska || "Neispravni podaci za prijavu.",
          "greska",
        );
        return;
      }

      preusmjeriPoUlozi(podaci.korisnik.uloga);
    } catch (greska) {
      Zajednicko.obradiGresku(greska);
    }
  }

  function preusmjeriPoUlozi(uloga) {
    switch (uloga) {
      case "admin":
        window.location.href = "korisnici.html";
        break;
      case "moderator":
        window.location.href = "moderator.html";
        break;
      default:
        window.location.href = "kolekcije.html";
    }
  }
});
