//Autentifikacijske forme - prijava.html i registracija.html

//Priprema forme za prijavu
function pripremiFormaPrijave() {
  const forma = document.getElementById("formaPrijave");
  if (!forma) return;

  forma.addEventListener("submit", async (e) => {
    e.preventDefault();

    const korisnickoIme = document.getElementById("korisnickoIme").value.trim();
    const lozinka = document.getElementById("lozinka").value.trim();

    if (!korisnickoIme || !lozinka) {
      prikaziGresku(
        "Molimo unesite korisničko ime i lozinku",
        "porukaGreskaPrijave",
      );
      return;
    }

    try {
      const odgovor = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ korisnickoIme, lozinka }),
      });

      if (odgovor.ok) {
        window.location.href = "/";
      } else {
        const podaci = await odgovor.json();
        prikaziGresku(
          podaci.greska || "Greška pri prijavi",
          "porukaGreskaPrijave",
        );
      }
    } catch (err) {
      console.error("Greška pri prijavi:", err);
      prikaziGresku(
        "Greška pri prijavi. Pokušajte ponovno.",
        "porukaGreskaPrijave",
      );
    }
  });
}

//Priprema forme za registraciju
function pripremiFormaRegistracije() {
  const forma = document.getElementById("formaRegistracije");
  if (!forma) return;

  forma.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const korisnickoIme = document.getElementById("korisnickoIme").value.trim();
    const lozinka = document.getElementById("lozinka").value.trim();
    const ime = document.getElementById("ime").value.trim();
    const prezime = document.getElementById("prezime").value.trim();

    // Validacija
    if (!email || !korisnickoIme || !lozinka) {
      prikaziGresku(
        "Email, korisničko ime i lozinka su obavezni",
        "porukeValidacije",
      );
      return;
    }

    if (lozinka.length < 6) {
      prikaziGresku(
        "Lozinka mora imati najmanje 6 karaktera",
        "porukeValidacije",
      );
      return;
    }

    if (!email.includes("@")) {
      prikaziGresku("Unesite ispravnu email adresu", "porukeValidacije");
      return;
    }

    try {
      const odgovor = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          korisnickoIme,
          lozinka,
          email,
          ime: ime || null,
          prezime: prezime || null,
        }),
      });

      if (odgovor.ok) {
        alert("Registracija uspješna! Sada se možete prijaviti.");
        window.location.href = "/prijava";
      } else {
        const podaci = await odgovor.json();
        prikaziGresku(
          podaci.greska || "Greška pri registraciji",
          "porukeValidacije",
        );
      }
    } catch (err) {
      console.error("Greška pri registraciji:", err);
      prikaziGresku(
        "Greška pri registraciji. Pokušajte ponovno.",
        "porukeValidacije",
      );
    }
  });
}

// Inicijalizacija pri učitavanju
document.addEventListener("DOMContentLoaded", () => {
  pripremiFormaPrijave();
  pripremiFormaRegistracije();
});
