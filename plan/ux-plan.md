# UX plan: "Command Console" (fases 14–19)

Doel: van een werkende RTS (v1.1.0) naar een spel dat in de eerste tien seconden *voelt* als het genre: een zware, factie-eigen commandoconsole, een omroepstem die alles meldt, en een slagveld dat je onder druk in één oogopslag leest. Origineel ontwerp; geen EA/Westwood-assets, -logo's, -samples of nagemaakte sidebar-artwork (zie `plan/assets.md`). Strategisch kader: `PRODUCT.md`.

Besluiten van de gebruiker (2026-10-02):
- Scope: in-game HUD & sidebar, feedback & announcer, shell (menu/lobby/briefing/score), leesbaarheid van het slagveld.
- Anker: RA2/YR-gevoel met factie-skin (Allied staal, Red Bloc geklonken rood, Psi violet-organisch).
- Taal: alles Engels (UI + announcer). Documentatie blijft Nederlands.
- Stem: offline gegenereerde TTS (open model, permissieve licentie) + radiofilter, als .ogg in het asset-register.
- Schermen: grotendeels responsive; grote monitoren én tablets (touch).

## Huidige situatie (v1.1.0, gemeten met screenshots)
- Generieke flat dark UI: grijze panelen, één goudaccent, Segoe UI. Geen factie-identiteit in de chrome.
- Mix van Nederlands en Engels (`GEBOUWEN`, `Repair`, `GEREED`, `Our base is under attack`, `NEDERLAAG`).
- Cameo's donker en klein, voortgang als verticale vulling; geen clock-wipe, geen "on hold"-staat zichtbaar.
- Radarvak toont alleen "GEEN RADAR"; credits staan statisch; stroombalk is een dun lijntje.
- Berichten linksboven met een gekleurde zijstreep; announcer via `speechSynthesis` (klinkt per OS anders, niet te filteren).
- Kaartrand is een harde zwarte driehoek; selectie = groene ellips + losse hp-balk.
- Menu en lobby zijn formulieren; laadscherm is een balk; eindscherm een kale tabel.
- Geen touch-ondersteuning.

## Ontwerprichting
- **Scène:** een speler 's avonds in een gedimde kamer, op een 27"-monitor of een tablet op schoot, 20 minuten onder constante druk, ogen op het slagveld. → donker thema, de chrome is materiaal (metaal) en geen scherm, felle kleur alleen voor status.
- **Kleurstrategie:** *Committed* per factie: de factiekleur draagt de chrome (30–50% van de sidebar). Op het slagveld zelf *Restrained*: alleen statuskleuren (groen/geel/rood hp, rood = vijand/gevaar, cyaan = info).
- **Materiaal:** puur CSS (gradients, inset-bevels, klinknagels via radial-gradient, gaas via repeating-linear-gradient). Geen bitmap-artwork nodig, dus licentieschoon en schaalbaar.
- **Type:** Barlow Condensed (labels, knoppen, koppen, uppercase met tracking), Barlow (lopende tekst/tooltips), Share Tech Mono (credits, timers, aftellers). Alle drie OFL, zelf gehost in `public/assets/fonts`, geregistreerd.
- **Factie-materialen:**
  - *Allied Coalition*: koel geborsteld staal, blauwgrijs, rechte afschuiningen, cyaan statusglas.
  - *Red Bloc*: donker gelakt plaatstaal, oxiderood, zware klinknagels, amber lampjes, gevarenstrepen.
  - *Psi Directorate*: donker violet, organische afrondingen, gloeiende magenta aders, zachte puls.

## Fases

### Fase 14: Fundament (taal, tokens, fonts)
- Alle UI-teksten naar Engels; één bron `src/ui/text.ts` voor strings die op meerdere plekken terugkomen (announcer-regels, ordernamen).
- Design tokens in `styles.css`: `:root` + `[data-faction=allies|soviets|psi]` met OKLCH-kleuren voor `--chrome-*`, `--glow`, `--rivet`, statuskleuren, spacing-schaal, z-lagen.
- Fonts zelf hosten + registreren; `font-display: swap`.
- Sidebar-updates naar ~10 Hz throttlen (DOM-render niet per tick).
- **Klaar als:** geen Nederlandse string meer in de game-UI (e2e grep), drie factiethema's wisselbaar via één attribuut.

### Fase 15: Sidebar & HUD (factie-skin)
- **Sidebar-opbouw (boven→onder):** factie-embleemplaat met credits-teller (rolt mechanisch op/af, tikgeluid) · radarbehuizing (luiken gaan open bij "Radar online", sluiten bij stroomtekort, ruisbeeld als offline) · Repair / Sell / Power-down-knoppen · tabbalk met iconen (Structures, Defense, Infantry, Vehicles, Naval/Air) · cameo-raster · selectie/tooltip-paneel.
- **Stroommeter:** verticale segmentmeter langs de binnenrand van de sidebar (verbruik vs. productie), knippert rood bij tekort.
- **Cameo-staten:** idle, affordable/unaffordable (prijs rood), building (clock-wipe via `conic-gradient` + resterende tijd), queued ×N, on hold (gele "ON HOLD"-plaat, wipe gepauzeerd), ready (pulserende "READY"-plaat), locked (gedesatureerd + vereiste in tooltip), placing (ingedrukt).
- Cameo-render per categorie inzoomen (gebouwen vullen nu maar een derde van het vak).
- Tabs tonen een voortgangsring/stip als er in die tab iets bouwt of klaar staat; automatisch naar de tab van iets dat "ready" wordt is *uit* (genre-gewoonte: speler houdt controle).
- **Superwapen-timers:** linksboven, eigen én (indien bekend) vijandelijke wapens met aftellende klok, zoals in het genre.
- **Commandobalk:** contextueel, onderaan het slagveld bij selectie: portret, naam, hp-balk, veteranie, cargo, en knoppen met sneltoets-letter (Attack-move F, Guard G, Stop X, Deploy/ability E, Scatter). Vervangt de selectie-info in de sidebar en geeft de tooltips meer ruimte.
- Topbalk minimaal: speltijd, snelheid, menu-tab ("Options"). Pauze als dimlaag + "PAUSED"-plaat.
- **Responsive:**
  - ≥1680 px: sidebar 340 px, 3 cameo-kolommen, grotere radar.
  - 1180–1679 px: 272 px, 2 kolommen (huidig).
  - Tablet/touch (`pointer: coarse` of <1180 px): sidebar wordt een uitschuiflade aan de rand (handgreep met credits en stroom altijd zichtbaar), cameo's ≥ 64 px, commandobalk met 48 px-knoppen, en een expliciete "Select / Order"-modusschakelaar. Eén vinger tikken = selecteren/order, slepen met twee vingers = pannen, knijpen = zoomen, lang drukken = sleepselectie.
- **Klaar als:** alle cameo-staten zichtbaar in een e2e-screenshot per factie; tablet-viewport (1180×820, hasTouch) kan bouwen, plaatsen, selecteren en aanvallen in e2e.

### Fase 16: Announcer & feedback
- **Stem per factie** (offline gegenereerd met een open TTS-model zoals Piper, alleen stemmen met MIT/CC0/CC-BY-licentie, geen klonen van echte personen): Allied kalm-zakelijk, Red Bloc bars, Psi gefluisterd met lichte echo. Nabewerking in Web Audio: bandpass 300–3400 Hz, lichte saturatie, squelch-klik in en uit.
- **Regelset (±30 per factie):** Building · Construction complete · Unit ready · On hold · Cancelled · Insufficient funds · Low power · Power restored · Radar online · Radar offline · Our base is under attack · Our harvester is under attack · Unit lost · Structure lost · Unit promoted · New construction options · Cannot deploy here · Reinforcements have arrived · Building captured · Superweapon detected / ready / launched (per type) · Select target · Primary building selected · Mission accomplished · Mission failed.
- **Spreekwachtrij:** prioriteit (aanval > superwapen > ready > rest), cooldown per regel (bv. "under attack" max. 1× per 8 s per gebied), geen overlap; altijd ook als ondertitel in een berichtlog (3 regels, vervaagt, terug te lezen met een knop).
- **Unit-acknowledgements:** korte kreten per klasse en factie bij selecteren/bevelen ("Ready", "Moving", "Engaging"), met pitchvariatie; aparte volumeschuif.
- **Juice:** credits-tik bij oogsten, cameo-flits bij ready, "thunk" + stofwolk bij plaatsen, gebouwen die uit de grond opbouwen (scanline-reveal), $-deeltjes bij verkopen, sleutel-icoon bij repareren, minimap-ping (uitdijende ring) bij aanval, spatie springt naar de laatste melding, lichte screen shake bij superwapens (uit bij reduced motion).
- **Klaar als:** elke regel uit de lijst is gekoppeld aan een game-event (unit-test op event→regel), geen dubbele regels binnen de cooldown, alle .ogg's in `docs/asset-register.md`.

### Fase 17: Leesbaarheid slagveld
- **Selectie:** hoekhaken (vier L-vormen) rond voertuigen/gebouwen i.p.v. ellipsen; infanterie houdt een kleine ellips. Gesegmenteerde hp-pips (groen > 50%, geel > 25%, rood), groepsnummer naast de balk, veteranie-chevrons.
- **Orderlijnen:** bij elk bevel een korte lijn naar het doel (groen = move, rood = attack, geel = guard) die in 0,6 s vervaagt; shift-wachtrij toont waypoints.
- **Contextcursors** (eigen SVG's): select, move, attack, cannot-move, enter/garrison, capture, repair, sell, deploy, superweapon-target, scroll-pijlen aan de schermrand.
- **Plaatsing:** cellenraster onder de ghost (groen/rood per cel), bereikcirkel voor verdediging, "bouwradius" van de basis subtiel zichtbaar.
- **Stroomtekort:** getroffen gebouwen gedimd + bliksem-icoon; verdediging toont "OFFLINE".
- **Rally-vlag** bij productiegebouwen; **kaartrand** als zachte shroud-overgang met textuur i.p.v. harde zwarte driehoek.
- **Kleurenblind:** teamkleur + vorm (vijand = gestreepte hp-balk), hp-kleuren ook via segmentaantal.
- **Klaar als:** visuele snapshot-tests per state; e2e checkt dat cursor-class wisselt op vijand/terrein/eigen gebouw.

### Fase 18: Shell (menu, lobby, briefing, score)
- **Hoofdmenu:** live "attract mode" op de achtergrond (AI vs AI op een kleine map, gedimd en traag), metalen consolepaneel rechts met de knoppen, knopgeluiden, versie onderaan.
- **Skirmish-lobby:** spelerslots als rijen (kleur, factie, team, AI-niveau per slot), mapvoorbeeld (minimap-render van de echte seed), opties inklapbaar ("Advanced"). Factiekeuze als drie grote emblemen (eigen geometrische emblemen, geen nagemaakte).
- **Briefing (laadscherm):** mapvoorbeeld met startposities, factie-embleem, wisselende tips, echte laadstappen als terminalregels ("Baking sprites… 42/120").
- **Scorescherm:** "MISSION ACCOMPLISHED / FAILED"-plaat, getallen tellen op met tikgeluid, balken per speler, rang ("Field Marshal"), Replay/Main menu.
- Pauzemenu en instellingen in dezelfde consolestijl.
- **Klaar als:** e2e loopt menu → lobby → briefing → game → score in alle drie browsers.

### Fase 19: Polish, toegankelijkheid, test
_Status: fase 14–19 afgerond op 2026-10-02 (versie 1.2.0); details per fase in `docs/TODO.md`._
- Instellingen: volumes (music/sfx/voice/acks), announcer aan/uit, ondertitels, reduced motion, UI-schaal 90–125%, kleurenblind-palet, edge-scroll aan/uit.
- `prefers-reduced-motion` gerespecteerd overal; contrast AA gecontroleerd per factiethema.
- Visuele regressie: Playwright-screenshots per factie × (desktop, tablet).
- Perf-budget: HUD-render < 1 ms per frame gemiddeld; geen layout-thrash (alleen transform/opacity animeren).
- Docs: CHANGELOG 1.2.0, README-screenshots, asset-register bijgewerkt (fonts, stemmen, cursors).

## Besluiten op de open vragen (2026-10-02)
- Elke factie-announcer krijgt een eigen naam en stem: **AEGIS** (Allied), **KOMMAND** (Red Bloc), **CHOIR** (Psi). De naam staat in de ondertitels en het instellingenmenu.
- Volledig Engels, ook heldnamen, factie-taglines, beschrijvingen en tooltips ("De Orakel" → "The Oracle").
- Unit-acks horen bij fase 16 (niet uitgesteld): per factie en per klasse (infanterie, voertuig, schip, vliegtuig, held) 3 select- en 3 orderregels. Helden krijgen eigen regels.

Designvoorstel met mockups: `plan/ux-voorstel/command-console.html` (ook gepubliceerd als artifact).

## Volgorde & risico's
Volgorde 14 → 15 → 16 → 17 → 18 → 19; na elke fase draait het spel, en zijn tsc, vitest en e2e groen.
- **Risico: TTS-licentie.** Per stem het model-licentiebestand controleren; twijfel = niet gebruiken.
- **Risico: touch-besturing** is het grootste stuk nieuw gedrag. Eerst een minimale variant (tikken + lade), daarna gebaren.
- **Risico: React-render per tick** bij een zwaardere sidebar. Daarom zit de throttle al in fase 14.
- **Bewust weggelaten:** campagne/missiebriefings met verhaal, multiplayer-lobby, diplomatie-paneel.
