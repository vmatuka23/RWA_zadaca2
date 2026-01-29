document.addEventListener("DOMContentLoaded", async () => {
  const korisnik = await Zajednicko.inicijaliziraj();

  if (!Zajednicko.provjeriPristup(["admin"])) {
    return;
  }

  const tablicaKorisnika = document.getElementById("tabelaKorisnika");
  const tijelo = tablicaKorisnika
    ? tablicaKorisnika.querySelector("tbody")
    : null;

  async function ucitajKorisnike() {
    const korisnici = await Zajednicko.posaljiZahtjev("/api/korisnici");

    if (!korisnici) return;

    prikaziKorisnike(korisnici);
  }

  function prikaziKorisnike(korisnici) {
    if (!tijelo) return;

    tijelo.innerHTML = "";

    if (!korisnici || korisnici.length === 0) {
      tijelo.innerHTML = '<tr><td colspan="6">Nema korisnika.</td></tr>';
      return;
    }

    const trenutniKorisnik = Zajednicko.dohvatiTrenutnogKorisnika();

    korisnici.forEach((k) => {
      const red = kreirajRedKorisnika(k, trenutniKorisnik);
      tijelo.appendChild(red);
    });
  }

  function kreirajRedKorisnika(k, trenutniKorisnik) {
    const red = document.createElement("tr");

    const jeTrenutni = trenutniKorisnik && trenutniKorisnik.id === k.id;

    red.innerHTML = `
            <td>${k.korisnickoIme}</td>
            <td>${k.ime} ${k.prezime}</td>
            <td>${k.email}</td>
            <td>${k.uloga}</td>
            <td>${k.blokiran ? "Da" : "Ne"}</td>
            <td class="akcije"></td>
        `;

    const celija = red.querySelector(".akcije");

    if (!jeTrenutni) {
      const gumbBlokiranje = document.createElement("button");
      gumbBlokiranje.textContent = k.blokiran ? "Odblokiraj" : "Blokiraj";
      gumbBlokiranje.addEventListener("click", () =>
        promjeniBlokiranjeKorisnika(k.id, !k.blokiran),
      );
      celija.appendChild(gumbBlokiranje);

      const selectUloga = document.createElement("select");
      ["korisnik", "moderator", "admin"].forEach((uloga) => {
        const opcija = document.createElement("option");
        opcija.value = uloga;
        opcija.textContent = uloga.charAt(0).toUpperCase() + uloga.slice(1);
        if (uloga === k.uloga) opcija.selected = true;
        selectUloga.appendChild(opcija);
      });

      const gumbUloga = document.createElement("button");
      gumbUloga.textContent = "Promijeni ulogu";
      gumbUloga.addEventListener("click", () =>
        promjeniUloguKorisnika(k.id, selectUloga.value),
      );

      celija.appendChild(selectUloga);
      celija.appendChild(gumbUloga);
    } else {
      celija.textContent = "Trenutni korisnik";
    }

    return red;
  }

  async function promjeniBlokiranjeKorisnika(korisnikId, blokiran) {
    const akcija = blokiran ? "blokirati" : "odblokirati";

    if (!confirm(`Jeste li sigurni da želite ${akcija} ovog korisnika?`)) {
      return;
    }

    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/korisnici/${korisnikId}/blokiraj`,
      {
        method: "PUT",
        body: JSON.stringify({ blokiran }),
      },
    );

    if (rezultat) {
      Zajednicko.prikaziPoruku(
        `Korisnik je ${blokiran ? "blokiran" : "odblokiran"}.`,
        "uspjeh",
      );
      await ucitajKorisnike();
    }
  }

  async function promjeniUloguKorisnika(korisnikId, novaUloga) {
    if (
      !confirm(
        `Jeste li sigurni da želite promijeniti ulogu korisnika u "${novaUloga}"?`,
      )
    ) {
      return;
    }

    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/korisnici/${korisnikId}/uloga`,
      {
        method: "PUT",
        body: JSON.stringify({ novaUloga: novaUloga }),
      },
    );

    if (rezultat) {
      Zajednicko.prikaziPoruku("Uloga korisnika je promijenjena.", "uspjeh");
      await ucitajKorisnike();
    }
  }

  await ucitajKorisnike();
});
