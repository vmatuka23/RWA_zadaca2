document.addEventListener("DOMContentLoaded", async () => {
  await Zajednicko.inicijaliziraj();

  const kontejnerKolekcija = document.getElementById("kontejnerKolekcija");
  const paginacija = document.getElementById("paginacija");

  let trenutnaStranica = 1;
  const poStranici = 4;

  async function ucitajJavneKolekcije(stranica = 1) {
    const podaci = await Zajednicko.posaljiZahtjev(
      `/api/kolekcije/javne?page=${stranica}`,
    );

    if (!podaci) return;

    prikaziKolekcije(podaci.kolekcije);
    const ukupnoStranica = Math.ceil(podaci.ukupno / podaci.limitPoStranici);
    prikaziPaginaciju(ukupnoStranica, stranica);
    trenutnaStranica = stranica;
  }

  function prikaziKolekcije(kolekcije) {
    kontejnerKolekcija.innerHTML = "";

    if (!kolekcije || kolekcije.length === 0) {
      kontejnerKolekcija.innerHTML = "<p>Nema dostupnih javnih kolekcija.</p>";
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

    const opis = document.createElement("p");
    opis.textContent = kolekcija.opis || "";

    const gumb = document.createElement("button");
    gumb.textContent = "Pregledaj sadržaj";
    gumb.addEventListener("click", () => otvoriSadrzajKolekcije(kolekcija.id));

    kartica.appendChild(slika);
    kartica.appendChild(naziv);
    kartica.appendChild(opis);
    kartica.appendChild(gumb);

    return kartica;
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
    gumb.addEventListener("click", () => ucitajJavneKolekcije(stranica));
    return gumb;
  }

  async function otvoriSadrzajKolekcije(kolekcijaId) {
    const podaci = await Zajednicko.posaljiZahtjev(
      `/api/multimedija?kolekcijaId=${kolekcijaId}`,
    );

    if (!podaci) return;

    const multimedija = podaci.multimedija || podaci || [];
    prikaziModalSadrzaja(multimedija);
  }

  function prikaziModalSadrzaja(sadrzaj) {
    const postojeciModal = document.getElementById("modal-sadrzaj");
    if (postojeciModal) {
      postojeciModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "modal-sadrzaj";
    modal.className = "modal";

    const sadrzajModal = document.createElement("div");
    sadrzajModal.className = "modal-sadrzaj";

    const gumbZatvori = document.createElement("button");
    gumbZatvori.className = "gumb-zatvori";
    gumbZatvori.textContent = "×";
    gumbZatvori.addEventListener("click", () => modal.remove());

    const listaSadrzaja = document.createElement("div");
    listaSadrzaja.className = "lista-sadrzaja";

    if (!sadrzaj || sadrzaj.length === 0) {
      listaSadrzaja.innerHTML = "<p>Ova kolekcija nema sadržaja.</p>";
    } else {
      sadrzaj.forEach((stavka) => {
        const element = kreirajElementSadrzaja(stavka);
        listaSadrzaja.appendChild(element);
      });
    }

    sadrzajModal.appendChild(gumbZatvori);
    sadrzajModal.appendChild(listaSadrzaja);
    modal.appendChild(sadrzajModal);
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  function kreirajElementSadrzaja(stavka) {
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
    } else if (
      tipMultimedije.includes("video") ||
      putanja.match(/\.(mp4|webm|mov)$/i)
    ) {
      const video = document.createElement("video");
      video.src = putanja;
      video.controls = true;
      element.appendChild(video);
    }

    if (stavka.naziv) {
      const naziv = document.createElement("p");
      naziv.textContent = stavka.naziv;
      element.appendChild(naziv);
    }

    return element;
  }

  await ucitajJavneKolekcije();
});
