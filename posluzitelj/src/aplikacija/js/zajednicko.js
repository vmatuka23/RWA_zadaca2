const Zajednicko = (function () {
  let trenutniKorisnik = null;

  async function dohvatiKorisnika() {
    try {
      const odgovor = await fetch("/korisnik");
      if (odgovor.ok) {
        trenutniKorisnik = await odgovor.json();
        return trenutniKorisnik;
      }
      trenutniKorisnik = null;
      return null;
    } catch (greska) {
      obradiGresku(greska);
      return null;
    }
  }

  function dohvatiTrenutnogKorisnika() {
    return trenutniKorisnik;
  }

  async function odjava() {
    try {
      const odgovor = await fetch("/logout", { method: "POST" });
      if (odgovor.ok) {
        trenutniKorisnik = null;
        window.location.href = "index.html";
      }
    } catch (greska) {
      obradiGresku(greska);
    }
  }

  function prikaziNavigaciju(uloga) {
    const gostElementi = document.querySelectorAll('[data-uloga="gost"]');
    const korisnikElementi = document.querySelectorAll(
      '[data-uloga="korisnik"]',
    );
    const moderatorElementi = document.querySelectorAll(
      '[data-uloga="moderator"]',
    );
    const adminElementi = document.querySelectorAll('[data-uloga="admin"]');
    const prijavljenElementi = document.querySelectorAll(
      '[data-uloga="prijavljen"]',
    );

    gostElementi.forEach((el) => (el.style.display = uloga ? "none" : ""));
    prijavljenElementi.forEach(
      (el) => (el.style.display = uloga ? "" : "none"),
    );
    korisnikElementi.forEach((el) => (el.style.display = uloga ? "" : "none"));

    const jeModerator = uloga === "moderator" || uloga === "admin";
    moderatorElementi.forEach(
      (el) => (el.style.display = jeModerator ? "" : "none"),
    );

    adminElementi.forEach(
      (el) => (el.style.display = uloga === "admin" ? "" : "none"),
    );
  }

  function provjeriPristup(dozvoljeneUloge) {
    const korisnik = dohvatiTrenutnogKorisnika();

    if (dozvoljeneUloge.includes("gost") && !korisnik) {
      return true;
    }

    if (!korisnik) {
      prikaziPorukuIPrsmjeri(
        "Morate biti prijavljeni za pristup ovoj stranici.",
      );
      return false;
    }

    if (dozvoljeneUloge.includes(korisnik.uloga)) {
      return true;
    }

    prikaziPorukuIPrsmjeri("Nemate ovlasti za pristup ovoj stranici.");
    return false;
  }

  function prikaziPorukuIPrsmjeri(poruka) {
    alert(poruka);
    window.location.href = "index.html";
  }

  function obradiGresku(greska, statusKod = null) {
    console.error(greska);

    if (statusKod === 401) {
      prikaziPorukuIPrsmjeri("Sesija je istekla. Molimo prijavite se ponovno.");
      return;
    }

    if (statusKod === 403) {
      prikaziPorukuIPrsmjeri("Nemate ovlasti za ovu radnju.");
      return;
    }

    if (statusKod === 404) {
      prikaziPoruku("Traženi resurs nije pronađen.", "greska");
      return;
    }

    prikaziPoruku("Došlo je do greške. Pokušajte ponovno.", "greska");
  }

  function prikaziPoruku(tekst, tip = "info") {
    const postojecaPoruka = document.querySelector(".poruka-obavijest");
    if (postojecaPoruka) {
      postojecaPoruka.remove();
    }

    const poruka = document.createElement("div");
    poruka.className = `poruka-obavijest poruka-${tip}`;
    poruka.textContent = tekst;
    document.body.insertBefore(poruka, document.body.firstChild);

    setTimeout(() => poruka.remove(), 5000);
  }

  async function posaljiZahtjev(url, opcije = {}) {
    try {
      const odgovor = await fetch(url, {
        ...opcije,
        headers: {
          "Content-Type": "application/json",
          ...opcije.headers,
        },
      });

      if (!odgovor.ok) {
        obradiGresku(new Error(`HTTP ${odgovor.status}`), odgovor.status);
        return null;
      }

      const contentType = odgovor.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await odgovor.json();
      }

      return await odgovor.text();
    } catch (greska) {
      obradiGresku(greska);
      return null;
    }
  }

  async function inicijaliziraj() {
    await dohvatiKorisnika();
    const korisnik = dohvatiTrenutnogKorisnika();
    prikaziNavigaciju(korisnik ? korisnik.uloga : null);

    const gumbOdjava = document.getElementById("gumbOdjava");
    if (gumbOdjava) {
      gumbOdjava.addEventListener("click", async (e) => {
        e.preventDefault();
        await odjava();
      });
    }

    return korisnik;
  }

  return {
    inicijaliziraj,
    dohvatiKorisnika,
    dohvatiTrenutnogKorisnika,
    odjava,
    provjeriPristup,
    obradiGresku,
    prikaziPoruku,
    posaljiZahtjev,
  };
})();
