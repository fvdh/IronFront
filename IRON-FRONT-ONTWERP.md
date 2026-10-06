# Iron Front: volledig spelontwerp en gemaakte keuzes

**Versie 1.2.0 · 2 oktober 2026**

Iron Front is een onafhankelijke, isometrische real-time strategy-game (RTS) voor de browser, geïnspireerd op het Red Alert 2 / Yuri's Revenge-tijdperk. Er hoeft niets geïnstalleerd te worden en je hebt geen account nodig. Je opent de pagina, kiest een factie en een kaart, en speelt een skirmish tegen één tot drie AI-tegenstanders.

Dit document beschrijft het hele spel zoals het nu is: facties, eenheden, gebouwen, economie, bediening, AI, interface, geluid en techniek. Daarnaast staan hier alle ontwerpkeuzes die onderweg zijn gemaakt, met de reden erachter. Alle getallen komen rechtstreeks uit de speldata (`src/game/data/`).

---

## Inhoud

1. [In één oogopslag](#1-in-één-oogopslag)
2. [Uitgangspunten en ontwerpprincipes](#2-uitgangspunten-en-ontwerpprincipes)
3. [IP en licenties: wat we bewust níet doen](#3-ip-en-licenties-wat-we-bewust-níet-doen)
4. [Spelverloop](#4-spelverloop)
5. [Economie en stroom](#5-economie-en-stroom)
6. [Bouwen en produceren](#6-bouwen-en-produceren)
7. [Bediening](#7-bediening)
8. [Gevecht](#8-gevecht)
9. [De drie facties](#9-de-drie-facties)
10. [Gedeelde gebouwen en eenheden](#10-gedeelde-gebouwen-en-eenheden)
11. [Vaardigheden](#11-vaardigheden)
12. [Superwapens](#12-superwapens)
13. [Kaarten en de neutrale wereld](#13-kaarten-en-de-neutrale-wereld)
14. [Zee](#14-zee)
15. [AI-tegenstanders](#15-ai-tegenstanders)
16. [Interface: "Command Console"](#16-interface-command-console)
17. [Geluid en stemmen](#17-geluid-en-stemmen)
18. [Art direction](#18-art-direction)
19. [Toegankelijkheid](#19-toegankelijkheid)
20. [Techniek en architectuur](#20-techniek-en-architectuur)
21. [Balans: hoe gemeten en wat aangepast](#21-balans-hoe-gemeten-en-wat-aangepast)
22. [Kwaliteit en tests](#22-kwaliteit-en-tests)
23. [Ontwikkelgeschiedenis](#23-ontwikkelgeschiedenis)
24. [Beslissingenlogboek](#24-beslissingenlogboek)
25. [Bewust weggelaten en open punten](#25-bewust-weggelaten-en-open-punten)

---

## 1. In één oogopslag

| | |
|---|---|
| **Genre** | Isometrische RTS met basisbouw, ore-economie, drie asymmetrische facties en superwapens |
| **Platform** | Desktopbrowser (Chrome, Firefox, Safari/WebKit) en tablet (touch) |
| **Spelmodi** | Skirmish (1–3 AI), Sandbox, Tutorial |
| **Facties** | Allied Coalition, Red Bloc, Psi Directorate |
| **Inhoud** | 51 eenheden (incl. 3 helden en 9 schepen), 29 gebouwen (incl. Construction Yard), 6 superwapens, 9 vaardigheden, 10 neutrale kaartstructuren, 5 kaarttypes plus willekeurig |
| **Duur van een potje** | 15–40 minuten |
| **Taal** | Spel volledig Engels; documentatie Nederlands |
| **Stack** | TypeScript, React, three.js, Vite, Vitest, Playwright |
| **Licentie** | Code MIT; assets per stuk CC0 / CC-BY / OFL, alles geregistreerd |

**De belofte:** een speler die het genre kent, herkent het ritme binnen een paar seconden (icoon aanklikken, "Construction complete", plaatsen, "Unit ready"), zonder dat er iets van EA/Westwood is overgenomen.

---

## 2. Uitgangspunten en ontwerpprincipes

### Projectprincipes (uit het oorspronkelijke plan)
1. Gameplay boven graphics.
2. Functionaliteit boven visuele perfectie.
3. Een stabiele game-loop boven complexe architectuur.
4. Elk systeem werkt echt. Geen nepknoppen, geen decoratieve UI zonder functie.
5. Geen placeholder-functionaliteit die als af wordt gepresenteerd.
6. Iteratief bouwen: na elke fase is het spel speelbaar en zijn alle tests groen.
7. Een feature is pas klaar als hij getest is.

### Doelgroep
Spelers die met de isometrische RTS-games van eind jaren '90 en begin jaren '00 zijn opgegroeid. Ze spelen 's avonds skirmishes van 15–40 minuten tegen de AI, op een grote monitor met muis en toetsenbord of op een tablet. Tijdens een potje staan ze onder druk: basis, economie en leger tegelijk, met de ogen op het slagveld.

### Merkpersoonlijkheid
Zwaar, militaristisch en theatraal. De interface is een legercommandoconsole: metaal, klinknagels, waarschuwingslampjes en een bevelende omroepstem. Elke factie voelt anders in de hand. Zelfverzekerd en direct, met een knipoog naar B-film-bravoure, maar nooit komisch of cartoonesk.

### Vijf ontwerpprincipes voor de UX
1. **Het slagveld spreekt.** Elk belangrijk event komt binnen via drie kanalen: stem, geluid en beeld. Je hoeft nooit tekst te lezen om te weten wat er gebeurde.
2. **De factie is het kader.** De UI-chrome *is* de factie-identiteit: Allied, Red Bloc en Psi verschillen in materiaal, kleur en geluid.
3. **Genre-spiergeheugen boven vernieuwing.** De sidebar zit rechts, de cameo's hebben een countdown-wipe, de radar staat bovenaan en de credits tellen op. Het vertrouwde ritme blijft, alleen scherper.
4. **Gewicht in elke klik.** Knoppen drukken in, tellers tikken en cameo's flitsen. De feedback is mechanisch en fysiek.
5. **Leesbaar onder druk.** Gezondheid, stroom, dreiging en gereedheid lees je in één oogopslag, op een grote monitor én op een tablet.

### Anti-referenties (wat het nadrukkelijk níet moet worden)
- Platte SaaS-dark-mode (grijze kaarten met één goudaccent). Zo zag v1.1 eruit.
- Mobile-game-UI: glanzende knoppen, loot-box-gloed, ronde snoepvormen.
- Esports/"gamer"-neon op zwart, sci-fi-fonts, RGB.
- Letterlijke kopieën van RA2/C&C: sidebar-artwork, logo's, EVA-samples, factie-emblemen.
- Het Rode Kruis-embleem, nergens.

---

## 3. IP en licenties: wat we bewust níet doen

Dit is de keuze met de meeste invloed op het ontwerp. Hij geldt voor elke eenheid, elke naam, elk beeld en elk geluid.

**Keuze:** spelmechanieken uit het genre mogen terugkomen, want die zijn niet beschermd. Namen, personages, uiterlijk, logo's, muziek en stemmen van EA/Westwood komen er niet in.

Wat dat concreet betekent:

- **Eigen namen voor elke rol.** Elke gameplayrol uit RA2 krijgt een eigen eenheid met eigen naam en model. Het Tanya-archetype heet **Nova**, Boris heet **Grom** en Yuri Prime heet **The Oracle**. De Soviets heten **Red Bloc**, Yuri heet **Psi Directorate**.
- **Namen die te dicht bij RA2 lagen zijn hernoemd** tijdens de licentie-audit: Tesla Plant → *Dynamo Plant*, Conscript → *Draftee*, Initiate → *Adept*, Brute → *Mauler*, Psychic Radar → *Psi Sensor Array*.
- **Generieke genretermen blijven** (Construction Yard, War Factory, Ore Refinery, Repair Depot). Die zijn eventueel later nog te hernoemen; zie open punten.
- **Assets alleen uit verifieerbare open bronnen** (Kenney, Quaternius, poly.pizza, ambientCG, OpenGameArt) met CC0- of CC-BY-licentie, of procedureel/zelf gemaakt. Een licentie wordt pas als "goedgekeurd" geregistreerd nadat de bronpagina is gecontroleerd. Bij twijfel: niet gebruiken en een alternatief maken.
- **OpenRA** dient alleen als technische referentie, niet als bron van assets.
- **Afgewezen:** PixVoxel-wargamesprites (te cartoonesk) en Hard Vacuum (top-down sci-fi, past niet).
- **Stemmen** zijn offline gegenereerd met Piper TTS, alleen met stemmodellen die *from scratch* zijn getraind op publiek-domein-opnames (LibriVox, LJ Speech). Afgewezen: libritts_r en van "lessac" afgeleide modellen (Blizzard 2013-data, beperkende licentie) en alle NC-stemmen. Geen klonen van echte personen.
- **Fonts:** Barlow Condensed, Barlow en Share Tech Mono, alle drie OFL en zelf gehost.
- **Elk asset staat in `docs/asset-register.md`** met bron, auteur, licentie, controledatum, bewerkingen en status. CC-BY-attributie staat in de Credits in het spel en in `public/assets/licenses/CREDITS.txt`.
- **Disclaimer in de README:** niet gelieerd aan of goedgekeurd door Electronic Arts.

---

## 4. Spelverloop

### Doel
Schakel alle tegenstanders uit. Een speler ligt eruit als hij **geen gebouwen en geen bewapende eenheden** meer heeft. Muren en neutrale gebouwen tellen niet mee. Een Base Crawler telt wel mee, want daarmee kun je opnieuw beginnen. Iedereen speelt tegen iedereen (er zijn geen teams).

### Start
- Elke speler begint met een **Construction Yard** en het gekozen startkapitaal (**2.500, 5.000 of 10.000**; standaard 5.000).
- Startposities zijn **puntsymmetrisch**. Fabrieksuitgangen en raffinaderijdocks wijzen naar het kaartmidden en de AI spiegelt haar plaatsing mee. Daarmee is de zetelbias weg: eerst won speler 2 tot 24 van de 33 potjes alleen door zijn positie, nu is dat 56–51 over 108 potjes.

### De typische opbouw
Construction Yard → Power Plant → Ore Refinery (met gratis Ore Hauler) → Barracks → War Factory → Radar → Tech Center → verdediging, superwapens en uitbreiding met een Base Crawler.

### Spelmodi
| Modus | Wat |
|---|---|
| **Skirmish** | 1–3 AI-tegenstanders. Per AI kies je factie (of willekeurig), kleur en niveau. Verder kies je kaart, grootte, startkapitaal en superwapens aan/uit, en onder "Advanced" ook ore-hoeveelheid, burgers, bonuskratten en seed. |
| **Sandbox** | Geen vijandelijke AI maar een passieve dummybasis als doelwit, $999.999, 5× bouwsnelheid, en direct een complete basis (Power, Barracks, War Factory en een tank). Er is geen win/verlies. |
| **Tutorial** | Tien stappen met een conditie per stap: selecteren, Power Plant, Refinery, 500 credits oogsten, 3 infanteristen, War Factory, 3 tanks, groep sturen, Radar en tot slot de vijandelijke basis vernietigen. |

### Einde
Het scorescherm toont "MISSION ACCOMPLISHED" of "FAILED", vijf oplopende tellers met tikgeluid, de stand per speler en een rang.

**Score** = geoogst/10 + kills×60 + gebouwen×40 + eenheden×15 − verliezen×20 + 2.500 bij winst.
**Rangen:** Recruit (0) · Private (800) · Sergeant (1.600) · Lieutenant (2.800) · Captain (4.200) · Major (6.000) · Colonel (8.000) · General (10.500) · Field Marshal (13.500).

### Spelsnelheid, pauze, opslaan
- Snelheid 0,5× / 1× / 1,5× / 2×. De simulatie draait op 30 ticks per seconde × spelsnelheid.
- Pauze (P) stopt de simulatie; de UI blijft bruikbaar.
- Opslaan/laden lokaal, met een versienummer en validatie. Bij een corrupte of incompatibele save krijg je een begrijpelijke foutmelding. Een geladen spel loopt exact gelijk door, en dat is getest.

---

## 5. Economie en stroom

### Ore
- **Ore Haulers** (Allied, Red Bloc) en **Thrall Haulers** (Psi) zoeken zelf een veld, oogsten, rijden terug en storten. Ze blijven werken zonder dat je iets doet.
- Een volle ore-tegel is **300 credits** waard. **Gems** zijn 2× zoveel waard.
- Oogsten gaat in happen van 40 credits per 8 ticks; storten in happen van 70 per 4 ticks. Een Ore Hauler draagt 700.
- **Ore mines:** elk veld heeft een onuitputtelijke bron die de ore rondom aanvult (40 per groeistap, elke 5 s). Rijke tegels zaaien zich uit naar lege buren. **Keuze:** in de eerste balansronde eindigden veel potjes in een patstelling omdat de ore op was. Met de mines kan het spel altijd verder.
- Haulers kiezen alleen ore in hun eigen terreingebied en slaan onbereikbare tegels over. Dat voorkomt vastlopers in afgesloten zakken.
- Bij elke vracht stijgt "+$" op boven de raffinaderij. Een credits-tik bij elke vracht is weggelaten, omdat die te vaak zou klinken.

### Credits
- Je betaalt voor gebouwen, eenheden, reparaties en muren.
- **Productie wacht als het geld op is.** Je saldo kan nooit negatief worden door een ongeldige aankoop.
- Verkopen levert **50% × de resterende gezondheid** op. Repareren kost maximaal 50% van de bouwprijs (van 0 naar vol).
- Extra inkomsten: Fuel Rig (+$15/s), bonuskratten ($1.000), Infiltrator in een vijandelijke raffinaderij (geld stelen), Hover Disc (zuigt geld weg) en Reclaimer (eenheden recyclen voor 50%).

### Stroom
- Power Plants leveren **+100**. Bijna elk ander gebouw verbruikt stroom (zie de tabellen).
- **Bij een tekort:**
  - Productie gaat op **50% snelheid**.
  - De Radar valt uit, dus ook de minimap.
  - Verdedigingen met `needsPower` gaan **OFFLINE**.
  - Superwapens stoppen met laden.
  - De announcer meldt "Low power". Getroffen gebouwen worden gedimd en krijgen een knipperende bliksemschicht.
- Uitzonderingen: de Pillbox werkt zonder stroom, en een Arc Coil die door een Arc Trooper wordt opgeladen ook.

---

## 6. Bouwen en produceren

### Wachtrijen
- Drie productiewachtrijen per speler: **gebouwen**, **infanterie** en **voertuigen**. Schepen en vliegtuigen lopen via de voertuigenrij en komen uit de Naval Yard of het Airfield.
- Maximaal **5** items per rij.
- Linksklik op een cameo zet iets in de rij. **Rechtsklik zet het on hold** (de wipe pauzeert en er verschijnt een gele plaat). Linksklik hervat, en nog een rechtsklik annuleert met terugbetaling.
- Als het productiegebouw wordt vernietigd, wordt de wachtrij netjes afgehandeld.
- **Rally point:** selecteer een productiegebouw en rechtsklik op de kaart. Nieuwe eenheden gaan er met attack-move heen. De rally-vlag in teamkleur is alleen zichtbaar zolang het gebouw geselecteerd is. **Keuze van de gebruiker:** eerst stond de vlag er altijd, maar dat was te druk.
- Automatisch naar de tab springen als iets klaar is, staat **uit**. Volgens de genregewoonte houdt de speler zelf de controle.

### Plaatsen
- Een ghost onder de cursor met een **raster per cel** (groen/rood), een stippelcirkel voor het bereik van verdedigingen en een stippelrand rond het gebied waar je mag bouwen.
- Een nieuw gebouw moet binnen **5 tegels** van een eigen gebouw staan (`BUILD_RADIUS`).
- Geen overlap, geen onbegaanbaar terrein, en de uitgang/dock van het nieuwe gebouw moet vrij blijven.
- Rechtsklik of Esc annuleert.
- De Naval Yard plaats je op open water (nooit in een plas).
- **Muren:** sleep een lijn. Elk stuk kost $100. Muren blokkeren paden, worden nooit automatisch beschoten en tellen niet mee voor overleven.
- Een gebouw verschijnt met een opbouwanimatie (scanline-reveal en lasvonken), een "thunk" en een stofwolk.

### Vereisten (tech tree)
Data-gedreven: elk gebouw en elke eenheid heeft een lijst `requires`. De cameo toont "locked" met de vereiste in de tooltip.

```
Construction Yard
 └─ Power Plant
     ├─ Barracks ──────────────── infanterie, Pillbox/Sentry Gun/Gatling Cannon
     └─ Ore Refinery
         ├─ War Factory ───────── voertuigen, Repair Depot
         │   └─ (+ Radar) Tech Center ── tech-units, helden, superwapens
         ├─ Radar Array ───────── minimap, Airfield, AA- en zware verdediging
         ├─ Naval Yard ────────── schepen
         └─ Reclaimer (Psi)
```

### Bouwlimieten
- Helden: maximaal **1** per speler (levend plus in de wachtrij). Na hun dood kun je ze opnieuw bouwen.
- Elk superwapen: **1** per soort per speler. Assembly Plant en Duplicator Vats: ook 1.

---

## 7. Bediening

### Muis en toetsenbord
| Actie | Bediening |
|---|---|
| Selecteren | Linksklik, sleepkader, Shift = toevoegen, Ctrl = verwijderen, dubbelklik = alle zichtbare van hetzelfde type |
| Bevel | Rechtsklik: bewegen, aanvallen, instappen, garrison, overnemen, repareren (afhankelijk van het doel) |
| Gericht vuur | Ctrl+rechtsklik (ook op bruggen en neutrale gebouwen) |
| Attack-move | **F** |
| Guard | **G** |
| Stop | **X** |
| Vaardigheid / deploy / uitladen | **E** |
| Groepen | Ctrl+1…9 om toe te wijzen, 1…9 om te selecteren |
| Naar de basis | **H** |
| Naar de laatste melding | **Spatie** (genregewoonte) |
| Pauze | **P** (eerder ook Spatie; Spatie is nu voor meldingen) |
| Sneltoetsen | **F1** of **?** |
| Camera | WASD/pijltjes, schermrand (met versnelling en uitloop), middelste muisknop slepen, **rechtermuisknop slepen** (een rechtsklik zonder te slepen blijft een bevel), scrollwiel = zoom |
| Minimap | Klik verplaatst de camera |

### Contextcursors
Eigen SVG's: select, move, cannot-move (water of kaartrand voor landeenheden), attack, enter/garrison, capture, repair, sell, nope, deploy, superwapen-doel, plaatsen, en 8 scrollpijlen aan de schermrand.

### Tablet (touch)
De sidebar wordt een **uitschuiflade**. De handgreep is de stroomrail en toont altijd de credits. Bij plaatsen schuift de lade dicht.

- **Select / Order-schakelaar** vervangt de rechtermuisknop.
- Tik = selecteren (of een bevel in Order-modus).
- Slepen = pannen.
- Twee vingers = pannen en knijpzoomen.
- Lang drukken + slepen = sleepselectie.
- Cameo's zijn minstens 64 px, knoppen in de commandobalk 48 px, touch-targets minstens 44 px.

**Keuze:** touch was het grootste stuk nieuw gedrag. Daarom is eerst een minimale variant gebouwd (tikken + lade) en zijn de gebaren daarna toegevoegd.

### Beweging en pathfinding
- A* op een grid met 8 richtingen, zonder hoeken af te snijden. Paden worden vereenvoudigd met line-of-sight.
- Rekenbudget van 24 paden per tick, eerlijk rondgedeeld (round-robin), zodat geen enkele unit verhongert.
- Vastloopdetectie → opnieuw plannen (max. 4×) → opgeven. Is het doel onbereikbaar, dan gaat de unit naar de dichtstbijzijnde bereikbare tegel.
- Groepen bewegen in een losse formatie met verspreide bestemmingen, alleen binnen het aangeklikte terreingebied (dus niet naar de overkant van een rivier).
- Bewegingslagen: **grond**, **amfibisch**, **water** en **lucht**. Vliegtuigen vliegen recht over obstakels.
- Zachte botsing tussen eenheden.

---

## 8. Gevecht

### Pantser en wapens
Vier pantsertypes: **none** (infanterie), **light**, **heavy** en **building**. Elk wapen heeft een vermenigvuldiger per pantsertype (`versus`). Een geweer doet bijvoorbeeld 100% tegen infanterie, 20% tegen zwaar pantser en 25% tegen gebouwen; een raket doet 120% tegen zwaar pantser maar 30% tegen infanterie. Zo ontstaat de klassieke steen-papier-schaar. De tooltips tonen "Strong against / Weak against".

Wapeneigenschappen (allemaal data):

| Eigenschap | Effect |
|---|---|
| `splash` | Gebiedsschade met afnemende kracht |
| `ramp` | Gatling: vuurt sneller naarmate hij langer schiet |
| `aa` / `airOnly` | Kan vliegtuigen raken / raakt alleen vliegtuigen |
| `control` | Mind control in plaats van schade |
| `phase` | Bevriest het doel en wist het uit de tijd |
| `fuse` + `blast` | Tijdbom |
| `cloud` | Slachtoffers laten een gifwolk achter |
| `strike` | Laseraanwijzing, gevolgd door een luchtaanval |
| `leech` | Kruipt in een voertuig en vreet het op |
| `berserk` | Getroffen eenheden vallen alles aan |
| `drain` | Steelt geld of legt een centrale plat |
| `sub` / `navalOnly` | Raakt onderzeeërs / alleen doelen op water |
| `grab` | Houdt het doel vast (Kraken) |
| `fallout` | Laat straling achter |
| `interceptable` | Luchtafweer kan de raket neerschieten |

`canHit(weapon, target)` is de enige centrale regel die bepaalt wie wat kan raken. Auto-targeting kiest nooit een wapen dat het doel niet kan raken (honden negeren dus voertuigen).

### Veterancy
- **Veteraan** na kills ter waarde van de eigen kostprijs, **elite** na 3× die waarde.
- Per rang +20% schade en −15% ontvangen schade. Elite herstelt langzaam.
- Zichtbaar als gouden chevrons naast de levensbalk; de announcer zegt "Unit promoted".

### Statuseffecten en gedrag
- **Mind control:** het doel wordt van jou. Sterft de controller, dan keert het terug. Helden zijn immuun.
- **Bevroren** (fase), **onkwetsbaar** (stasis), **berserk** (delirium), **straling/gif** (schade-over-tijd-zones), **leech** (drone in een voertuig), **gegrepen** (Kraken), **opgeladen** (Arc Coil).
- **Stealth:**
  - Onderzeeërs zijn onzichtbaar tot een sonar in de buurt is of tot ze vuren (1,5 s boven water).
  - De Shroud Tank lijkt een boom zolang hij stilstaat en niet vuurt.
  - De Infiltrator is voor de vijand vermomd als diens eigen infanterie.
  - Detectie door honden (4 tegels), sonar op schepen (5–7) en de Psi Beacon (10).
  - **De AI ziet stealth ook niet.** Geen valsspelen.
- **Engineer:** rechtsklik op een vijandelijk gebouw neemt het over; op een eigen beschadigd gebouw repareert hij het volledig. De Engineer wordt verbruikt.
- **Infiltratie** (Infiltrator in een vijandelijk gebouw):

  | Gebouw | Effect |
  |---|---|
  | Refinery | Geld stelen |
  | Power Plant | Stroom 45 s uit |
  | Radar | Kaart gewist |
  | Barracks / Factory | Jouw eenheden van dat type worden veteraan |
  | Overig | Inlichtingen |

- **Transport:** passagiers zijn onzichtbaar en onraakbaar en sterven mee met het voertuig. Laden doe je met rechtsklik op het transport, uitladen met E.
- **Garrison:** infanterie in een burgergebouw vuurt met extra bereik en is onraakbaar. Stort het gebouw in, dan komen ze er levend uit. E = evacueren. Een leeg gebouw gaat terug naar de burgers.
- **Vliegtuigmunitie:** de Kestrel heeft 3 salvo's, de Talon 1 bom. Daarna vliegen ze zelf terug naar het Airfield (4 landingsplaatsen). Geparkeerd zijn ze een gronddoel.

---

## 9. De drie facties

**Keuze:** het asymmetrische karakter van het origineel blijft, met eigen namen. Alle facties delen de basisgebouwen. Elk heeft eigen infanterie, voertuigen, verdediging, een held, een vloot en twee superwapens.

| | Allied Coalition | Red Bloc | Psi Directorate |
|---|---|---|---|
| **Karakter** | Veelzijdig en hightech: teleportatie, stealth, luchtmacht | Zwaar pantser, artillerie, brute kracht | Mind control, psychologische oorlogsvoering, onconventioneel |
| **Tagline** | *Versatile and high-tech* | *Heavy armor and brute force* | *Psionic and unconventional technology* |
| **Materiaal UI** | Koel geborsteld staal, blauwgrijs, rechte afschuiningen, cyaan statusglas | Donker gelakt plaatstaal, oxiderood, zware klinknagels, amber lampjes, gevarenstrepen | Donker violet, organische rondingen, gloeiende magenta aders, zachte puls |
| **Gebouwtint** | Grijsblauw | Bruinrood | Violet |
| **Announcer** | **AEGIS**: Brits-vrouwelijk, schone radio | **KOMMAND**: lage mannenstem, veldradio met ruis | **CHOIR**: stem met verlaagde laag, echo, een toon in plaats van squelch |
| **Held** | **Nova**: pistolen, C4, zwemt | **Grom**: laser + luchtaanval | **The Oracle**: neemt units én gebouwen over, Psi Storm |
| **Oogster** | Ore Hauler | Ore Hauler | Thrall Hauler (+3 Thralls, ontplooibaar als mobiele raffinaderij) |
| **Superwapens** | Phase Gate, Storm Engine | Hammer Silo, Stasis Projector | Dominion Engine, Mutagen Spire |
| **Economie-extra** | – | Assembly Plant (voertuigen −25%) | Duplicator Vats (infanterie ×2), Reclaimer |

**Kolomuitleg bij de tabellen:**
- **Snelheid** in tegels per seconde bij 1×.
- **Wapen** = schade / bereik in tegels / schade per seconde, vóór de pantservermenigvuldiger.
- Waar twee wapens staan, is het tweede het secundaire wapen (bijv. C4).

### 9.1 Allied Coalition: flexibel, hightech, teleportatie

**Infanterie**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Rifleman** | 200 | 5 | 125 | none | 1.26 | 6 | 11 / 4.2 / 15 | Barracks | Cheap basic infantry. Can dig in (E): stays put, gains range and takes less damage. |
| **Rocket Trooper** | 300 | 7 | 110 | none | 1.14 | 6 | 45 / 6 / 25 | Barracks | Anti-tank infantry with a rocket launcher. Weak against infantry. |
| **Attack Dog** | 200 | 4 | 100 | none | 2.40 | 7 | 150 / 1.1 / 180 | Barracks | Fast. Kills infantry in one bite, useless against vehicles and buildings. Exposes disguised spies. |
| **Infiltrator** | 1000 | 10 | 100 | none | 1.35 | 7 | – | Barracks + Radar Array | Spy: the enemy sees him as their own infantry (dogs don't). Right-click an enemy building: refinery = steal cash, power plant = cut power, radar = wipe map, barracks/factory = veterans, other = intel. |
| **Phase Trooper** | 1500 | 16 | 130 | none | 1.50 | 7 | 22 / 5.5 / 110 | Barracks + Research Lab | Teleports instead of walking. Its beam slowly pulls a target out of time: frozen and invulnerable, it vanishes when the beam finishes it. |
| **Nova** (held) | 1500 | 20 | 250 | none | 1.95 | 9 | 160 / 5.5 / 343 + 4000 / 1.1 / 2000 | Barracks + Research Lab | Hero. Elite commando: her pistols kill infantry in one shot, her C4 destroys any building. Can swim. Useless against vehicles. Max 1. |

**Voertuigen**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Warden Tank** | 700 | 10 | 300 | heavy | 2.25 | 7 | 62 / 5.5 / 41 | War Factory | Fast, versatile battle tank. |
| **Lancer IFV** | 600 | 8 | 220 | light | 2.85 | 8 | 32 / 6 / 25 | War Factory | Fast rocket-armed fighting vehicle. Carries 1 infantry that sets its weapon: Rifleman = machine gun, Phase Trooper = phase beam, Nova = sniper. |
| **Refractor Tank** | 1200 | 16 | 160 | light | 1.80 | 8 | 95 / 8 / 32 | War Factory + Research Lab | Long-range light beam with splash damage. Fragile. Requires Tech Center. |
| **Shroud Tank** | 1000 | 14 | 220 | light | 2.25 | 8 | 75 / 6 / 45 | War Factory + Research Lab | When stationary and holding fire, the enemy sees a tree (dogs don't). Heavy first salvo from ambush. |

**Lucht**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Kestrel VTOL** | 1200 | 14 | 220 | light | 4.20 | 8 | 60 / 5 / 40 | War Factory + Airfield | Fast attack aircraft with 3 missile salvos, hits ground and air targets. Rearms at the Airfield (4 per Airfield). |
| **Skyjumper** | 600 | 9 | 125 | none | 2.70 | 8 | 16 / 4.5 / 27 | Barracks + Radar Array | Jetpack infantry: flies over everything. Only anti-air can hit it. |
| **Talon Strike Jet** | 1200 | 15 | 200 | light | 4.80 | 8 | 500 / 1 / 500 | War Factory + Airfield + Research Lab | Fast bomber: one heavy precision bomb, then back to the Airfield. Shares landing pads with the Kestrels. |

**Zee**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Picket Destroyer** | 1000 | 12 | 600 | heavy | 2.10 | 8 | 70 / 7 / 42 + 120 / 4 / 72 | Naval Yard | Cannon against ships and shore, depth charges against subs. Sonar: detects subs within 7 tiles. |
| **Bastion Cruiser** | 1200 | 14 | 800 | heavy | 1.80 | 10 | 55 / 10 / 55 | Naval Yard + Radar Array | Floating anti-air shield: long-range missiles. Hits air targets only. |
| **Skyhaven Carrier** | 2000 | 22 | 900 | heavy | 1.35 | 10 | 45 / 10 / 30 | Naval Yard + Research Lab | Launches long-range combat drones at land and sea targets. Slow, no defenses of its own. |
| **Sonar Drone** | 600 | 7 | 200 | light | 3.60 | 8 | 30 / 4 / 23 | Naval Yard | Fast sea drone: sonic pulse against ships and subs, detects subs and shakes a Kraken off its prey. |

**Factiegebouwen**

| Gebouw | $ | Bouwtijd (s) | HP | Grootte | Stroom | Wapen: schade / bereik / DPS | Vereist | Functie |
|---|--:|--:|--:|---|--:|---|---|---|
| **Pillbox** | 500 | 7 | 600 | 1×1 | 0 | 18 / 5.5 / 45 | Barracks | Concrete machine-gun bunker against infantry. Works without power. |
| **Refractor Tower** | 1500 | 14 | 700 | 1×1 | -75 | 120 / 8 / 45 | Radar Array | Long-range light beam with splash damage. Offline on low power. |
| **Airfield** | 1000 | 12 | 1000 | 3×3 | -50 | – | Radar Array | Four landing pads. Kestrels launch here and rearm their missiles. |
| **Skyguard SAM** | 900 | 10 | 600 | 1×1 | -50 | 70 / 9 / 53 | Radar Array | Long-range anti-air missiles. Hits air targets only. Offline on low power. |
| **Phase Gate** | 2500 | 30 | 1000 | 3×3 | -200 | – | Research Lab | Superweapon: teleports a group of vehicles across the map. Charges in 4 minutes (not on low power). |
| **Storm Engine** | 5000 | 45 | 1200 | 3×3 | -200 | – | Research Lab | Superweapon: lightning storm over an area. Charges in 6 minutes (not on low power). |

**Speelstijl:** de Warden Tank is snel en veelzijdig. De Lancer IFV is het Zwitserse zakmes: zijn wapen hangt af van de passagier (Rifleman → machinegeweer, Phase Trooper → fasestraal, Nova → sluipschutter). Lucht via het Airfield, hinderlagen met de Shroud Tank, chirurgisch werk met Nova en de Phase Gate om een tankgroep midden in de vijandelijke basis te zetten.

### 9.2 Red Bloc: pantser, artillerie, brute kracht

Red Bloc gebruikt de gedeelde Rifleman, Attack Dog en Scout Jeep onder eigen namen: **Draftee**, **War Hound** en **Raider**.

**Infanterie**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Draftee** | 200 | 5 | 125 | none | 1.26 | 6 | 11 / 4.2 / 15 | Bloc Barracks | Cheap basic infantry. Can dig in (E): stays put, gains range and takes less damage. |
| **War Hound** | 200 | 4 | 100 | none | 2.40 | 7 | 150 / 1.1 / 180 | Bloc Barracks | Fast. Kills infantry in one bite, useless against vehicles and buildings. Exposes disguised spies. |
| **Arc Trooper** | 500 | 9 | 200 | light | 1.05 | 6 | 60 / 4 / 45 | Bloc Barracks + Radar Tower | Armored infantry with a short-range electric discharge. Strong against everything. Requires Radar. |
| **Flak Gunner** | 300 | 6 | 120 | none | 1.20 | 7 | 26 / 5.5 / 26 | Bloc Barracks | Anti-air infantry. Also hits infantry on the ground. |
| **Sapper** | 600 | 9 | 125 | none | 1.50 | 6 | tijdbom: 450 schade in straal 1,8 na 5 s / 1.2 | Bloc Barracks + Radar Tower | Plants a time bomb on units or buildings. After 5 seconds: heavy explosion that also hits bystanders. |
| **Blight Trooper** | 600 | 9 | 150 | none | 1.20 | 6 | 75 / 4.5 / 45 | Bloc Barracks + Research Institute | Radiation rifle against infantry. Deploy (E) for a radiation field that kills nearby enemy infantry. |
| **Grom** (held) | 1500 | 20 | 300 | none | 1.80 | 9 | 65 / 5.5 / 122 + laser: 3× luchtaanval à 300 / 7 | Bloc Barracks + Research Institute | Hero. Heavy rifle against infantry; paints buildings with a laser to call in an air strike. Max 1. |

**Voertuigen**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Anvil Heavy Tank** | 850 | 12 | 420 | heavy | 1.80 | 7 | 47 / 5.5 / 26 | War Factory | Heavily armored twin-barrel tank. Slow. |
| **Raider** | 500 | 7 | 180 | light | 3.00 | 8 | 9 / 5 / 34 | War Factory | Fast scout with a machine gun. Strong against infantry. |
| **Colossus Tank** | 1750 | 22 | 1000 | heavy | 1.26 | 7 | 85 / 6 / 43 | War Factory + Research Institute | Super-heavy twin-cannon tank. Slowly repairs itself. Requires Tech Center. |
| **Longbow Launcher** | 900 | 14 | 160 | light | 1.35 | 7 | 170 / 10 / 34 | War Factory + Radar Tower | Rocket artillery with huge range and splash damage. Strong against buildings, defenseless up close. Requires Radar. |
| **Flak Hauler** | 600 | 9 | 260 | light | 2.55 | 8 | 22 / 6 / 33 | War Factory | Tracked anti-air. Carries 5 infantry: right-click it with infantry selected, E to unload. |
| **Leech Drone** | 500 | 7 | 100 | light | 3.30 | 7 | 200 / 1.1 / 200 | War Factory | Fast spider bot: kills infantry and crawls into vehicles, eating them from within. Only a Repair Depot can remove it. |

**Lucht**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Thunderhead Airship** | 2000 | 24 | 1600 | heavy | 0.75 | 7 | 160 / 0.9 / 96 | War Factory + Research Institute | Slow, heavily armored airship that drops devastating bombs on whatever is below. Requires Tech Center. |
| **Siege Rotor** | 1100 | 14 | 300 | light | 3.00 | 8 | 14 / 5 / 42 | War Factory + Radar Tower | Helicopter with a machine gun against ground troops. Land (E) to become long-range artillery, but then it is a ground target. |

**Zee**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Flak Boat** | 600 | 7 | 300 | light | 3.00 | 8 | 20 / 6 / 43 | Naval Yard | Fast anti-air patrol boat, also good against infantry on the shore. Detects nearby subs. |
| **Barracuda Sub** | 1000 | 12 | 600 | heavy | 1.95 | 7 | 120 / 6 / 51 | Naval Yard | Submarine: invisible underwater until it fires. Torpedoes hit only ships and buildings on water. |
| **Leviathan** | 2000 | 22 | 900 | heavy | 1.35 | 8 | 220 / 13 / 47 | Naval Yard + Research Institute | Missile ship: heavy, very long-range missiles against land and sea targets. Useless against aircraft and subs. |
| **Kraken** | 1000 | 12 | 600 | heavy | 2.40 | 6 | 45 / 1.4 / 54 | Naval Yard + Radar Tower | Invisible sea monster: grabs a ship and crushes it. A Sonar Drone shakes it off. |

**Factiegebouwen**

| Gebouw | $ | Bouwtijd (s) | HP | Grootte | Stroom | Wapen: schade / bereik / DPS | Vereist | Functie |
|---|--:|--:|--:|---|--:|---|---|---|
| **Sentry Gun** | 600 | 8 | 650 | 1×1 | -30 | 24 / 6.5 / 45 | Bloc Barracks | Rapid-fire cannon against infantry and light vehicles. Offline on low power. |
| **Arc Coil** | 1500 | 14 | 800 | 1×1 | -75 | 150 / 7 / 64 | Radar Tower | Heavy electric discharge, destroys anything up close. Offline on low power. |
| **Flak Battery** | 900 | 10 | 700 | 1×1 | -50 | 40 / 8 / 48 | Radar Tower | Anti-air flak with splash damage. Hits air targets only. Offline on low power. |
| **Hammer Silo** | 5000 | 45 | 1200 | 3×3 | -200 | – | Research Institute | Superweapon: heavy missile with radiation. Charges in 6 minutes (not on low power). |
| **Stasis Projector** | 2500 | 30 | 1000 | 3×3 | -200 | – | Research Institute | Superweapon: 20 seconds of invulnerability for vehicles and buildings. Charges in 4 minutes (not on low power). |
| **Assembly Plant** | 2000 | 20 | 1200 | 3×3 | -100 | – | War Factory + Radar Tower | Vehicles (and ships) cost 25% less and build 25% faster. |

**Speelstijl:** dikke tanks (Anvil, Colossus met zelfherstel), langeafstandsartillerie (Longbow, Leviathan, Siege Rotor) en de Thunderhead die alles onder zich platbombardeert. Arc Troopers laden Arc Coils op, waarna die zonder stroom en 2× zo snel vuren. De Stasis Projector maakt een aanvalsgolf 20 s onkwetsbaar.

### 9.3 Psi Directorate: mind control, onconventioneel

**Infanterie**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Adept** | 200 | 5 | 110 | none | 1.26 | 6 | 16 / 4.2 / 20 | Psi Barracks | Basic infantry with a psionic discharge. |
| **Mauler** | 500 | 8 | 340 | light | 1.35 | 6 | 85 / 1.3 / 73 | Psi Barracks | Mutated powerhouse. Smashes infantry and vehicles alike, but only up close. |
| **Mentalist** | 800 | 10 | 100 | none | 1.20 | 6 | mind control (1 unit) / 5 | Psi Barracks + Psi Sensor Array | Mind-controls one enemy unit. If the Mentalist dies, the unit is released. Requires Radar. |
| **Toxin Sniper** | 600 | 9 | 110 | none | 1.20 | 9 | 125 / 9 / 50 | Psi Barracks + Psi Sensor Array | Long-range sniper against infantry. Victims leave a toxic cloud. |
| **The Oracle** (held) | 1800 | 22 | 220 | none | 1.35 | 9 | mind control (units + gebouwen) / 7 | Psi Barracks + Psi Laboratory | Hero. Mind-controls units at long range and permanently takes over enemy buildings. Psi Storm (E) wipes out nearby infantry. Max 1. |

**Voertuigen**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Lash Tank** | 750 | 11 | 360 | heavy | 2.10 | 7 | 50 / 5.2 / 47 | War Factory | Psionic beam. Strong against infantry. |
| **Spinner Tank** | 650 | 9 | 240 | light | 2.40 | 8 | 9 / 5.5 / 19 | War Factory | Gatling cannon that fires faster the longer it keeps shooting. Strong against infantry. |
| **Magnetar** | 1300 | 16 | 260 | light | 1.50 | 8 | 55 / 8 / 41 | War Factory + Psi Laboratory | Long-range magnetic beam, devastating against vehicles and buildings. Requires Tech Center. |
| **Thrall Hauler** | 1500 | 13 | 1000 | heavy | 1.35 | 5 | – | War Factory | Psi harvester with 3 Thralls. Harvests on its own, or deploy (E) near a field: it becomes a mobile refinery and the Thralls mine around it. |
| **Hivemind** | 1750 | 20 | 500 | heavy | 1.20 | 8 | mind control (3 units) / 6 | War Factory + Psi Laboratory | Controls up to 3 units at once. Taking more overloads it and it rapidly loses health. |
| **Delirium Drone** | 900 | 12 | 250 | light | 2.40 | 7 | 10 / 3 / 3 | War Factory + Psi Sensor Array | Gas cloud: affected enemies go delirious and attack everything nearby for 10 seconds, including their own troops. |

**Lucht**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Hover Disc** | 1500 | 18 | 450 | light | 2.70 | 8 | 40 / 4.5 / 40 | War Factory + Psi Laboratory | Hovering laser disc, hits ground and air targets. Drains power from plants and cash from refineries. Requires Tech Center. |

**Zee**

| Unit | $ | Bouwtijd (s) | HP | Pantser | Snelheid (tegels/s) | Zicht | Wapen: schade / bereik / DPS | Vereist | Bijzonderheden |
|---|--:|--:|--:|---|--:|--:|---|---|---|
| **Psi Submarine** | 1400 | 16 | 700 | heavy | 1.80 | 7 | 110 / 9 / 41 + 120 / 6 / 51 | Naval Yard | Submarine with missiles against land and torpedoes against ships. Invisible underwater until it fires. |

**Factiegebouwen**

| Gebouw | $ | Bouwtijd (s) | HP | Grootte | Stroom | Wapen: schade / bereik / DPS | Vereist | Functie |
|---|--:|--:|--:|---|--:|---|---|---|
| **Gatling Cannon** | 1000 | 10 | 700 | 1×1 | -40 | 12 / 6.5 / 26 | Psi Barracks | Spins up: fires faster and faster. Strong against infantry. Offline on low power. |
| **Psi Spire** | 1500 | 14 | 700 | 1×1 | -75 | 70 / 7 / 47 | Psi Sensor Array | Psionic beam against vehicles. Offline on low power. |
| **Dominion Engine** | 5000 | 45 | 1200 | 3×3 | -200 | – | Psi Laboratory | Superweapon: permanently takes over everything in an area. Charges in 6 minutes (not on low power). |
| **Mutagen Spire** | 2500 | 30 | 1000 | 3×3 | -200 | – | Psi Laboratory | Superweapon: turns enemy infantry into Maulers for you. Charges in 4 minutes (not on low power). |
| **Reclaimer** | 1200 | 12 | 900 | 3×3 | -50 | – | Thrall Refinery | Right-click the Reclaimer with your own (or captured) ground units: they are recycled for half their cost. |
| **Duplicator Vats** | 2500 | 25 | 1000 | 2×2 | -100 | – | Psi Barracks + Psi Laboratory | Every infantry trained comes out of the barracks twice (not heroes). |
| **Psi Beacon** | 1000 | 10 | 700 | 2×2 | -50 | – | Psi Sensor Array | Shows enemy units' attack targets on the minimap and reveals subs and spies within 10 tiles. |

**Speelstijl:** de vijand tegen zichzelf keren. Mentalist, Hivemind (tot 3 units; meer overbelast hem) en The Oracle nemen eenheden over. De Reclaimer maakt van buit geld. De Delirium Drone laat vijanden elkaar aanvallen. De Thrall Hauler kan als mobiele raffinaderij midden op een veld gaan staan. De Dominion Engine neemt een heel gebied permanent over.

---

## 10. Gedeelde gebouwen en eenheden

Gebouwen die elke factie heeft (met de factie-eigen naam):

| Gebouw | Naam Allied / Red Bloc / Psi | $ | Bouwtijd (s) | HP | Grootte | Stroom | Vereist | Functie |
|---|---|--:|--:|--:|---|--:|---|---|
| **Construction Yard** | Construction Yard | 3000 | 30 | 1500 | 3×3 | +20 | – | Heart of the base. Builds all structures. |
| **Power Plant** | Power Plant / Dynamo Plant / Bio Reactor | 800 | 8 | 750 | 2×2 | +100 | Construction Yard | Provides 100 power. |
| **Ore Refinery** | Ore Refinery / Thrall Refinery | 2000 | 14 | 900 | 3×3 | -40 | Power Plant | Processes ore into credits. Includes a free Ore Hauler. |
| **Barracks** | Barracks / Bloc Barracks / Psi Barracks | 500 | 8 | 800 | 2×2 | -20 | Power Plant | Trains infantry. |
| **War Factory** | War Factory | 2000 | 15 | 1200 | 3×3 | -40 | Ore Refinery | Builds vehicles. |
| **Radar Array** | Radar Array / Radar Tower / Psi Sensor Array | 1000 | 12 | 1000 | 2×2 | -50 | Ore Refinery | Enables the minimap (with enough power). Required for heavy vehicles. |
| **Tech Center** | Research Lab / Research Institute / Psi Laboratory | 2000 | 20 | 1000 | 3×3 | -100 | War Factory + Radar Array | Unlocks your faction's most advanced units. |
| **Repair Depot** | Repair Depot | 800 | 10 | 1000 | 2×2 | -20 | War Factory | Repairs adjacent friendly vehicles (costs credits). Right-click the depot with vehicles selected. |
| **Wall** | Barrier Wall / Bloc Wall / Psi Wall | 100 | 2 | 400 | 1×1 | 0 | Power Plant | Wall. Drag to place a line (each extra segment costs $100). Not auto-targeted. |
| **Naval Yard** | Naval Yard | 1000 | 12 | 1200 | 3×3 | -20 | Ore Refinery | Built on open water. Builds ships and repairs adjacent ships (costs credits). |

Eenheden die elke factie heeft (de Ore Hauler alleen Allied en Red Bloc):

| Unit | Factie | $ | Bouwtijd (s) | HP | Pantser | Snelheid | Vereist | Functie |
|---|---|--:|--:|--:|---|--:|---|---|
| **Ore Hauler** | Allied, Red Bloc | 1400 | 12 | 1000 | heavy | 1.35 | War Factory | Gathers ore automatically and hauls it to the refinery. |
| **Engineer** | alle | 500 | 8 | 75 | none | 1.20 | Barracks | Captures enemy buildings or fully repairs your own (right-click the building). Consumed on use. |
| **Base Crawler** | alle | 3000 | 30 | 1000 | heavy | 1.20 | War Factory + Repair Depot | Mobile construction yard. Deploy (E) into an extra Construction Yard, even far from your base. |
| **Amphibious Transport** | alle | 900 | 10 | 400 | heavy | 2.10 | War Factory + Radar Array | Sails and drives: carries 8 infantry over land and water. Unarmed. On water it can only unload at the shore. |

**Base Crawler (MCV):** ontplooit tot een extra Construction Yard, ook ver van je basis. Een Construction Yard kan weer inpakken. Zo breid je uit naar een tweede ore-veld, of begin je opnieuw na verlies van je CY.

---

## 11. Vaardigheden

Eén vaardigheid per eenheid of gebouw. Je activeert hem met **E** of de knop in de commandobalk; de cooldown is zichtbaar.

| Vaardigheid | Cooldown (s) | Effect |
|---|--:|---|
| **Deploy** (deploy) | – | Builds a Construction Yard here (needs 3×3 clear ground). |
| **Pack Up** (pack) | – | Packs the Construction Yard up into a Base Crawler. |
| **Unload** (unload) | – | Unloads all passengers. |
| **Dig In** (digin) | 30 | Dug in: stays put, +1.5 range and 40% less damage taken. Press E again to stand up. |
| **Deploy** (rig) | 30 | Deployed: mobile refinery for its own Thralls, which mine ore around it. Press E again to drive. |
| **Land** (land) | 30 | Land as artillery (long range, ground target) or take off again. |
| **Irradiate** (irradiate) | 30 | Deployed: radiation field that kills nearby enemy infantry. Stationary. Press E again to pack up. |
| **Psi Wave** (psiwave) | 600 | Psionic shockwave: heavy damage to all nearby enemy infantry (3 tiles). |
| **Psi Storm** (psistorm) | 450 | Massive psionic storm: kills enemy infantry up to 4.5 tiles away and damages vehicles. |

Daarnaast werken veel mechanieken via rechtsklik in plaats van een vaardigheidsknop: instappen, garrison, overnemen (Engineer), infiltreren, recyclen (Reclaimer) en repareren (Repair Depot).

---

## 12. Superwapens

**Keuze:** standaard **aan**, net als in het origineel. Je zet ze uit met het vinkje "Superweapons" in de lobby.

| Superwapen | Factie | $ | Laadtijd | Straal (tegels) | Effect |
|---|---|--:|--:|--:|---|
| **Phase Gate** | Allied | 2500 | 4 min | 2.5 | Teleports all vehicles in an area to a second point. Infantry does not survive (Phase Troopers and heroes do); anything landing on water or rocks is lost. |
| **Storm Engine** | Allied | 5000 | 6 min | 4 | Lightning strikes around the target for ten seconds. |
| **Hammer Silo** | Red Bloc | 5000 | 6 min | 4 | Heavy missile: massive explosion, then 25 seconds of radiation. |
| **Stasis Projector** | Red Bloc | 2500 | 4 min | 2.5 | Vehicles and buildings in the area are invulnerable for 20 seconds. Infantry dies. |
| **Dominion Engine** | Psi | 5000 | 6 min | 3 | Permanently takes over all enemy units and buildings in the area (not heroes). |
| **Mutagen Spire** | Psi | 2500 | 4 min | 3 | Turns enemy infantry in the area into Maulers that fight for you (not heroes). |

Regels:
- **Eén per soort per speler.** Ze laden alleen bij voldoende stroom.
- **Iedereen** krijgt een waarschuwing als een superwapen wordt gebouwd, als het klaar is en als het wordt afgevuurd. De inslagplek wordt gemarkeerd.
- Linksboven staan **klokken voor je eigen superwapens én alle vijandelijke**. Je eigen klok is klikbaar als het wapen klaar is.
- Richten doe je met een cirkel; rechtsklik of Esc annuleert. Bij de Phase Gate klik je eerst de groep aan en dan de bestemming.
- Bij de Phase Gate sterft infanterie, behalve Phase Troopers en helden. Wat op water of rotsen belandt, gaat verloren.
- De Hammer Silo-raket heeft een paar seconden vliegtijd, zodat iedereen hem ziet aankomen. Daarna volgt 25 s straling.
- Screen shake als een superwapen in beeld inslaat (uit bij reduced motion).

---

## 13. Kaarten en de neutrale wereld

### Kaarttypes
| Kaart | Beschrijving |
|---|---|
| **Open Plains** | Open terrein, weinig obstakels |
| **Twin Rivers** | Een rivier met bruggen scheidt de bases |
| **Rocky Highlands** | Rotsen en bossen, smalle passen |
| **Inland Sea** | Grote binnenzee met een middeneiland, bereikbaar via bruggen; ruimte voor een vloot |
| **Archipelago** | Elke basis op een eigen eiland; lange bruggen naar het middeneiland |
| **Random** | Willekeurig uit de seed |

- **Grootte:** small 48×48, medium 64×64, large 96×96 tegels.
- **Ore:** low / normal / high.
- **Generatie:** seeded en deterministisch, met **puntsymmetrische** startposities.
  - Wegen eindigen op het middelpunt, zodat bruggen niet breken bij het spiegelen.
  - Kleine plasjes worden land.
  - Een test controleert dat alle starts bereikbaar zijn, op alle presets en groottes.
- **Zeekaarten:** elke basis krijgt een havenbekken met een vaargeul naar de gedeelde zee. Het eigen ore-veld ligt aan de andere kant van de basis.
- **Terrein:** gras, zand, water, rots, weg, bomen, ore, gems en bruggen. Zachte overgangen in de volgorde weg < zand < gras < rots. De kaartrand is een zachte, korrelige overgang naar zwart in plaats van een harde ruit.
- **Fog of war:** onverkend is zwart. Verkend maar niet zichtbaar toont terrein en eerder geziene gebouwen, maar geen actuele eenheden.

### De burgers (aan/uit: "Civilians")
Een neutrale speler die stadjes, tech-gebouwen en bruggen bezit. Hij speelt niet mee, verliest nooit en wordt nooit automatisch beschoten (Ctrl+rechtsklik = gericht vuur). Alle structuren worden puntsymmetrisch geplaatst en blokkeren nooit de route tussen bases.

| Gebouw | HP | Grootte | Functie |
|---|--:|---|---|
| **House** | 900 | 2×2 | Civilian house. Holds 3 infantry: they fire from inside with extra range and can't be hit until it collapses. |
| **Office Block** | 1300 | 2×2 | Office building. Holds 5 infantry. |
| **Town Hall** | 2000 | 3×3 | Town hall. Holds 8 infantry. |
| **Farmhouse** | 800 | 2×2 | Farmhouse. Holds 3 infantry. |
| **Fuel Rig** | 1000 | 2×2 | Tech building. Capture with an Engineer: +$15 per second. |
| **Field Hospital** | 1000 | 2×2 | Tech building. Capture with an Engineer: all your infantry slowly heals, anywhere. |
| **Machine Shop** | 1000 | 2×2 | Tech building. Capture with an Engineer: all your vehicles slowly self-repair, anywhere. |
| **Outpost** | 800 | 2×2 | Tech building. Capture with an Engineer: sees 14 tiles far. |
| **Bridge Repair Hut** | 600 | 1×1 | Send an Engineer here to rebuild the destroyed bridge next to it. |
| **Bridge** | 2500 | 1×1 | Bridge. Can only be destroyed by targeted fire; an Engineer in the repair hut rebuilds it. |

- **Vernietigbare bruggen:** alleen gericht vuur raakt ze. Wat erop staat verdrinkt. Routes en weergave worden direct bijgewerkt. Een Engineer in het brughuisje herbouwt de brug.

### Bonuskratten (aan/uit: "Bonus crates")
Een kist oppakken geeft één van vier dingen:
- $1.000 (35%)
- Promotie (25%)
- Herstel van alle eigen eenheden binnen 5 tegels
- Kaartonthulling

---

## 14. Zee

- **Naval Yard** (alle facties, vereist een Ore Refinery): je bouwt hem op open water binnen bouwbereik. Hij maakt schepen (in de voertuigenrij) en repareert schepen die ernaast liggen.
- **9 schepen**: 4 Allied, 4 Red Bloc en 1 Psi (zie de factietabellen). Ze varen ook onder bruggen door.
- **Onderzeeërs** zijn onzichtbaar tot een sonar in de buurt is of ze vuren. Alleen torpedo's, dieptebommen en sonarpulsen raken ze.
- **Torpedo's** raken alleen doelen op het water.
- **Kraken-grijp:** het doelschip zit vast (groene ring). Een Sonar Drone schudt de Kraken af.
- **Kustgevecht:** schepen beschieten land vanaf het water, en landeenheden beschieten schepen vanaf de kust.
- **Nova zwemt**, en de Amphibious Transport rijdt en vaart.
- **Keuze:** zee kwam pas in fase 11, na de bewegingslagen uit fase 9. De eerste kaarten hadden nauwelijks open water, dus zonder watermaps had een vloot geen zin.

---

## 15. AI-tegenstanders

### Principe: de AI speelt eerlijk
- De AI leest alleen tegels die zichtbaar zijn, gebouwen die ze eerder heeft gezien en publieke kaartinfo. Ze heeft geen verborgen kennis en ziet ook geen stealth-eenheden.
- **Geen bonussen op Hard.** Moeilijkheid verschilt alleen in besluitvorming, reactietijd en aanvalsgrootte. Easy en Normal krijgen juist een handicap.
- Speler en AI gebruiken **dezelfde commandofuncties**, met eigendomscontrole.
- De soak-test controleert elke seconde dat de AI nooit credits heeft die ze niet verdiend heeft.

### Niveaus
| | Easy | Normal | Hard |
|---|---|---|---|
| Productiesnelheid | 70% | 85% | 100% |
| Denkt elke | 2 s | 1 s | 1 s |
| Eerste aanval | na 5 min | na 4 min | na 5 min (maar groter) |
| Eerste golf / groei | 3 / +1 | 8 / +2 | 14 / +3 |
| Tijd tussen golven | 150 s | 100 s | 70 s |
| Raffinaderijen / fabrieken / torens | 1 / 1 / 1 | 2 / 1 / 2 | 2 / 2 / 3 |
| Verdedigt binnen | 10 tegels | 14 | 18 |
| Volle golven / terugtrekken bij 50% verlies | nee / nee | ja / nee | ja / ja |

Gemeten: Normal wint ~20–12 van Easy, Hard 21–11 van Normal en 21–11 van Easy.

**Les:** sneller "denken" (elke 12 ticks) maakte Hard juist zwakker. Daarom staat het nu op 30 ticks. Eerder won Easy zelfs 23–2 van Normal, omdat de "slimmere" niveaus te lang spaarden en met te kleine golven aanvielen.

### Wat de AI doet
- **Basis:** bouwt op prioriteit (power → refinery → barracks → factory → extra power → radar → tech → verdediging → extra productie) en past die volgorde aan de situatie aan. Ze spaart eerst voor een tweede raffinaderij. Ze plaatst gespiegeld, zodat haar uitgangen ook naar het midden wijzen.
- **Leger:** bouwt uit de `roster` van haar factie (raider, AA, tech-unit, anti-infanterie, anti-tank, specialisten, helden, vloot). Ze kiest tegen wat ze ziet: raketten tegen pantser, jeeps tegen infanterie, en AA-gebouwen zodra ze vijandelijke lucht ziet.
- **Aanvallen** in golven die groeien tot maximaal 20 eenheden. Een golf die te lang op zich laat wachten, vertrekt met wat er is (minstens de helft). Zonder die regel kon een AI 30 minuten blijven wachten.
- **Verdedigen:** reageert op aanvallen binnen haar straal en repareert gebouwen. Beschadigde voertuigen rijden naar de Repair Depot.
- **Herstel:**
  - Zonder oogster annuleert ze alles behalve een nieuwe oogster.
  - Is ze blut, dan verkoopt ze overbodige gebouwen.
  - Is haar CY weg, dan bouwt ze een Base Crawler.
- **Zoeken:** ziet ze geen vijandelijke gebouwen, dan doorzoekt ze de startposities van de overgebleven tegenstanders.
- **Specials:**
  - Engineers nemen tech-gebouwen in en herbouwen bruggen.
  - Ongebruikte infanterie gaat in burgergebouwen bij de basis.
  - Mentalist en Oracle gebruiken psi-golf en psi-storm op groepjes infanterie.
  - Op zeekaarten bouwt ze een Naval Yard en schepen.
  - Psi bouwt een Psi Beacon.
  - Superwapens bouwt ze na 6 minuten. Aanvalswapens vuurt ze af op de rijkste bekende vijandelijke plek; Stasis en Phase Gate gebruikt ze voor haar eigen golf.
  - Is er geen route over land, dan zet ze een **veerdienst** op met de Amphibious Transport.

---

## 16. Interface: "Command Console"

**Keuze (v1.2):** van een generieke, platte donkere UI naar een zware, factie-eigen commandoconsole. Het materiaal is puur CSS (gradients, inset-bevels, klinknagels via radial-gradient, gaas via repeating-linear-gradient). Er is geen bitmap-artwork nodig: dat is licentieschoon en schaalt overal.

### Kleur en type
- **Kleurstrategie:**
  - De chrome is *Committed*: de factiekleur draagt 30–50% van de sidebar.
  - Het slagveld is *Restrained*: alleen statuskleuren (groen/geel/rood voor hp, rood = vijand/gevaar, cyaan = info).
- **Tokens:** OKLCH-kleuren in `styles.css`, per factie via `[data-faction]`.
- **Fonts:**
  - **Barlow Condensed** voor labels, knoppen en koppen (uppercase met tracking).
  - **Barlow** voor lopende tekst en tooltips.
  - **Share Tech Mono** voor credits, timers en aftellers.

### Sidebar (rechts, van boven naar onder)
1. Factie-embleem (eigen geometrisch ontwerp) met **rollende credits-teller**.
2. **Radar** met luiken die opengaan bij "Radar online", sluiten bij stroomtekort, en ruis tonen als hij offline is. Rode pings waar je geraakt wordt.
3. Repair- en Sell-knoppen.
4. **Vier icoontabs:** Structures, Defense, Infantry, Vehicles. Een tab toont een voortgangsring of een ready-stip.
5. **Cameo-raster** met de staten idle, building (clock-wipe met wijzer en resterende tijd), queued ×N, on hold, ready, locked (slot + vereiste), te duur (rode prijs) en placing.
6. **Verticale stroomrail** langs de binnenrand: segmenten, een marker voor het verbruik, rood bij tekort.

Breedte:
- ≥1680 px: 340 px en 3 cameo-kolommen.
- 1180–1679 px: 272 px en 2 kolommen.
- Touch of <1180 px: een lade.

### Overige HUD
- **Commandobalk** onderaan, bij een selectie: portret, naam, hp in 10 segmenten, details (rang, lading) en bevelknoppen met sneltoetsletter. Groepen tonen per type een knop.
- **Superwapenklokken** linksboven, met de berichten eronder.
- **Topbalk** als metalen strip: speltijd, snelheid, Options en Log. Pauze is een dimlaag met een "PAUSED"-plaat.
- **Berichtlog** met tijdstempels en de naam van de announcer.

### Leesbaarheid van het slagveld
- **Selectie:** hoekhaken rond voertuigen, schepen, vliegtuigen en gebouwen (wit, rood voor de vijand). Infanterie houdt een kleine ellips.
- **Levensbalk in segmenten:** 4 (infanterie), 6 (voertuig), 8 (schip) of 6–14 (gebouw). Groen > 50%, geel > 25%, rood daaronder. Het aantal brandende segmenten vertelt hetzelfde zonder kleur. **Vijandelijke balken zijn gestreept.** Groepsnummer en veteranie-chevrons staan ernaast.
- **Orderlijnen** van elke eenheid naar het doel, weg na 0,6 s: groen = move, rood = attack, oranje = attack-move, geel = capture/guard.
- **Stroomtekort:** gebouwen gedimd en ontkleurd, met een knipperende bliksemschicht; verdediging toont **OFFLINE**.
- **Juice:**
  - "+$" boven de raffinaderij, een sleutelicoon bij repareren, stofwolkjes achter voertuigen.
  - Rook bij < 50% en vuur bij < 25% gezondheid.
  - Mondingsvuur, lichtsporen, raketbogen met rookspoor, elektrische bogen, inslagvonken en terugslag van kanonnen.

### Shell
- **Hoofdmenu:**
  - Consolepaneel rechts ("Iron / Front") met knoppen die klikken.
  - Op de achtergrond een **live AI-tegen-AI-potje**: kleine willekeurige kaart, 60% snelheid, gedimd, zonder geluid, camera drijft tussen de bases. Het loopt door achter lobby, opties en credits en stopt zodra een echt spel laadt.
  - Bij reduced motion is het een stilstaand beeld.
  - Bijkomend voordeel: de gedeelde art is dan al gebakken, waardoor een spel sneller start (2,7 s in plaats van 9,6 s).
- **Lobby:**
  - Factiekeuze als drie grote emblemen.
  - Spelerslots als rijen (factie, AI-niveau en kleur per AI, 1–3 AI's).
  - **Kaartvoorbeeld van de echte seed** met genummerde startposities.
  - Ore, burgers, kratten en seed onder "Advanced".
- **Briefing** als laadscherm: embleem, kaart met startposities, tegenstanders, doel, **echte laadstappen als terminalregels** ("Baking sprites… 42/91") en wisselende tips. Blijft minstens 1 s staan en verschijnt vóór het sprite-bakken.
- **Scorescherm:** zie §4.

---

## 17. Geluid en stemmen

### Announcers
- Per factie een eigen naam en stem (AEGIS, KOMMAND, CHOIR), elk met **70 regels**.
- Offline gegenereerd met **Piper TTS** (`tools/gen-voices.py`, regels in `src/game/data/voicelines.json`).
- Nabewerking per factie: radiofilter, ruis, echo, squelch of toon.
- De generator controleert de lengte van elke regel en probeert opnieuw bij gebrabbel.
- **Keuze:** eerst gebruikte de game `speechSynthesis` van de browser. Die klinkt per besturingssysteem anders en is niet te filteren. Daarom zijn de stemmen nu vooraf gegenereerd.

Regelset: Building · Construction complete · Unit ready · On hold · Cancelled · Insufficient funds · Low power · Power restored · Radar online/offline · Our base is under attack · Our harvester is under attack · Unit lost · Structure lost · Structure sold · Unit promoted · New construction options · Building captured · Battle control online · Select target · alle superwapenmeldingen (online, ready, activated, plus vijandelijke waarschuwingen) · Mission accomplished · Mission failed.

**Spreekwachtrij:**
- Eén regel tegelijk, op prioriteit: gevaar > afwachten > klikfeedback.
- Cooldown per regel; verouderde regels vallen weg.
- **De muziek zakt 6 dB** zolang de announcer praat.
- Aanvallen op gewone eenheden zeggen niets. Alleen basis en oogster melden zich, anders wordt het geroep te veel.

### Unit-antwoorden
- Per factie en per klasse (infanterie droog; voertuig, schip en vliegtuig over de radio; Psi met echo), 8 regels per klasse.
- De helden hebben eigen regels.
- Een nieuw antwoord breekt het vorige af, en snel opnieuw selecteren blijft stil.
- **Keuze:** acks horen bij fase 16 en zijn niet uitgesteld.

### Effecten en muziek
- Samples van Kenney (CC0), rubberduck (CC0), Baradari (CC-BY 3.0) en Thimras (CC0), met varianten, toonhoogtevariatie en stereo-panning op schermpositie. Synthese is de terugval.
- **Muziek:** 3 nummers (Zhelanov CC-BY 3.0/4.0, congusbongus CC0), shuffle met crossfade.
- **Volumes:** music, sfx, voice (announcer) en unit voices, plus announcer aan/uit.
- De stemmen zijn op 2026-10-02 door de opdrachtgever beluisterd en goedgekeurd.

---

## 18. Art direction

**Keuze:** zo dicht mogelijk bij de look van het RA2-tijdperk komen, uitsluitend met open gelicentieerde assets. Die games renderden 3D- of voxelmodellen vooraf naar isometrische sprites. Iron Front doet hetzelfde, maar dan **bij het laden in de browser** (three.js → sprite-atlassen per teamkleur).

- **Projectie:** 2:1-dimetrie, een orthografische camera op 30° elevatie en 45° azimut. Een tegel is 64×32 px bij zoom 1. Alles wordt op 2× resolutie gerenderd.
- **Schaal:** voertuigen ≈ 0,8–1,25 tegel lang, infanterie 0,56 tegel hoog. Gebouwen vullen hun footprint.
- **Licht:** zon linksboven (warm wit), hemisferisch fill-licht. Echte schaduwen vallen naar rechtsonder (dekking 0,38).
- **Richtingen:**
  - Voertuigen hebben 32 richtingen, met de geschuttoren apart gebakken en op zijn draaipunt geplaatst.
  - Infanterie heeft 16 richtingen en loop-, vuur- en sterfanimaties.
  - Verdedigingstorens draaien.
- **Teamkleur** op grote vlakken van voertuigen, uniformen, huiven en gebouwaccenten. De **factietint** vervangt de basistint van gebouwen.
- **Terrein:** fotorealistische CC0-texturen (ambientCG), per wereldpositie geprojecteerd zodat ze naadloos zijn.
  - Water is procedureel geanimeerd (16 frames, schuim, branding).
  - Bruggen zijn gebakken betonnen overspanningen.
  - Ore bestaat uit 3D-kristalclusters met 6 uitputtingsstadia.
- **Stijlanker:** low-poly, realistische proporties, gedempte militaire kleuren, niets cartoonesk of chibi.
- **Bronnen:** Quaternius, Kenney en poly.pizza (CC0/CC-BY). Waar niets passends bestond, zijn schepen, superwapens en sommige gebouwen procedureel of uit CC0-onderdelen samengesteld, en zo geregistreerd.
- **Assets via ID:** gameplaydata verwijst naar sprite-ID's. Vervangen raakt nooit gameplaycode. Ontbreekt een asset, dan verschijnt een herkenbare placeholder met een waarschuwing, zonder crash.
- **Dev-tool:** `/?art` toont alle gebakken sprites.

---

## 19. Toegankelijkheid

- **WCAG AA-contrast** voor alle tekst op elk factiethema. Een test rekent OKLCH om naar WCAG-contrast. Daarbij gevonden en verholpen: kleine grijze tekst (4,1 → ≥ 4,5) en Psi-labels (2,7 → ≥ 3).
- **Kleur draagt nooit alleen betekenis:** segmentaantal op levensbalken, gestreepte vijandbalken, iconen bij status.
- **Kleurenblindpalet:** Okabe-Ito-spelerskleuren, levensbalk in blauw/geel/vermiljoen, en orderlijnen die ook bij rood-groenblindheid uit elkaar te houden zijn.
- **Ondertitels** voor announcerregels; de log bewaart ze altijd.
- **Reduce motion**, bovenop `prefers-reduced-motion`: geen screen shake, geen knipperen, een stilstaand menu en geen optellende scores.
- **Interface size** 90–125% (HUD en menu's, niet de kaart).
- Alles is bereikbaar met een sneltoets op desktop; touch-targets zijn minstens 44 px op tablet.
- Edge scrolling aan/uit.

---

## 20. Techniek en architectuur

### Stack
TypeScript · React (menu's en HUD) · three.js (sprites bakken bij het laden) · HTML Canvas (slagveld) · Web Audio · Vite · Vitest · Playwright.

**Keuzes:**
- Geen zware game-engine.
- Geen PixiJS. Het canvas met voorgebakken sprites bleek ruim snel genoeg.
- three.js alleen voor het bakken, en pas geladen bij de start van een spel. De menubundel ging daardoor van 1007 naar 295 kB.

### Structuur
```
src/
  App.tsx, main.tsx          schermen: menu → lobby → briefing → game → score
  settings.ts                persistente gebruikersinstellingen
  ui/                        React: MainMenu, Attract, SkirmishSetup, MapPreview, Briefing,
                             GameView, Sidebar, ScoreScreen, SettingsPanel, CreditsScreen, icons
  game/
    Game.ts                  controller: fixed-timestep loop, camera, events → audio/meldingen
    input.ts, cursors.ts     muis/toetsenbord/touch → selectie, camera, commando's
    audio.ts, announcer.ts   Web Audio, spreekwachtrij
    tutorial.ts              stappen met conditie
    data/                    ALLE balans: units, buildings, weapons, factions, abilities, powers, config
    world/                   kaart, mapgen, neutrale structuren
    core/                    state, entities, sim (tick), save
    systems/                 pathfinding, movement, combat, economy, production, fog, orders,
                             abilities, powers, bridges, crates, ai
    render/                  iso-projectie, renderer, art-baker, water, bridge, ore, fx
    tests/                   Vitest, incl. headless AI-tegen-AI
```

### Architectuurkeuzes
- **Simulatie los van rendering.** `core/sim.ts#tick` is een pure functie op `GameState`, met 30 ticks/s × spelsnelheid. De renderer interpoleert tussen ticks. Daardoor draait het hele spel **headless** in tests.
- **Deterministisch.** Een seeded RNG, dus elk potje is reproduceerbaar.
- **Serialiseerbare state.** Alles is plain data behalve een runtime-cache (id-index, bezettingsgrid, eventqueue), die bij het laden wordt herbouwd. Saves hebben een versienummer en worden gevalideerd. Oude saves worden gerepareerd: `Infinity` werd in JSON `null`, en dat leverde afwijkingen op.
- **Data-gedreven.** Elke balanswaarde staat in `data/`. Er zijn geen hardgecodeerde getallen in systemen.
- **Commando's met eigendomscontrole.** Speler en AI gebruiken dezelfde functies.
- **React rendert niet per tick.** `Game.notify()` draait ~8×/s. Het slagveld is één canvas; de minimap tekent zichzelf op 10 Hz.
- **Prestaties:**
  - HUD-render 0,17–0,47 ms per frame (budget 1 ms).
  - Zachte separatie O(n²), gemeten op 1,9 ms/tick bij ~290 eenheden.
  - Shroud-pass 22 ms → 0,07 ms.
  - Alleen de sprites van facties in het potje worden gebakken. Laadtijd ging van ~17 s naar ~3,5 s, spritegeheugen van 184 naar 77 MB.
  - Animaties raken alleen transform en opacity.
- **Dev-hooks:** `window.__game`, `window.__step(n)`, `__freeze` en `window.__hud` voor tests en metingen.

### Commando's
```sh
npm install
npm run dev        # development server
npm run build      # type-check + productiebuild
npm test           # unit- en simulatietests
npm run e2e        # Playwright in Chromium, Firefox, WebKit
npm run soak       # 24 volledige AI-potjes met invariantcontroles
npm run balance    # AI-tegen-AI-balansmeting (opties via BALANCE_* env-vars)
```

---

## 21. Balans: hoe gemeten en wat aangepast

**Methode:**
- Duels met gelijke budgetten per matchup.
- Rondes van 27–100+ AI-tegen-AI-potjes per seed en moeilijkheid.
- Varianten: moeilijkheidsparen (`BALANCE_DIFF`), zeekaarten (`BALANCE_MAPS`), spiegelpotjes voor zetelbias (`BALANCE_MIRROR`), zonder superwapens (`BALANCE_NOSW`) en zonder burgers (`BALANCE_NOTOWN`).
- **Doel:** geen factie wint meer dan ~60%.

**Aanpassingen in de laatste ronde (fase 13):**

| Eenheid | Wijziging |
|---|---|
| Lash Tank | gezondheid 280 → 360, schade 44 → 50 |
| Anvil Heavy Tank | schade 44 → 47, bereik 5,2 → 5,5 |
| Colossus Tank | gezondheid 850 → 1000, schade 60 → 85 |
| Rocket Trooper | schade 55 → 45 |
| Adept | schade 20 → 16 |
| Arc Trooper | bereik 3,5 → 4 |

**Resultaat:**
- Landkaarten: **Allied 27 · Red Bloc 27 · Psi 26** (81 potjes, Hard, 3 seeds), 1 patstelling. Daarvoor won Allied 26 van de 54.
- Zeekaarten: Allied 10 · Red Bloc 6 · Psi 11 (27 potjes), 0 patstellingen.
- Zetelbias: P0 56 · P1 51 over 108 potjes, dus geen bias.

**Gevonden oorzaken van patstellingen**, allemaal opgelost:
- Ore raakte op (opgelost met mines).
- Onbereikbare bases op Twin Rivers (mapgen-fix).
- AI-deadlock zonder oogster.
- Een golf die eindeloos wachtte.
- De AI zocht op een onbereikbaar eiland.

---

## 22. Kwaliteit en tests

- **Unit- en simulatietests (Vitest):** per fase een eigen testbestand. Ze dekken pathfinding, plaatsen, productie en kosten, oogsten, gevecht en opruimen, win/verlies, save/load (een geladen spel loopt exact gelijk door), AI-economie en -aanval, en een volledig AI-tegen-AI-potje tot er een winnaar is. Daarnaast per mechaniek: event → announcerregel, contrast per thema, en animaties die geen layout raken.
- **Soak-test:** 24 volledige AI-potjes (alle kaarten, 3 groottes, 2–4 spelers, alle facties en niveaus). Elke seconde wordt gecontroleerd op:
  - Geen negatieve of onverdiende credits.
  - Wachtrijen binnen de limiet.
  - Geen eenheden in gebouwen of rotsen; geen NaN.
  - Een kloppend bezettingsgrid; geen vastgelopen eenheden.
  - Transport- en garrison-boekhouding; statuseffecten die niet blijven hangen.
  - Superwapens die niet laden bij stroomtekort; schepen nooit op land; max. 1 held.

  Resultaat: 0 overtredingen.
- **End-to-end (Playwright) in Chromium, Firefox en WebKit:** de hele checklist via echte klikken, van skirmish starten tot winnen, verliezen, pauze, opslaan/laden en opnieuw spelen. Plus:
  - Vaardigheden, muren, garrison en superwapens via de UI.
  - Cursorwissel en cameo-staten per factie.
  - Tablet met touch (Chromium/WebKit).
  - Menu → lobby → briefing → spel → score.
  - Een AI-tegen-AI-potje van 12 minuten op Archipelago.
  - Een check dat er geen Nederlandse string meer in de UI staat.
- **Visuele regressie:** pixel-baselines per factie, desktop en tablet. Alleen Chromium op macOS, met een vaste seed en een bevroren klok.
- **Geheugen:** 6× een spel starten en stoppen; de JS-heap blijft op 37 MB en alle canvassen worden opgeruimd.

---

## 23. Ontwikkelgeschiedenis

| Fase | Inhoud | Versie |
|---|---|---|
| 1 | Speelbaar fundament: kaart, camera, selectie, pathfinding, CY/Power/Refinery/Factory, oogsten, tank, gevecht, eenvoudige AI, win/verlies. Daarna 3D-art, water, bruggen en ore mines. | |
| 2 | Core RTS: Barracks, infanterie, Radar (minimap), repareren/verkopen, rally points, fog, attack-move, guard, formaties, betere AI | |
| 3 | Drie facties met eigen roster, Tech Center, splash/ramp/regen | |
| 4 | Mind control, engineers, veterancy, luchtmacht, Repair Depot, moeilijkheidsgraden, eerlijke startposities | |
| 5 | Polish: echte audio en muziek, infanterie-animaties, effecten, laadtijd en geheugen omlaag, tooltips, save/load-test | |
| 6 | Release candidate: soak, e2e in 3 browsers, licentie-audit | 1.0.0-rc.1 |
| 7 | Vaardigheden, Base Crawler, transport, Airfield en munitie, muren, AA-gebouwen | |
| 8 | Nieuwe infanterie en helden (Nova, Grom, Oracle), statuseffecten, infiltratie, detectie | |
| 9 | Bewegingslagen, nieuwe voertuigen en lucht, IFV-passagierswapen, Thrall Hauler | |
| 10 | Burgers, garrison, tech-gebouwen, vernietigbare bruggen, kratten, Inland Sea en Archipelago | |
| 11 | Zee: Naval Yard, 9 schepen, onderzeeërs, Kraken, kustgevecht | |
| 12 | 6 superwapens, Assembly Plant, Duplicator Vats, Reclaimer, Psi Beacon, Arc Coil opladen | |
| 13 | AI gebruikt alles, balansronde, release | 1.1.0 |
| 14 | UX-fundament: alles Engels, design tokens, fonts | |
| 15 | Sidebar/HUD als factieconsole, on hold, superwapenklokken, commandobalk, tablet | |
| 16 | Announcers en unit-stemmen (Piper TTS), spreekwachtrij, radar-pings, log | |
| 17 | Leesbaarheid slagveld: hoekhaken, segment-hp, orderlijnen, cursors, plaatsingsraster | |
| 18 | Shell: live menu, lobby met kaartvoorbeeld, briefing, scorescherm | |
| 19 | Opties, toegankelijkheid, contrast, prestaties, visuele regressie | 1.2.0 |

---

## 24. Beslissingenlogboek

Alle ontwerpbeslissingen op een rij, met de reden erachter.

### Scope en aanpak
| # | Beslissing | Waarom |
|---|---|---|
| 1 | Eerst een complete kleine skirmish (verticale slice), dan uitbreiden | Een kleine game die werkt is meer waard dan veel half werkende systemen |
| 2 | Na elke fase speelbaar en tsc/vitest/e2e groen | Regressies vroeg vangen |
| 3 | Skirmish is de focus; **geen campagne** | Bewust geschrapt (de optionele fase 14 van het uitbreidingsplan) |
| 4 | Geen multiplayer, geen diplomatie, geen teams | Buiten scope; teams raken doelwitkeuze, AI, fog en overwinning |
| 5 | Content gefaseerd, geen lege knoppen | Elke eenheid in het menu werkt echt |

### IP en assets
| # | Beslissing | Waarom |
|---|---|---|
| 6 | Eigen namen en personages (Nova, Grom, The Oracle; Red Bloc, Psi Directorate) | Tanya, Boris en Yuri zijn beschermde EA-personages |
| 7 | Te RA2-achtige namen hernoemd (Dynamo Plant, Draftee, Adept, Mauler, Psi Sensor Array) | Licentie-audit fase 6 |
| 8 | Alleen CC0/CC-BY/OFL, pas "goedgekeurd" na controle van de bronpagina | Geen onduidelijke rechten in de build |
| 9 | 3D-modellen bij het laden naar isometrische sprites bakken | Benadert de RA2-look met open assets |
| 10 | UI-materiaal puur in CSS, geen bitmap-artwork | Licentieschoon en schaalbaar |
| 11 | Stemmen via Piper TTS op publiek-domein-modellen; lessac-afgeleiden en NC afgewezen | Permissieve licentie, geen klonen van echte mensen |
| 12 | Code onder MIT; assets houden hun eigen licentie | Open, met correcte attributie |

### Gameplay
| # | Beslissing | Waarom |
|---|---|---|
| 13 | Ore mines vullen velden onuitputtelijk aan | Voorkomt patstellingen door lege kaarten |
| 14 | Puntsymmetrische kaarten, uitgangen naar het midden, AI spiegelt | Eerlijke starts (bias van 24/33 → geen bias) |
| 15 | Productie op 50% bij stroomtekort; verdediging offline; superwapens laden niet | Een tekort moet merkbaar en begrijpelijk zijn |
| 16 | Verkopen = 50% × gezondheid; repareren kost max. 50% | Klassieke genrewaarden |
| 17 | Queue max. 5; on hold via rechtsklik | Genre-spiergeheugen |
| 18 | Helden max. 1, herbouwbaar, immuun voor mind control | Bijzonder blijven zonder dat ze oneerlijk worden |
| 19 | Superwapens standaard aan, uit te zetten | Zoals in het origineel; keuze bij de speler |
| 20 | Iedereen ziet alle superwapenklokken en krijgt waarschuwingen | Genre-conventie, en tegenspel mogelijk |
| 21 | Hammer Silo met vluchttijd; Leviathan-raketten onderscheppbaar | Tegenspel in plaats van onvermijdelijke schade |
| 22 | Burgers en kratten aan/uit in de lobby | Spelers kiezen hun eigen chaos |
| 23 | Zee pas na de bewegingslagen, met eigen zeekaarten | Zonder water geen zin |
| 24 | Muren worden niet automatisch beschoten en tellen niet mee voor overleven | Geen potjes die doorlopen om één muur |

### AI
| # | Beslissing | Waarom |
|---|---|---|
| 25 | AI ziet alleen wat een speler zou zien, ook geen stealth | Geen valsspelen; dat is getest |
| 26 | Hard = geen bonus; Easy/Normal krijgen een handicap | Moeilijkheid via beslissingen, niet via cheats |
| 27 | Denkinterval 30 ticks in plaats van 12 | Sneller denken bleek zwakker te spelen |
| 28 | Golven max. 20; te late golf vertrekt met de helft | Voorkomt AI's die eindeloos wachten |
| 29 | Veerdienst met een amfibisch transport als er geen landroute is | Eilandkaarten en kapotte bruggen eindigden anders in een patstelling |

### UX (v1.2, besluiten opdrachtgever 2026-10-02)
| # | Beslissing | Waarom |
|---|---|---|
| 30 | Scope UX: HUD, feedback en announcer, shell, leesbaarheid slagveld | Van een werkend spel naar een spel dat aanvoelt als het genre |
| 31 | Anker: RA2/YR-gevoel met factie-skin (staal / geklonken rood / violet-organisch) | De factie is het kader |
| 32 | Alles Engels, ook heldnamen ("De Orakel" → "The Oracle"); documentatie Nederlands | Eén taal in het spel |
| 33 | Eigen announcer per factie: AEGIS, KOMMAND, CHOIR | Elke factie voelt anders |
| 34 | Unit-acks direct in fase 16, per factie en klasse, helden apart | Hoort bij "het slagveld spreekt" |
| 35 | Responsive voor grote monitoren én tablets | Speelsituaties van de doelgroep |
| 36 | Rechtermuisknop slepen = pannen; Spatie = naar de laatste melding; pauze op P | Genregewoonte, op wens van de gebruiker |
| 37 | Rally-vlag alleen zichtbaar bij selectie van het productiegebouw | Op verzoek van de gebruiker; altijd tonen was te druk |
| 38 | Geen automatische tab-wissel bij "ready" | De speler houdt controle |
| 39 | Geen credits-tik bij elke vracht | Te vaak, wordt irritant |
| 40 | Live AI-tegen-AI-potje achter het menu | Sfeer, en de art is al gebakken (snellere start) |

---

## 25. Bewust weggelaten en open punten

**Bewust weggelaten:**
- Campagne en verhaalmissies.
- Multiplayer, diplomatie en teams in de lobby.
- Shift-waypoints (bevelwachtrij). Dat is een gameplaywijziging, geen leesbaarheid.

**Bekende beperkingen:**
- De Skyhaven Carrier lanceert geen echte drones, maar projectielen met groot bereik.
- De AI gebruikt de Reclaimer, het opladen van Arc Coils en dig-in niet, en zet Infiltrators niet bewust in.
- De veerdienst van de AI vervoert alleen infanterie. Voertuigen blijven bij een kapotte brug thuis tot een Engineer hem herbouwt.
- Muziek is AAC (.m4a). Firefox op Linux zonder systeemcodecs speelt geen muziek.
- Pixel-baselines gelden alleen voor Chromium op macOS. Edge is niet apart getest (zelfde engine als Chromium); de echte Safari-app is niet getest (WebKit wel).
- Headless Chromium zonder GPU laadt traag; in een echte browser start het spel in ~3 s.

**Open beslissingen voor de eigenaar:**
- Generieke genrenamen (Construction Yard, War Factory, Ore Refinery, Repair Depot) eventueel nog hernoemen.
- Teams/bondgenootschappen als losse uitbreiding.

---

*Bronnen voor dit document: `plan/plan.md`, `plan/master-prompt.md`, `plan/uitbreidingsplan.md`, `plan/ux-plan.md`, `plan/assets.md`, `PRODUCT.md`, `docs/architecture.md`, `docs/art-direction.md`, `docs/TODO.md`, `CHANGELOG.md` en de speldata in `src/game/data/`. De tabellen zijn automatisch uit de code gegenereerd.*
