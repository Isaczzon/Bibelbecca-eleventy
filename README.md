# BibelBecca – webbplats (Eleventy, den gamla sajten)

> **Obs! Det här repot är historiskt.** Sajten ersattes 2026-09-17 av Umbraco-sajten
> i repot [Isaczzon/Bibelbecca](https://github.com/Isaczzon/Bibelbecca), som nu är
> enda innehållskällan och redigeras i dess backoffice. Synken härifrån till Umbraco
> är avstängd och de nattliga jobben (YouTube-hämtning, Pages-bygge) är stoppade.
> Ändringar här når inte den publicerade sajten.

Statisk webbplats byggd med [Eleventy](https://www.11ty.dev/), publicerad på **GitHub Pages** och redigerbar via **[Sveltia CMS](https://github.com/sveltia/sveltia-cms)** på `/admin/`.

Sajten har samma struktur som Elimkyrkan Mantorps webbplats: mörkt/ljust läge, enbart svenska, YouTube-inbäddningar och kontaktformulär via Formspree.

## Sidor

- **Hem** – hero, senaste videor/poddavsnitt, om-teaser och sponsor-CTA
- **Om** – om Becca, podden och vad kanalen står för
- **Titta & lyssna** (`/innehall/`) – nav med kategorikort som leder till egna sidor: *Videor*, *Podcast*, *Serien "Hur kommer man till himlen?"*, *Shorts*, *Lives* och *Beccas BibelstudieTips*. Kategorier utan innehåll döljs automatiskt på navet.
- **Sponsra** – sponsorbehov i tre sektioner (upp till 500 kr, över 500 kr, valfritt bidrag) med Swish-QR-kod per behov, och texten om det handvirkade gosedjur som skänks vidare för varje bidrag
- **Kontakt** – e-post, sociala länkar och Formspree-formulär

## Så hänger det ihop

```
Becca → /admin/ (Sveltia CMS) → commit till GitHub → GitHub Actions bygger → GitHub Pages publicerar
```

- **Sidtexter** ligger i `src/_data/pages/{språk}/…` och `src/_data/sajt/{språk}.json`
- **Videor, podcast & lives** ligger i `src/media/{språk}/…` – en fil per inslag med typ (Video/Short/Podcast/Serie/Live/Studietips), YouTube-länk och datum. Typen styr vilken kategorisida inslaget hamnar på. Nyaste visas först; de tre senaste (undantaget shorts) visas även på startsidan. Shorts visas i stående format.
- **Sponsorbehov** ligger i `src/sponsorbehov/{språk}/…` – en fil per behov med status *Önskas* eller *Finansierad*.
- **Översättningar av fasta UI-texter** (knappar, etiketter, formulär) ligger i `src/_data/t.json`.
- **Mallar/design**: `src/_includes/`, `src/css/site.css` (inkl. mörkt läge), `src/js/site.js`.
- Bilder som laddas upp via CMS:et hamnar i `images/uploads/`.


## Köra lokalt

```bash
npm install
npm start        # http://localhost:8080
```

## Engångsinstallation (görs en gång av administratören)

### 1. Skapa GitHub-repot och aktivera GitHub Pages

1. Skapa ett repo (t.ex. `Bibelbecca-eleventy`) och pusha innehållet i den här mappen.
2. GitHub → repo **Settings → Pages → Source: GitHub Actions**. Nästa push bygger och publicerar sajten till `https://<ägare>.github.io/Bibelbecca-eleventy/`.
3. Uppdatera `repo:` i `src/admin/config.yml` så att det pekar på rätt `ägare/repo`.

> **Eget domännamn?** (t.ex. `bibelbecca.se`) Lägg till domänen under Settings → Pages och ändra `PATH_PREFIX` i `.github/workflows/deploy.yml` till `/`.

### 2. Formspree (kontaktformuläret)

1. Skapa ett gratis konto på [formspree.io](https://formspree.io) och skapa ett formulär (peka det mot Beccas e-postadress).
2. Kopiera formulärets ID (t.ex. `xqkrwabc`) och skriv in det under **Inställningar** i CMS:et (eller direkt i `src/_data/sajt/*.json`).

Gratisnivån ger 50 meddelanden/månad. Formuläret har honeypot + enkel mattefråga som skräppostskydd, och Formspree filtrerar dessutom på sin sida.

### 3. Inloggning till CMS:et (OAuth-proxy)

Sveltia loggar in redaktörer via GitHub. GitHub Pages kan inte hantera OAuth-handskakningen, så en liten gratis Cloudflare Worker behövs (engångsuppgift, ~10 minuter):

1. Följ instruktionerna på [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) – det finns en "Deploy to Cloudflare Workers"-knapp.
2. Skapa en GitHub OAuth-app (Settings → Developer settings → OAuth Apps) enligt samma instruktion.
3. Skriv in Workerns URL som `base_url` i `src/admin/config.yml`.

### 4. Bjud in Becca som redaktör

Gå till repots **Settings → Collaborators**, klicka **Add people** och ange Beccas **e-postadress** (välj Write-behörighet). GitHub skickar en inbjudan via mejl – har hon inget GitHub-konto guidar inbjudningslänken henne genom att skapa ett. Därefter:

1. Gå till `https://<ägare>.github.io/Bibelbecca-eleventy/admin/`
2. Klicka **Sign in with GitHub**
3. Redigera och klicka **Spara** – ändringen syns på sajten efter någon minut.

## Innehållstyper i CMS:et

| Meny | Vad det styr |
|---|---|
| **Sidor** | Texterna på Hem, Om, Videor & podcast, Sponsra, Kontakt |
| **Videor, podcast & lives** | Inslagen på mediasidan (och de tre senaste på startsidan) |
| **Sponsorbehov** | Korten på sponsorsidan – titel, beskrivning, status, bild |
| **Inställningar** | Logotyp, sidfot, e-post, sociala länkar, Formspree-ID |

## Att uppdatera innan lansering

- [ ] `src/admin/config.yml`: rätt `repo:` och Worker-URL (`base_url`)
- [ ] `src/_data/sajt/sv.json` + `en.json`: Formspree-ID (e-post, Spotify, sociala länkar är redan ifyllda)
- [ ] Sponsorbehoven i `src/sponsorbehov/` är exempel – Becca uppdaterar dem i CMS:et

> Allt kanalinnehåll (videor, shorts, podcast, lives) importerades från YouTube 2026-06-12.
> Engelska titlar är översatta för videor/podcast/lives; shorts behåller den svenska titeln på båda språken.

## Automatisk hämtning av nytt innehåll

Varje natt kör [.github/workflows/hamta-nytt.yml](.github/workflows/hamta-nytt.yml) skriptet
`scripts/hamta-nytt.mjs` (03:30 UTC) som jämför kanalens flikar och spellistor med sajtens
innehåll och skapar md-filer för allt som saknas. Deploy-workflowen bygger sedan om sajten
04:00 UTC, så nya videor dyker upp på sajten automatiskt inom ett dygn – utan att någon
behöver göra något.

- Typen sätts via spellistorna (podcast/serien/studietips/lives), shorts-fliken respektive videofliken.
- Skriptet uppdaterar också följarräknarna på startsidan: YouTube (kanalsidan), TikTok
  (profilsidans inbäddade JSON) och Instagram (og:description). Spotify-lyssnare visas inte
  publikt av Spotify och uppdateras därför manuellt i CMS:et under Inställningar.
  Misslyckas en hämtning behålls det gamla värdet.
- Befintliga filer rörs aldrig – Beccas redigeringar i CMS:et skrivs inte över.
- Skriptet använder YouTubes interna webb-API (inofficiellt). Skulle YouTube ändra formatet
  slutar hämtningen fungera tills skriptet uppdateras – sajten påverkas inte, och inslag kan
  alltid läggas in manuellt i CMS:et under tiden.
- Kan köras manuellt: `node scripts/hamta-nytt.mjs` (eller via "Run workflow" på GitHub).
