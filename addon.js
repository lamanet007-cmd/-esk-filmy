const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fs = require("node:fs");
const path = require("node:path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "films.json"), "utf8"));
const films = data.films || [];

const manifest = {
  id: "cz.filmovy.zebricek",
  version: "1.0.0",
  name: "Český filmový žebříček",
  description: "Katalog českých a československých filmů. Plakáty a metadata z Cinemeta, pořadí podle lokálně evidovaného skóre ČSFD.",
  resources: ["catalog", "meta"],
  types: ["movie"],
  idPrefixes: ["tt", "czfilm:"],
  catalogs: [
    { type: "movie", id: "cz_top", name: "České filmy – žebříček ČSFD", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "cz_classics", name: "Československá klasika", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "cz_slovak", name: "Slovenské filmy", extra: [{ name: "search", isRequired: false }] },
    { type: "movie", id: "cz_modern", name: "České filmy po roce 2000", extra: [{ name: "search", isRequired: false }] }
  ]
};

const builder = new addonBuilder(manifest);

function itemId(film) {
  return film.id;
}

function toMetaPreview(film) {
  return {
    id: itemId(film),
    type: "movie",
    name: film.title,
    releaseInfo: String(film.year),
    poster: film.poster || undefined,
    description: `${film.country === "SK" ? "Slovenský" : "Český/československý"} film · orientační skóre ČSFD (ověřit): ${film.csfdRating == null ? "nevyplněno" : film.csfdRating + "%"}`,
    links: [{ name: "Otevřít ČSFD", category: "Website", url: film.csfdUrl || "https://www.csfd.cz/" }]
  };
}

function catalogFor(id) {
  if (id === "cz_classics") return films.filter(f => f.year < 1990);
  if (id === "cz_slovak") return films.filter(f => f.country === "SK");
  if (id === "cz_modern") return films.filter(f => f.year >= 2000 && f.country !== "SK");
  return films;
}

builder.defineCatalogHandler(async ({ id, extra }) => {
  const search = (extra && extra.search ? String(extra.search) : "").trim().toLocaleLowerCase("cs");
  let list = catalogFor(id);
  if (search) list = list.filter(f => f.title.toLocaleLowerCase("cs").includes(search));
  list = list.slice().sort((a, b) => (b.csfdRating ?? -1) - (a.csfdRating ?? -1) || a.title.localeCompare(b.title, "cs"));
  const metas = await Promise.all(list.map(async film => {
    const preview = toMetaPreview(film);
    if (film.id.startsWith("tt")) {
      try {
        const response = await fetch(`https://v3-cinemeta.strem.io/meta/movie/${film.id}.json`, { signal: AbortSignal.timeout(3500) });
        if (response.ok) {
          const body = await response.json();
          const remote = body.meta || {};
          return {
            ...preview,
            poster: remote.poster || preview.poster,
            background: remote.background,
            description: preview.description,
            releaseInfo: String(film.year || remote.releaseInfo || ""),
            imdb_id: film.id
          };
        }
      } catch (_) {}
    }
    return preview;
  }));
  return { metas };
});

builder.defineMetaHandler(async ({ type, id }) => {
  const film = films.find(f => f.id === id);
  if (!film) return { meta: null };
  let remote = {};
  if (film.id.startsWith("tt")) {
    try {
      const response = await fetch(`https://v3-cinemeta.strem.io/meta/${type}/${film.id}.json`, { signal: AbortSignal.timeout(3500) });
      if (response.ok) remote = (await response.json()).meta || {};
    } catch (_) {}
  }
  return {
    meta: {
      ...remote,
      id: film.id,
      type: "movie",
      name: film.title,
      releaseInfo: String(film.year),
      poster: remote.poster || film.poster,
      description: `${remote.description ? remote.description + "\n\n" : ""}Orientační skóre ČSFD (ověřit): ${film.csfdRating == null ? "nevyplněno" : film.csfdRating + "%"}. Toto skóre je uložené v lokálním katalogu, nikoli načítané živě.`,
      imdbRating: remote.imdbRating,
      links: [{ name: "ČSFD", category: "Website", url: film.csfdUrl || "https://www.csfd.cz/" }]
    }
  };
});

const port = Number(process.env.PORT || 7000);
serveHTTP(builder.getInterface(), { port });
console.log(`Český filmový žebříček běží na http://127.0.0.1:${port}/manifest.json`);
console.log("Pro instalaci do Stremia použij lokální manifest URL; pro vzdálenou instalaci addon nejdřív nasaď na HTTPS hosting.");
