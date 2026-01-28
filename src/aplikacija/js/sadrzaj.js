document.addEventListener("DOMContentLoaded", async () => {
  const korisnik = await Zajednicko.inicijaliziraj();

  if (!Zajednicko.provjeriPristup(["korisnik", "moderator", "admin"])) {
    return;
  }

  const formaPretraga = document.getElementById("formaPretrageTMDB");
  const rezultatiPretraga = document.getElementById(
    "kontejnerRezultataPretrage",
  );
  const formaUpload = document.getElementById("formaUcitavanja");

  let selectKolekcija = document.getElementById("odabirKolekcije");
  if (!selectKolekcija) {
    selectKolekcija = document.createElement("select");
    selectKolekcija.id = "odabirKolekcije";
    const sekcijaTMDB = document.getElementById("sekcijaPretrageTMDB");
    if (sekcijaTMDB) {
      const wrapper = document.createElement("div");
      wrapper.id = "grupaOdabirKolekcije";
      const label = document.createElement("label");
      label.setAttribute("for", "odabirKolekcije");
      label.textContent = "Odaberi kolekciju za dodavanje:";
      wrapper.appendChild(label);
      wrapper.appendChild(selectKolekcija);
      sekcijaTMDB.insertBefore(wrapper, sekcijaTMDB.firstChild.nextSibling);
    }
  }

  const MAKSIMALNA_VELICINA_DATOTEKE = 1 * 1024 * 1024;

  async function ucitajKolekcije() {
    const podaci = await Zajednicko.posaljiZahtjev("/api/kolekcije?all=true");

    if (!podaci || !selectKolekcija) return;

    const kolekcije = podaci.kolekcije || podaci;
    selectKolekcija.innerHTML = '<option value="">Odaberi kolekciju</option>';

    kolekcije.forEach((kolekcija) => {
      const opcija = document.createElement("option");
      opcija.value = kolekcija.id;
      opcija.textContent = kolekcija.naziv;
      selectKolekcija.appendChild(opcija);
    });
  }

  if (formaPretraga) {
    formaPretraga.addEventListener("submit", async (e) => {
      e.preventDefault();
      await pretraziTMDB();
    });
  }

  async function pretraziTMDB() {
    const upit = document.getElementById("unosPretrage").value.trim();

    if (!upit) {
      Zajednicko.prikaziPoruku("Unesite pojam za pretragu.", "greska");
      return;
    }

    const podaci = await Zajednicko.posaljiZahtjev(
      `/api/tmdb/filmovi?trazi=${encodeURIComponent(upit)}&stranica=1`,
    );

    if (!podaci) return;

    prikaziRezultatePretraga(podaci.results);
  }

  function prikaziRezultatePretraga(rezultati) {
    rezultatiPretraga.innerHTML = "";

    if (!rezultati || rezultati.length === 0) {
      rezultatiPretraga.innerHTML = "<p>Nema rezultata pretrage.</p>";
      return;
    }

    rezultati.forEach((rezultat) => {
      const kartica = kreirajKarticuRezultata(rezultat);
      rezultatiPretraga.appendChild(kartica);
    });
  }

  function kreirajKarticuRezultata(rezultat) {
    const kartica = document.createElement("div");
    kartica.className = "kartica-rezultata stavkaRezultataPretrage";

    const naslov = document.createElement("h3");
    naslov.className = "nazivRezultata";
    naslov.textContent = rezultat.title || rezultat.original_title || "";

    const opis = document.createElement("p");
    opis.textContent = rezultat.overview
      ? rezultat.overview.substring(0, 150) + "..."
      : "";

    kartica.appendChild(naslov);
    kartica.appendChild(opis);

    if (rezultat.poster_path) {
      const kontejnerSlika = document.createElement("div");
      kontejnerSlika.className = "kontejner-slika";

      const slikaEl = document.createElement("img");
      slikaEl.src = `https://image.tmdb.org/t/p/w200${rezultat.poster_path}`;
      slikaEl.alt = rezultat.title || "";
      slikaEl.className = "slikaRezultata";

      const gumbDodaj = document.createElement("button");
      gumbDodaj.className = "gumbDodajUKolekciju";
      gumbDodaj.textContent = "Dodaj u kolekciju";
      gumbDodaj.addEventListener("click", () =>
        dodajUKolekciju(
          "slika",
          `https://image.tmdb.org/t/p/original${rezultat.poster_path}`,
          rezultat.title,
        ),
      );

      kontejnerSlika.appendChild(slikaEl);
      kontejnerSlika.appendChild(gumbDodaj);
      kartica.appendChild(kontejnerSlika);
    }

    return kartica;
  }

  async function dodajUKolekciju(tip, url, naziv) {
    const kolekcijaId = selectKolekcija.value;

    if (!kolekcijaId) {
      Zajednicko.prikaziPoruku("Molimo odaberite kolekciju.", "greska");
      return;
    }

    const rezultat = await Zajednicko.posaljiZahtjev(`/api/multimedija/url`, {
      method: "POST",
      body: JSON.stringify({
        naziv: naziv,
        tip: tip,
        putanja: url,
        kolekcijaId: parseInt(kolekcijaId),
        javno: true,
      }),
    });

    if (rezultat) {
      Zajednicko.prikaziPoruku("Sadržaj je dodan u kolekciju.", "uspjeh");
    }
  }

  if (formaUpload) {
    formaUpload.addEventListener("submit", async (e) => {
      e.preventDefault();
      await uploadMedija();
    });
  }

  async function uploadMedija() {
    const kolekcijaId = selectKolekcija.value;
    const datotekaInput = document.getElementById("ucitavanjeDatoteke");
    const datoteka = datotekaInput.files[0];

    if (!kolekcijaId) {
      Zajednicko.prikaziPoruku("Molimo odaberite kolekciju.", "greska");
      return;
    }

    if (!datoteka) {
      Zajednicko.prikaziPoruku("Molimo odaberite datoteku.", "greska");
      return;
    }

    if (datoteka.size > MAKSIMALNA_VELICINA_DATOTEKE) {
      Zajednicko.prikaziPoruku(
        "Datoteka je prevelika. Maksimalna veličina je 1MB.",
        "greska",
      );
      return;
    }

    const dozvoljeniTipovi = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];
    if (!dozvoljeniTipovi.includes(datoteka.type)) {
      Zajednicko.prikaziPoruku("Nepodržani format datoteke.", "greska");
      return;
    }

    const naziv = document.getElementById("naslovMultimedije").value.trim();
    const autor = document.getElementById("autor").value.trim();

    if (!naziv) {
      Zajednicko.prikaziPoruku("Molimo unesite naslov multimedije.", "greska");
      return;
    }

    const formData = new FormData();
    formData.append("datoteka", datoteka);
    formData.append("naziv", naziv);
    formData.append("kolekcijaId", kolekcijaId);
    formData.append("autor", autor);

    try {
      const odgovor = await fetch(`/api/multimedija`, {
        method: "POST",
        body: formData,
      });

      if (!odgovor.ok) {
        const greska = await odgovor.json();
        Zajednicko.prikaziPoruku(
          greska.poruka || "Upload nije uspio.",
          "greska",
        );
        return;
      }

      Zajednicko.prikaziPoruku("Datoteka je uspješno uploadana.", "uspjeh");
      datotekaInput.value = "";
    } catch (greska) {
      Zajednicko.obradiGresku(greska);
    }
  }

  await ucitajKolekcije();
});
