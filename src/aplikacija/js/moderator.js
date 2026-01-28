document.addEventListener("DOMContentLoaded", async () => {
  const korisnik = await Zajednicko.inicijaliziraj();

  if (!Zajednicko.provjeriPristup(["moderator", "admin"])) {
    return;
  }

  const formaKolekcija = document.getElementById("formaKreiranjaKolekcije");
  const tabelaKolekcija = document.getElementById("tabelaKolekcija");
  const listaKolekcija = tabelaKolekcija
    ? tabelaKolekcija.querySelector("tbody")
    : null;
  const formaDodjela = document.getElementById("formaDodjeleKorisnika");

  if (formaKolekcija) {
    formaKolekcija.addEventListener("submit", async (e) => {
      e.preventDefault();
      await kreirajKolekciju();
    });
  }

  async function kreirajKolekciju() {
    const naziv = document.getElementById("nazivKolekcije").value.trim();
    const opis = document.getElementById("opisKolekcije").value.trim();
    const vidljivost = document.getElementById("vidljivostKolekcije").value;
    const istaknutaSlikaInput = document.getElementById(
      "istaknutaSlikaKolekcije",
    );
    const istaknutaSlika = istaknutaSlikaInput
      ? istaknutaSlikaInput.value.trim()
      : "";
    const javno = vidljivost === "javna";

    if (!naziv) {
      Zajednicko.prikaziPoruku("Unesite naziv kolekcije.", "greska");
      return;
    }

    const rezultat = await Zajednicko.posaljiZahtjev("/api/kolekcije", {
      method: "POST",
      body: JSON.stringify({ naziv, opis, javno, istaknutaSlika }),
    });

    if (rezultat) {
      Zajednicko.prikaziPoruku("Kolekcija je kreirana.", "uspjeh");
      formaKolekcija.reset();
      await ucitajKolekcije();
    }
  }

  async function ucitajKolekcije() {
    const podaci = await Zajednicko.posaljiZahtjev("/api/kolekcije?all=true");

    if (!podaci) return;

    const kolekcije = podaci.kolekcije || podaci;
    prikaziKolekcije(kolekcije);
    popuniSelectKolekcija(kolekcije);
  }

  function prikaziKolekcije(kolekcije) {
    if (!listaKolekcija) return;

    listaKolekcija.innerHTML = "";

    if (!kolekcije || kolekcije.length === 0) {
      listaKolekcija.innerHTML =
        "<tr><td colspan='3'>Nema kolekcija.</td></tr>";
      return;
    }

    kolekcije.forEach((kolekcija) => {
      const red = document.createElement("tr");
      red.innerHTML = `
                <td>${kolekcija.naziv}</td>
                <td>${kolekcija.javno ? "Javna" : "Privatna"}</td>
                <td>
                  <button class="gumbUredi" data-id="${kolekcija.id}" data-javno="${kolekcija.javno ? 1 : 0}">Uredi</button>
                  <button class="gumbBrisi" data-id="${kolekcija.id}">Obriši</button>
                </td>
            `;
      listaKolekcija.appendChild(red);
    });

    // Add event listeners for edit buttons
    listaKolekcija.querySelectorAll(".gumbUredi").forEach((gumb) => {
      gumb.addEventListener("click", async (e) => {
        const id = parseInt(e.target.dataset.id);
        const trenutnoJavno = e.target.dataset.javno === "1";
        await promijeniVidljivostKolekcije(id, !trenutnoJavno);
      });
    });

    // Add event listeners for delete buttons
    listaKolekcija.querySelectorAll(".gumbBrisi").forEach((gumb) => {
      gumb.addEventListener("click", async (e) => {
        const id = parseInt(e.target.dataset.id);
        await obrisiKolekciju(id);
      });
    });
  }

  async function promijeniVidljivostKolekcije(kolekcijaId, javno) {
    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/kolekcije/${kolekcijaId}`,
      {
        method: "PUT",
        body: JSON.stringify({ javno }),
      },
    );

    if (rezultat) {
      Zajednicko.prikaziPoruku(
        "Vidljivost kolekcije je promijenjena.",
        "uspjeh",
      );
      await ucitajKolekcije();
    }
  }

  async function obrisiKolekciju(kolekcijaId) {
    if (
      !confirm(
        "Jeste li sigurni da želite obrisati ovu kolekciju? Sav sadržaj će biti izgubljen.",
      )
    ) {
      return;
    }

    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/kolekcije/${kolekcijaId}`,
      {
        method: "DELETE",
      },
    );

    if (rezultat !== null) {
      Zajednicko.prikaziPoruku("Kolekcija je obrisana.", "uspjeh");
      await ucitajKolekcije();
    }
  }

  function popuniSelectKolekcija(kolekcije) {
    const selectKolekcija = document.getElementById("odabirKolekcije");
    if (!selectKolekcija) return;

    selectKolekcija.innerHTML = '<option value="">Odaberi kolekciju</option>';

    kolekcije.forEach((kolekcija) => {
      const opcija = document.createElement("option");
      opcija.value = kolekcija.id;
      opcija.textContent = kolekcija.naziv;
      selectKolekcija.appendChild(opcija);
    });
  }

  async function ucitajKorisnike() {
    const korisnici = await Zajednicko.posaljiZahtjev("/api/korisnici");

    if (!korisnici) return;

    popuniSelectKorisnika(korisnici);
  }

  function popuniSelectKorisnika(korisnici) {
    const selectKorisnik = document.getElementById("odabirKorisnika");
    if (!selectKorisnik) return;

    selectKorisnik.innerHTML = '<option value="">Odaberi korisnika</option>';

    korisnici.forEach((korisnik) => {
      const opcija = document.createElement("option");
      opcija.value = korisnik.id;
      opcija.textContent = `${korisnik.korisnickoIme} (${korisnik.ime} ${korisnik.prezime})`;
      selectKorisnik.appendChild(opcija);
    });
  }

  if (formaDodjela) {
    formaDodjela.addEventListener("submit", async (e) => {
      e.preventDefault();
      await dodjeliKorisnika();
    });
  }

  async function dodjeliKorisnika() {
    const kolekcijaId = document.getElementById("odabirKolekcije").value;
    const korisnikId = document.getElementById("odabirKorisnika").value;

    if (!kolekcijaId || !korisnikId) {
      Zajednicko.prikaziPoruku("Odaberite kolekciju i korisnika.", "greska");
      return;
    }

    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/korisnik-kolekcija`,
      {
        method: "POST",
        body: JSON.stringify({
          kolekcijaId: parseInt(kolekcijaId),
          korisnikId: parseInt(korisnikId),
        }),
      },
    );

    if (rezultat) {
      Zajednicko.prikaziPoruku("Korisnik je dodan u kolekciju.", "uspjeh");
      formaDodjela.reset();
      await ucitajKolekcije();
    }
  }

  await ucitajKolekcije();
  await ucitajKorisnike();
});
