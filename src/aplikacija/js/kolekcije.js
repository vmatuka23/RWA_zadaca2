document.addEventListener("DOMContentLoaded", async () => {
  const korisnik = await Zajednicko.inicijaliziraj();

  if (!Zajednicko.provjeriPristup(["korisnik", "moderator", "admin"])) {
    return;
  }

  const kontejnerKolekcija = document.getElementById("kontejnerMojihKolekcija");
  const modalDetalji = document.getElementById("modal-detalji");
  const paginacija = document.getElementById("paginacija");

  let aktivnaKolekcija = null;
  let trenutnaStranica = 1;

  async function ucitajKolekcije(stranica = 1) {
    const podaci = await Zajednicko.posaljiZahtjev(
      `/api/kolekcije?page=${stranica}`,
    );

    if (!podaci) return;

    const kolekcije = podaci.kolekcije || podaci;
    prikaziKolekcije(kolekcije);

    if (podaci.ukupno && podaci.limitPoStranici) {
      const ukupnoStranica = Math.ceil(podaci.ukupno / podaci.limitPoStranici);
      prikaziPaginaciju(ukupnoStranica, stranica);
    }
    trenutnaStranica = stranica;
  }

  function prikaziPaginaciju(ukupnoStranica, aktivnaStranica) {
    if (!paginacija) return;

    paginacija.innerHTML = "";

    if (ukupnoStranica <= 1) return;

    if (aktivnaStranica > 1) {
      const prethodna = kreirajGumbPaginacije(
        "« Prethodna",
        aktivnaStranica - 1,
      );
      paginacija.appendChild(prethodna);
    }

    for (let i = 1; i <= ukupnoStranica; i++) {
      const gumb = kreirajGumbPaginacije(i.toString(), i);
      if (i === aktivnaStranica) {
        gumb.classList.add("aktivna");
        gumb.disabled = true;
      }
      paginacija.appendChild(gumb);
    }

    if (aktivnaStranica < ukupnoStranica) {
      const sljedeca = kreirajGumbPaginacije("Sljedeća »", aktivnaStranica + 1);
      paginacija.appendChild(sljedeca);
    }
  }

  function kreirajGumbPaginacije(tekst, stranica) {
    const gumb = document.createElement("button");
    gumb.textContent = tekst;
    gumb.addEventListener("click", () => ucitajKolekcije(stranica));
    return gumb;
  }

  function prikaziKolekcije(kolekcije) {
    kontejnerKolekcija.innerHTML = "";

    if (!kolekcije || kolekcije.length === 0) {
      kontejnerKolekcija.innerHTML = "<p>Nemate kolekcija.</p>";
      return;
    }

    kolekcije.forEach((kolekcija) => {
      const kartica = kreirajKarticuKolekcije(kolekcija);
      kontejnerKolekcija.appendChild(kartica);
    });
  }

  function kreirajKarticuKolekcije(kolekcija) {
    const kartica = document.createElement("div");
    kartica.className = "kartica-kolekcije";

    const slika = document.createElement("img");
    slika.src = kolekcija.istaknutaSlika || "/slike/placeholder.jpg";
    slika.alt = kolekcija.naziv;

    const naziv = document.createElement("h3");
    naziv.textContent = kolekcija.naziv;

    const metapodaci = document.createElement("div");
    metapodaci.className = "metapodaci";
    metapodaci.innerHTML = `
            <span>Vidljivost: ${kolekcija.javno ? "Javna" : "Privatna"}</span>
            <span>Broj stavki: ${kolekcija.brojStavki || 0}</span>
        `;

    const gumb = document.createElement("button");
    gumb.textContent = "Otvori detalje";
    gumb.addEventListener("click", () => otvoriDetaljeKolekcije(kolekcija));

    kartica.appendChild(slika);
    kartica.appendChild(naziv);
    kartica.appendChild(metapodaci);
    kartica.appendChild(gumb);

    return kartica;
  }

  function formatirajDatum(datum) {
    if (!datum) return "N/A";
    return new Date(datum).toLocaleDateString("hr-HR");
  }

  async function otvoriDetaljeKolekcije(kolekcija) {
    aktivnaKolekcija = kolekcija;

    const sadrzaj = await Zajednicko.posaljiZahtjev(
      `/api/multimedija?kolekcijaId=${kolekcija.id}`,
    );

    prikaziModalDetalja(kolekcija, sadrzaj || []);
  }

  function prikaziModalDetalja(kolekcija, sadrzaj) {
    const postojeciModal = document.getElementById("modal-kolekcija");
    if (postojeciModal) {
      postojeciModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "modal-kolekcija";
    modal.className = "modal";

    const sadrzajModal = document.createElement("div");
    sadrzajModal.className = "modal-sadrzaj";

    const zaglavlje = document.createElement("div");
    zaglavlje.className = "zaglavlje-modala";
    zaglavlje.innerHTML = `
            <h2>${kolekcija.naziv}</h2>
            <button class="gumb-zatvori">×</button>
        `;

    const kontrole = kreirajKontroleKolekcije(kolekcija);
    const listaSadrzaja = kreirajListuSadrzaja(sadrzaj);

    sadrzajModal.appendChild(zaglavlje);
    sadrzajModal.appendChild(kontrole);
    sadrzajModal.appendChild(listaSadrzaja);
    modal.appendChild(sadrzajModal);
    document.body.appendChild(modal);

    zaglavlje.querySelector(".gumb-zatvori").addEventListener("click", () => {
      modal.remove();
      ucitajKolekcije();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        ucitajKolekcije();
      }
    });
  }

  function kreirajKontroleKolekcije(kolekcija) {
    const kontrole = document.createElement("div");
    kontrole.className = "kontrole-kolekcije";

    const gumbVidljivost = document.createElement("button");
    gumbVidljivost.textContent = kolekcija.javno
      ? "Postavi privatno"
      : "Postavi javno";
    gumbVidljivost.addEventListener("click", () =>
      promijeniVidljivost(kolekcija.id, !kolekcija.javno),
    );

    const selectSlika = document.createElement("select");
    selectSlika.id = "select-istaknuta-slika";

    const defaultOpcija = document.createElement("option");
    defaultOpcija.value = "";
    defaultOpcija.textContent = "Odaberi istaknutu sliku";
    selectSlika.appendChild(defaultOpcija);

    const gumbPromijeniSliku = document.createElement("button");
    gumbPromijeniSliku.textContent = "Promijeni istaknutu sliku";
    gumbPromijeniSliku.addEventListener("click", () => {
      const odabranaSlika = selectSlika.value;
      if (odabranaSlika) {
        promijeniIstaknutuSliku(kolekcija.id, odabranaSlika);
      }
    });

    const gumbObrisiKolekciju = document.createElement("button");
    gumbObrisiKolekciju.className = "gumb-obrisi-kolekciju";
    gumbObrisiKolekciju.textContent = "Obriši kolekciju";
    gumbObrisiKolekciju.addEventListener("click", () =>
      obrisiKolekciju(kolekcija.id),
    );

    kontrole.appendChild(gumbVidljivost);
    kontrole.appendChild(selectSlika);
    kontrole.appendChild(gumbPromijeniSliku);
    kontrole.appendChild(gumbObrisiKolekciju);

    return kontrole;
  }

  function kreirajListuSadrzaja(sadrzaj) {
    const lista = document.createElement("div");
    lista.className = "lista-sadrzaja";

    if (!sadrzaj || sadrzaj.length === 0) {
      lista.innerHTML = "<p>Ova kolekcija nema sadržaja.</p>";
      return lista;
    }

    const selectSlika = document.getElementById("select-istaknuta-slika");

    sadrzaj.forEach((stavka) => {
      const element = document.createElement("div");
      element.className = "stavka-sadrzaja";

      const putanja = stavka.putanja || "";
      const tipMultimedije = stavka.tip || "";

      if (
        tipMultimedije.includes("slika") ||
        putanja.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      ) {
        const slika = document.createElement("img");
        slika.src = putanja;
        slika.alt = stavka.naziv || "";
        element.appendChild(slika);

        if (selectSlika) {
          const opcija = document.createElement("option");
          opcija.value = putanja;
          opcija.textContent = stavka.naziv || putanja;
          selectSlika.appendChild(opcija);
        }
      } else if (
        tipMultimedije.includes("video") ||
        putanja.match(/\.(mp4|webm|mov)$/i)
      ) {
        const video = document.createElement("video");
        video.src = putanja;
        video.controls = true;
        element.appendChild(video);
      }

      const gumbObrisi = document.createElement("button");
      gumbObrisi.className = "gumb-obrisi";
      gumbObrisi.textContent = "Obriši";
      gumbObrisi.addEventListener("click", () =>
        obrisiSadrzaj(aktivnaKolekcija.id, stavka.id),
      );

      element.appendChild(gumbObrisi);
      lista.appendChild(element);
    });

    return lista;
  }

  async function promijeniVidljivost(kolekcijaId, javno) {
    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/kolekcije/${kolekcijaId}`,
      {
        method: "PUT",
        body: JSON.stringify({ javno }),
      },
    );

    if (rezultat) {
      Zajednicko.prikaziPoruku("Vidljivost je promijenjena.", "uspjeh");
      aktivnaKolekcija.javno = javno;
      otvoriDetaljeKolekcije(aktivnaKolekcija);
    }
  }

  async function promijeniIstaknutuSliku(kolekcijaId, slikaUrl) {
    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/kolekcije/${kolekcijaId}`,
      {
        method: "PUT",
        body: JSON.stringify({ istaknutaSlika: slikaUrl }),
      },
    );

    if (rezultat) {
      Zajednicko.prikaziPoruku("Istaknuta slika je promijenjena.", "uspjeh");
      aktivnaKolekcija.istaknutaSlika = slikaUrl;
    }
  }

  async function obrisiSadrzaj(kolekcijaId, sadrzajId) {
    if (!confirm("Jeste li sigurni da želite obrisati ovaj sadržaj?")) {
      return;
    }

    const rezultat = await Zajednicko.posaljiZahtjev(
      `/api/multimedija/${sadrzajId}`,
      {
        method: "DELETE",
      },
    );

    if (rezultat !== null) {
      Zajednicko.prikaziPoruku("Sadržaj je obrisan.", "uspjeh");
      otvoriDetaljeKolekcije(aktivnaKolekcija);
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
      const modal = document.getElementById("modal-kolekcija");
      if (modal) modal.remove();
      await ucitajKolekcije(trenutnaStranica);
    }
  }

  await ucitajKolekcije();
});
