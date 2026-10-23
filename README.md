# Český filmový žebříček – Stremio addon

Vlastní katalog českých a československých filmů pro Stremio. Poskytuje čtyři katalogy:
- České filmy – žebříček ČSFD
- Československá klasika
- Slovenské filmy
- České filmy po roce 2000

Plakáty a další metadata se pro položky s platným IMDb ID zkouší načíst z veřejného Cinemeta endpointu. Pokud metadata nejsou dostupná, katalog zůstane funkční bez plakátu.

## Důležité k hodnocení ČSFD
ČSFD nemá v tomto projektu použité oficiální veřejné API. `data/films.json` proto obsahuje **počáteční orientační hodnoty (neověřený seed), které je nutné před použitím ověřit a aktualizovat**. Nejde o živou synchronizaci s ČSFD. U položek, kde je `csfdUrl` jen obecný odkaz, doplň skutečnou adresu filmu na ČSFD. Hodnocení se používá pro řazení a zobrazení v detailu; Stremio nemá samostatné nativní pole pro skóre ČSFD.

## Lokální spuštění (nejrychlejší test)
1. Nainstaluj Node.js 18 nebo novější: https://nodejs.org/
2. Rozbal ZIP.
3. Otevři terminál ve složce `cesky-filmovy-zebricek`.
4. Spusť:
   ```bash
   npm install
   npm start
   ```
5. V prohlížeči ověř, že funguje `http://127.0.0.1:7000/manifest.json`.
6. Ve Stremiu otevři instalační odkaz:
   `stremio://127.0.0.1:7000/manifest.json`
   Pokud aplikace tento protokol nezachytí, otevři Stremio a použij URL manifestu přes stránku pro instalaci addonu, nebo zkus `http://127.0.0.1:7000/manifest.json`.

**Pozor:** lokální instalace funguje pouze na zařízení, kde addon běží. Telefon nebo TV obvykle nemůže použít `127.0.0.1` jako adresu počítače.

## Instalace pomocí odkazu odkudkoli (doporučeno pro trvalé používání)
Stremio musí addon načíst z veřejně dostupné HTTPS adresy. Nahraj celý projekt na hosting podporující Node.js (např. Render, Railway nebo vlastní VPS), nastav start command `npm start` a zajisti, že hosting poskytuje veřejnou HTTPS URL. Pak nainstaluj:
`stremio://TVOJE-HTTPS-DOMENA/manifest.json`

Například pokud je veřejná adresa `https://moje-adresa.example`, instalační URI bude:
`stremio://moje-adresa.example/manifest.json`

Toto je šablona, nikoli skutečně nasazený odkaz. Veřejnou adresu nelze vytvořit jen vygenerováním ZIPu; je potřeba addon nasadit na hosting.

## Aktualizace seznamu a hodnocení
Uprav `data/films.json`. Každý film má:
- `id`: IMDb ID `tt...` pro automatické načtení metadat z Cinemeta, případně vlastní ID `czfilm:...`
- `title`: název
- `year`: rok
- `csfdRating`: hodnocení v procentech
- `country`: `CZ` nebo `SK`
- `csfdUrl`: přesný odkaz na film na ČSFD
- volitelně `poster`: URL plakátu jako záloha

Po změně souboru restartuj addon. Skóre musí být číslo 0–100, bez znaku `%`.

## Technické poznámky
- Addon poskytuje katalog a metadata, nikoli video streamy.
- Používá oficiální Stremio Addon SDK.
- Cinemeta je externí zdroj metadat; jeho dostupnost a pravidla se mohou měnit.
- Před veřejným sdílením ověř všechna hodnocení, IMDb ID a odkazy na ČSFD.
