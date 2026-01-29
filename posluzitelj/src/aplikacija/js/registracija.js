document.addEventListener("DOMContentLoaded", async () => {
  const korisnik = await Zajednicko.inicijaliziraj();

  if (korisnik) {
    window.location.href = "index.html";
    return;
  }

  const forma = document.getElementById("formaRegistracije");

  if (forma) {
    forma.addEventListener("submit", async (e) => {
      e.preventDefault();
      await obradiRegistraciju();
    });
  }

  const validacijskaPravila = {
    korisnickoIme: {
      regex: /^[a-zA-Z0-9_]{3,20}$/,
      poruka:
        "Korisničko ime mora sadržavati 3-20 alfanumeričkih znakova ili podvlake.",
    },
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      poruka: "Unesite valjanu email adresu.",
    },
    lozinka: {
      regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      poruka:
        "Lozinka mora sadržavati najmanje 8 znakova, veliko slovo, malo slovo i broj.",
    },
    ime: {
      regex: /^[a-zA-ZčćžšđČĆŽŠĐ\s]{2,50}$/,
      poruka: "Ime mora sadržavati 2-50 slova.",
    },
    prezime: {
      regex: /^[a-zA-ZčćžšđČĆŽŠĐ\s]{2,50}$/,
      poruka: "Prezime mora sadržavati 2-50 slova.",
    },
  };

  function validirajPolje(polje, vrijednost) {
    const pravilo = validacijskaPravila[polje];
    if (!pravilo) return { valjan: true };

    const valjan = pravilo.regex.test(vrijednost);
    return { valjan, poruka: valjan ? "" : pravilo.poruka };
  }

  function validirajFormu(podaci) {
    const greske = [];

    for (const [polje, vrijednost] of Object.entries(podaci)) {
      if (polje === "ime" || polje === "prezime") continue;
      const rezultat = validirajPolje(polje, vrijednost);
      if (!rezultat.valjan) {
        greske.push(rezultat.poruka);
      }
    }

    return greske;
  }

  async function obradiRegistraciju() {
    const podaci = {
      korisnickoIme: document.getElementById("korisnickoIme").value.trim(),
      email: document.getElementById("email").value.trim(),
      lozinka: document.getElementById("lozinka").value,
      ime: document.getElementById("ime").value.trim(),
      prezime: document.getElementById("prezime").value.trim(),
    };

    const greske = validirajFormu(podaci);

    if (greske.length > 0) {
      Zajednicko.prikaziPoruku(greske.join(" "), "greska");
      return;
    }

    try {
      const odgovor = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          korisnickoIme: podaci.korisnickoIme,
          email: podaci.email,
          lozinka: podaci.lozinka,
          ime: podaci.ime,
          prezime: podaci.prezime,
        }),
      });

      const rezultat = await odgovor.json();

      if (!odgovor.ok) {
        Zajednicko.prikaziPoruku(
          rezultat.poruka || "Registracija nije uspjela.",
          "greska",
        );
        return;
      }

      Zajednicko.prikaziPoruku(
        "Registracija uspješna! Preusmjeravanje na prijavu...",
        "uspjeh",
      );
      setTimeout(() => {
        window.location.href = "prijava.html";
      }, 2000);
    } catch (greska) {
      Zajednicko.obradiGresku(greska);
    }
  }
});
