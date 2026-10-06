# Verbeterplan 1.4: "Fun Pass" (fases 20–27)

Status: **vastgesteld, versie 4** (2026-10-02). Fase 20 (instrumenten) in uitvoering; besluiten in §4. Versie 2 verwerkt de review op versie 1, versie 3 de review op versie 2, versie 4 de afstemming op `plan/balans-plan.md` (bijlage B).
Aanleiding: externe feedback op `IRON-FRONT-ONTWERP.md` (v1.2.0). In bijlage A staat per feedbackpunt waar het in dit plan terugkomt.

**Basis van dit plan.** De code is niet meer v1.2.0: balansronde 1 uit `plan/balans-plan.md` (B1–B4) is uitgevoerd (`docs/TODO.md`, "Balansronde 1"). Die ronde sluit af als **1.3.0** (B5). Dit plan bouwt daarop voort als **Fun Pass 1.4** en meet zijn nulmeting op **basis 1.3.0** (beslissing 18). Cijfers van v1.2 bestaan alleen nog als historie in `docs/TODO.md`; ze zijn nergens een vergelijkingsarm.

---

## 0. Samenvatting

**Diagnose.** Iron Front heeft geen tekort aan inhoud. Het spel heeft een **prioriteringsprobleem**:

- 51 eenheden, 6 superwapens en tientallen uitzonderingsregels, maar geen benoemde kern.
- Alle tests bewijzen dat het spel *werkt*. Geen enkele test bewijst dat het *leuk* is.
- Alle balanscijfers komen uit AI-tegen-AI en uit de duelmatrix van balansronde 1. Er heeft nog nooit een mens een gestructureerd potje gespeeld en daarover gerapporteerd (de speeltest B5 van het balansplan is een ontwikkelaarstest, geen playtest-ronde).

**Doel van 1.4.** Het spel wordt beter om te spelen, niet groter. Na 1.4 moeten we met data en playtests kunnen beantwoorden:

1. Wat is de kern van Iron Front, en ondersteunt elke eenheid die kern?
2. Heeft de speler in elke fase van een potje interessante keuzes? (De zes fases uit de fun-audit: opening, eerste contact, midgame uitbreiden, midgame territorium, lategame, einde; definitie in 20.0.)
3. Hoeveel van een potje wordt bepaald door superwapens, door sneeuwbaleffect en door de "deathball"?
4. Begrijpt een nieuwe speler waarom hij won of verloor?

**Werkwijze:**

> **Meten → spelen → beslissen → aanpassen → opnieuw meten.**

Er komt geen nieuwe eenheid, geen nieuw gebouw, geen nieuwe kaart en geen nieuw art-systeem (zie §2, feature freeze). Elke gameplaywijziging moet een meetbare hypothese hebben, en wordt teruggedraaid als de meting haar niet ondersteunt.

**Fases:**

| Fase | Naam | Soort | Omvang |
|---|---|---|---|
| 20 | Meetinstrumenten en nulmeting | bouwen + meten | M |
| 21 | Playtest-ronde 1 (mensen) | onderzoek | M |
| 22 | Ontwerpkern en schrapronde | beslissen + schrappen | M |
| 23 | Economie en uitbreiding ("commandonetwerk") | gameplay | M |
| 24 | Superwapens en lategame | gameplay | S–M |
| 25 | De speler begrijpt het spel (tutorial, nabespreking, uitleg) | UX | L |
| 26 | AI met intenties en geheugen | AI | M |
| 27 | Playtest-ronde 2, vergelijking, release 1.4 | onderzoek + release | M |

**Rolverdeling van de fases:**

> **Fase 20 bepaalt wat er gebeurt.**
> **Fase 21 bepaalt wat spelers ervaren.**
> **Fase 22 bepaalt wat Iron Front is.**
> **Fases 23–26 lossen alleen de problemen op die 20–22 aantonen.**
> **Fase 27 bewijst of het gewerkt heeft.**

**Vooraf:** balansronde 1 wordt afgerond als 1.3.0 (nu: B1–B4 uitgevoerd, B5 open, `package.json` nog 1.2.0), inclusief de speeltest B5 van de opdrachtgever (beslissing 19). Daarna: 20 → 21 → 22 is hard. Fases 23–26 zijn **voorwaardelijk**: elke fase heeft een startvoorwaarde, en zonder bewijs vervalt of krimpt de fase. Ze delen **één meetrij**: per iteratie precies één interventie, over alle vier de fases samen (zie de werkregel vóór fase 23). Bouwen mag parallel in branches; invoeren en meten niet. Fase 27 sluit af.

**Uitzondering:** 26.A (AI-geheugen en exploit-fix) start direct na de nulmeting, in een aparte branch. Ze komt **niet** in de build van playtest-ronde 1 (`playtest-r1`, zie 20.4). Na 26.A volgt de referentiemeting `ref-26a`; alle vergelijkingen in 23–27 gebruiken die als basis (beslissing 14).

**Rapportage in drie stappen:** basis 1.3.0 (nulmeting) → referentie na 26.A (`ref-26a`) → 1.4 (eindmeting). Zo staat het effect van de AI-fix los van de gameplaywijzigingen.

**Na de review van versie 1 van dit plan is het volgende veranderd:**
- Fases 23–26 bevatten geen vooraf gekozen oplossingen meer, alleen onderzoeksvragen, startvoorwaarden en een menu van interventies, met maximaal één interventie per iteratie.
- Nieuwe metrieken in fase 20:
  - keuzedichtheid
  - tijd tot de eerste betekenisvolle keuze
  - voorsprong vóór een superwapen
  - legerconcentratie
  - een aparte simulatie die alleen de economie vergelijkt
- "Leuk" is vooraf gedefinieerd in vier dimensies (retentie, agency, begrip, comeback-gevoel) plus de fun-audit per fase.
- Er is een fun-audit per fase van een potje.
- Er is een objectieve verliesclassificatie.

**Na de review van versie 2:** één definitie per begrip, vaste bevriesmomenten (§2 regel 6), een referentiemeting na 26.A, toetsbare doelen en beslisregels in fase 24, 25 en 27, en correcties uit de code (bijlage B).

**Na de afstemming op het balansplan (versie 4):** basis 1.3.0 in plaats van v1.2, versie 1.4 voor de Fun Pass, één definitie van factiebalans, de duelmatrix als meetlaag, een interventiemenu B voor verdere balanswijzigingen, feiten bijgewerkt naar de balansronde, en een oplossing voor het ontbreken van git (bijlage B).

---

## 1. Kernbesluit (voorstel, vast te stellen in fase 22)

De feedback noemt drie richtingen: A (territorium), B (asymmetrie) en C (klassieke RTS, moderne uitvoering). Dit plan stelt een combinatie voor met een duidelijke rangorde.

> **Iron Front is de klassieke RTS zonder de oude frustraties (C). Je wint door je commandonetwerk over de kaart uit te breiden (A), met een factie die op haar eigen manier vecht (B).**

- **C is het fundament.** Besturing, duidelijkheid, AI, tempo en feedback gaan voor nieuwe mechanieken.
- **A is de voorgestelde strategische as.** Uitbreiden (Base Crawler, bouwradius, ore-velden, tech-gebouwen, bruggen, havens) zou de belangrijkste beslissing in de midgame moeten zijn. **Hypothese:** uitbreiden is nu een bijzaak. Fase 20 en 21 toetsen dat (startvoorwaarde van fase 23).
- **B blijft, en wordt scherper.** De asymmetrie is volgens de feedback het sterkste deel van het ontwerp. We maken haar duidelijker door per factie één kernidee te kiezen. Wat daar niet aan bijdraagt, is een *kandidaat* om te schrappen; wat er echt uitgaat, volgt uit 22.1 en de playtest.

**Factiezinnen** (voorstel, uit de feedback; vast te stellen in fase 22):

| Factie | Kernzin | Moeilijkheid (systemen, niet kracht) |
|---|---|---|
| Allied Coalition | *Ik win door mobiliteit, precisie en positionering.* | Instap |
| Red Bloc | *Ik win door brute kracht en gecontroleerde druk.* | Gemiddeld |
| Psi Directorate | *Ik win door de middelen van mijn tegenstander tegen hem te gebruiken.* Mind control is de kern, de rest ondersteunt. | Gevorderd |

---

## 2. Spelregels voor 1.4

1. **Feature freeze op inhoud:**
   - Geen nieuwe eenheden, gebouwen, kaarten, superwapens of resources.
   - Geen campagne, multiplayer, teams, diplomatie, research tree, commander-systeem, achievements, ranking, progression of skins.
   - Geen nieuwe art-systemen. Bestaande assets mogen wel beter worden.
   - Tutorial-startopstellingen (fase 25) zijn **geen nieuwe kaarten**: ze gebruiken bestaande kaarttypes en de bestaande mapgenerator, met een vooraf geplaatste situatie.
   - **Nieuwe mechanieken uit balansronde 1 horen bij de basis:** mind control laadt op, The Oracle neemt gebouwen over met een aparte straal, C4 is een tijdbom, regeneratie pas na 5 s zonder schade, drones zijn immuun voor mind control. Ze zijn er vóór de nulmeting; vanaf 1.3.0 geldt de freeze ook voor zulke mechanieken.
2. **Elke gameplaywijziging heeft een hypothese en een meting.** Vorm:
   > "Als we X doen, verandert metriek Y van A naar B, gemeten met Z."

   Wordt de verwachting niet gehaald, dan wordt de wijziging teruggedraaid of opnieuw besproken.
   **Balanswijzigingen zijn ook gameplaywijzigingen.** Na 1.3.0 valt elke wijziging van cijfers in `data/` (kosten, hp, schade, bereik, cooldown) onder deze regel: zelfde meetrij als fase 23–26, met duelmatrix, scenario's en AI-meting (menu B, bij fase 24).
   **Geen vooraf gekozen gameplayoplossing is verplicht.** Een voorstel in fase 23–26 blijft een hypothese totdat fase 20–22 genoeg bewijs levert om het uit te voeren. Er komt **maximaal één interventie per iteratie**, gevolgd door een nieuwe meting, zodat duidelijk blijft wat welk effect had.
3. **Schrappen gaat in twee stappen:**
   - Eerst *uitzetten* via één dataveld, zodat we kunnen vergelijken (A/B).
   - Pas na playtest-ronde 2 *definitief verwijderen*, inclusief code, art, stemregels en tests.
4. **Ontwerp en techniek blijven gescheiden.** In documenten staat bij elke keuze óf een spelreden óf een technische reden, en niet een technisch voordeel als ontwerpargument (zie feedback §16).
5. **Wat níet verandert:** de asymmetrie, de eerlijke AI (geen verborgen informatie, geen bonussen), de deterministische simulatie, het assetbeleid en de bestaande testsuite. Alle tests blijven groen.
6. **Bevriesmomenten.** Eén regel voor elk getal dat een besluit stuurt. Na bevriezing wijzigt het niet meer in 1.4; een afwijking wordt als bevinding gerapporteerd.

   | Wat | Bevroren op | Waar |
   |---|---|---|
   | Activeringsdrempels in de startvoorwaarden van fase 23–26 | Bij goedkeuring van dit plan (datum in de statusregel) | Dit plan |
   | Alarm- en doelgrenzen (fase 24, factiebalans, kosteneffectiviteit, comeback) | Na de nulmeting, vóór fase 22 | `docs/metingen/grenzen.md` |
   | 21.0, fun-audit en verliesclassificatie (incl. ijking) | Vóór tester 1 van ronde 1 | `docs/playtest/` |
   | Streefwaarden fase 27 | Na ronde 1, vóór fase 23 | 27.2 + `docs/metingen/grenzen.md` |
   | Hypothese en **primaire metriek** van een iteratie | Vóór de run | `docs/metingen/` |

---

## Fase 20: Meetinstrumenten en nulmeting

**Doel:** van "werkt het?" naar "hoe verloopt een potje, en heeft de speler iets te kiezen?". Alles wat fases 21–27 moeten meten, wordt hier gebouwd en één keer gemeten op **basis 1.3.0** (v1.2.0 + balansronde 1). Dat is de nulmeting.

**Principe:** fase 20 bepaalt wát er daarna gebeurt. Latere fases lossen alleen problemen op die deze metingen aantonen. Fase 20 bevat dus **geen gameplaywijziging**: alleen instrumenten, een schakelaar voor de ore-regels (20.5) en de nulmeting.

### 20.0 Uitgangspunten
- **Alleen-lezen.** Telemetrie leest de spelstand en schrijft alleen naar `s.telemetry`. De simulatie leest `s.telemetry` nooit. Geen `nextRandom`, geen `Date`.
- **Geen doelen in fase 20.** De nulmeting levert basiswaarden en spreiding. Wanneer welke grens bevroren wordt, staat in §2 regel 6. Een getal in een definitie (venster, straal) is een **meetparameter** in `TELEMETRY` (config), geen doel.
- **Mens en AI apart.** Elke metriek wordt per speler berekend met de vlag `ai`. Rapporten tonen mens en AI nooit als één gemiddelde.
- **Hergebruiken wat er is.** Balansronde 1 leverde al `src/game/tests/balance-lab.ts` (arena, duels, scenario's), `duels.test.ts` (duelmatrix, opt-in `DUELS=1`, rapport in `docs/balans/`) en `balance-scenarios.test.ts` (17 scenario's met een doelband, in elke testrun). Fase 20 bouwt daarop voort en dupliceert niets.
- **Gedeelde begrippen:**

| Begrip | Definitie |
|---|---|
| Speler | Elke `Player` zonder `neutral`. Burgers tellen nergens mee. |
| Legerwaarde | Som van `cost` van levende eenheden met een wapen, zonder harvesters en zonder eenheden met `inside` (in transport). Overgenomen eenheden tellen bij de huidige eigenaar. |
| Gebouwwaarde | Som van `cost × hp/maxHp` van eigen gebouwen met `built = 1`, zonder muren en bruggen. |
| Veld | Een 8-verbonden groep ore-tegels op tick 0 (incl. tegels binnen 2 van een mine). Vast per potje, berekend bij de eerste telemetrie-tick. Startveld = het veld het dichtst bij `startX/startY`. |
| Gevecht | Cluster van doden (eenheden en gebouwen) binnen 8 tegels en 30 s van elkaar (single-linkage). |
| Fases van een potje | Zie de tabel hieronder (enige definitie). |
| Snapshot | Elke 10 s (300 ticks), per speler. |
| Uitgeschakeld | `player.defeated` wordt `true` (via `checkVictory`). |

**Fases van een potje.** Dit is de enige definitie. De fun-audit, de verliesclassificatie en alle rapporten verwijzen hiernaar. T = duur van het potje, C = eerste contact (20.2-A).

| Fase | Venster | Opmerking |
|---|---|---|
| Opening | 0 – 5 min | |
| Eerste contact | C − 1 min tot C + 2 min | Mag overlappen met de opening; het is een aparte vraag |
| Midgame (uitbreiden én territorium) | 5 min – min(15 min, T − 3 min) | Twee fun-audit-vragen over hetzelfde venster |
| Lategame | 15 min – (T − 3 min) | Bestaat alleen als T ≥ 18 min |
| Einde | T − 3 min – T | Gaat voor bij overlap |

Een fase die niet voorkomt (geen contact, potje korter dan 18 min), is **n.v.t.**, geen 0. Telemetrie per fase gebruikt dezelfde vensters.

### 20.1 Telemetrie-infrastructuur
**Probleem in de code:** gebeurtenissen staan in `s.rt.events`. Dat is runtime (niet in saves) en wordt elk frame geleegd door `Game.ts` (`splice(0)`) of door tests (`length = 0`); `balance.test.ts` leegt hem nooit. Achteraf uitlezen is dus onbetrouwbaar.

**Oplossing:** één helper `emit(s, ev)` in `core/events.ts` die `s.rt.events.push(ev)` doet én `telemetryOnEvent(s, ev)` aanroept. De 28 `rt.events.push`-plekken (sim, production, orders, abilities, bridges, economy, crates, powers, combat) gaan mechanisch over op `emit`. Aan het eind van `tick()` draait `telemetryTick(s)` voor snapshots en steekproeven.

**Uitbreidingen op bestaande events** (alleen extra velden; bestaande lezers blijven werken):

| Event | Nieuw veld | Waarom |
|---|---|---|
| `death` | `by` (speler die de klap gaf), `cost`, `cause: 'weapon' \| 'superweapon' \| 'hero' \| 'mc' \| 'hazard' \| 'self'` | Wie doodde wat, en waarmee. `damage()` krijgt een optionele parameter `cause`. De oorzaak volgt uit de **bron**, want superwapens doen hun schade niet allemaal in `powers.ts`: het projectiel `hammerBlast` en zijn fallout-hazard (Hammer Silo), de `lightning`-hazard (Storm Engine) en de directe `damage()` van Stasis geven `'superweapon'`. Hazards krijgen daarvoor een veld `source`. Gewone gif- en stralingsvelden blijven `'hazard'`. |
| `underAttack` | `by` | Eerste contact, eerste aanval op economie. Zelfde throttle (150 ticks per doelwit). |

**Nieuwe events:**

| Event | Waar | Inhoud |
|---|---|---|
| `defeated` | `checkVictory` in `sim.ts` | `owner` |
| `enqueued` | `enqueue()` in `production.ts` | `owner`, `def` |
| `ability` | `abilities.ts` bij gebruik | `owner`, `def`, `ability` |
| `mindControlStart` / `mindControlBroken` | `combat.ts` (`charged()`): de straal begint op te laden, of breekt af (wegrijden, schade aan The Oracle bij een gebouw) | `owner`, `def`, `target`. Laat zien of het tegenspel uit balansronde 1 echt gebruikt wordt |
| `mutated` | `powers.ts` (Mutagen Spire zet `hp = 0` en spawnt een Mauler, zonder `death`) | `owner` (nieuwe eigenaar), `from` (vorige eigenaar), `def`, `cost`. Telt als overname (verliesoorzaak OV, 20.2-D) |

**Beslissingen loggen.** `logDecision(s, owner, kind, detail?)` in `telemetry.ts` schrijft rechtstreeks naar `s.telemetry` (niet via events, want spelersinvoer valt tussen ticks). Aanroepers:
- **Mens:** de invoerfuncties in `Game.ts` (`queue`, plaatsen, `attackMoveTo`, aanvals- en verplaatsorders, `ability`, `powerClick`, verkopen, `buildingAction`). Selectie, camera en rally-punten tellen niet.
- **AI:** de acties in `ai.ts` (`enqueue` in `planBuilding/planUnits/support`, `placeReady`, start van een aanvalsgolf in `attack`, `defend`, `powers`, `crawlers`, verkopen).

**Opslag:** `s.telemetry` (nieuw optioneel veld op `GameState`) met platte arrays: snapshots, compacte event-records (tuples) en beslissingen. Gaat mee in saves via `core/save.ts`; oudere saves zonder veld laden met lege telemetrie. Omvang bij 30 min en 2 spelers: ~360 snapshots plus enkele duizenden records.

**Snapshot per speler (elke 10 s):** credits; inkomen en besteding in het interval; legerwaarde; gebouwwaarde; eenheden per klasse (infanterie, voertuig, lucht, zee); aantal CY's; stroombalans; restant per veld (% van tick 0); beschikbare productieopties (20.2-B); legerconcentratie (20.2-E); waarde per `def` van het leger.

**Steekproef per seconde (elke 30 ticks)** per speler per wachtrij (`building`, `infantry`, `vehicle`), alleen als de producent bestaat:

| Toestand | Voorwaarde |
|---|---|
| `loopt` | `queue[0]` bestaat, geen `hold`, en betaalde in de laatste seconde |
| `geldgebrek` | `queue[0]` bestaat maar wacht op geld (`credits < pay`) |
| `pauze` | `queue[0].hold`, of bij `building`: `ready` wacht op plaatsing |
| `keuze-idle` | Wachtrij leeg en `credits ≥` goedkoopste optie in `catalog()` zonder `missingRequirements` en met `capLeft > 0` |
| `arm-idle` | Wachtrij leeg en `credits <` goedkoopste optie |

### 20.2 Metrieken
Alle metrieken staan per potje in de JSON (20.6) en worden in het rapport samengevat (mediaan, IQR, per factie, per fase van het potje).

**A. Verloop**

| Metriek | Definitie | Bron |
|---|---|---|
| Duur | Tick van `gameOver`, of 30 min (= patstelling) | `gameOver` |
| Eerste contact | Eerste `underAttack` of `death` met `by` ≠ eigenaar, beide spelers | events |
| TTK eerste gevecht | Mediane levensduur (s sinds spawn) van eenheden die sterven in het eerste gevecht | `death` + spawn-tick |
| Grootste gevecht | Max. verloren legerwaarde in één gevecht, als % van de legerwaarde van die kant bij de start van het gevecht | gevechtscluster + snapshot |
| Voorsprong op 5/10/15/20 min | Verhouding legerwaarde en inkomen (laatste 2 min) tussen de twee spelers | snapshots |

**B. Keuzedichtheid** (nieuw): heeft de speler interessante dingen te doen?

| Metriek | Definitie |
|---|---|
| Keuze-idle | Per wachtrij apart: % van de seconden in `keuze-idle`, per fase van het potje. **Hoofdmetriek** = gemiddelde van de unit-wachtrijen (`infantry`, `vehicle`). De bouwwachtrij staat alleen in de detailtabel: die is bijna altijd leeg terwijl er geld is. Los daarvan: % `geldgebrek` en `arm-idle`. Zo is "geen geld" te scheiden van "niets gekozen". |
| Ongebruikt geld | Gemiddelde `credits` over seconden waarin een unit-wachtrij `keuze-idle` is, en het aantal credit-seconden daarin. |
| Productie-uptime | % van de seconden met ≥ 1 bestaande unit-wachtrij in `loopt`. Gebruikt door de verliesclassificatie (PB) en de fun-audit. |
| Productieopties | Per snapshot: aantal `def`s in `catalog()` zonder `missingRequirements` en met `capLeft > 0`, per categorie. Plus: aantal verschillende `def`s besteld in de laatste 2 min (gebruikte breedte). |
| Tijd zonder beslissing | Gaten tussen opeenvolgende betekenisvolle beslissingen: langste gat, mediaan gat, en % speeltijd in gaten ≥ `TELEMETRY.quietGap` (start 30 s). |
| Dominante eenheid | Per snapshot: aandeel van de grootste `def` in de legerwaarde. Rapport: tijdgewogen gemiddelde en % tijd boven 50%. |
| Planwissels | Besteding per 60 s-venster verdeeld over rollen (zie onder). Wissel = L1-afstand tussen de genormaliseerde verdeling van twee opeenvolgende vensters ≥ `TELEMETRY.planShift` (start 0,5). Aantal per potje en per fase. |

**Betekenisvolle beslissing** = een `logDecision` van soort: nieuw `def` in een wachtrij (niet hetzelfde als het vorige item in die wachtrij), gebouw plaatsen, aanval/verplaatsing van ≥ 1 gewapende eenheid naar een punt ≥ 6 tegels van haar huidige positie, ability, superwapen, verkopen, overname-opdracht. Herhaalde klikken binnen 2 s op hetzelfde doel tellen één keer.
- *Mens:* invoercommando uit `Game.ts`.
- *AI:* actie uit `ai.ts`. De AI denkt elke 30–60 ticks; haar gaten zeggen iets over het AI-script, niet over het spel. Daarom zijn B-metrieken voor AI **diagnose**, en voor mensen (fase 21) het eigenlijke signaal.
- *Let op:* de AI houdt bewust een geldreserve aan (`planUnits`, `reserve`). Dat telt als `keuze-idle`. Het rapport vermeldt dit naast de AI-cijfers.

**Rollen** (afgeleid uit data, geen handwerk, in deze volgorde): `anti-pantser` als `versus.heavy ≥ versus.none`; anders `AA` als `weapon.aa` of `airOnly`; anders `anti-infanterie`. Een eenheid met `aa` krijgt daarnaast de **nevenrol** AA (de Rocket Trooper is dus anti-pantser, met nevenrol AA). Verder: `economie` (harvester, refinery), `verdediging` (gebouw met wapen), `tech` (`lab` en gebouwen die hem vereisen), `superwapen`, `overig`.

**Counterrol per klasse** (gebruikt door counter-productie hieronder en verliesoorzaak SC):

| Vijandelijke klasse | Counterrol |
|---|---|
| Infanterie | anti-infanterie |
| Voertuig | anti-pantser |
| Lucht | AA (hoofd- of nevenrol) |
| Zee | wapen met `navalOnly` of `sub`, of anti-pantser met bereik ≥ 6 |

**C. Tijd tot de eerste betekenisvolle beslissing** (nieuw), per speler, in minuten:

| Moment | Definitie |
|---|---|
| Eerste uitbreiding | Eerste afgebouwde refinery of uitgeklapte CY waarvan het dichtstbijzijnde veld geen startveld is. Startvelden = alle velden met het midden binnen 10 tegels van de start (bevroren in `docs/metingen/grenzen.md` §4) |
| Eerste tech-keuze | Eerste `enqueued` van `lab`, of van een `def` die `lab` direct of indirect vereist, of eerste overname van een tech-gebouw |
| Eerste aanval op economie | Eerste `underAttack`/`death` met `by` = deze speler op een vijandelijke harvester of refinery |
| Eerste defensieve reactie | Na de eerste vijandelijke `underAttack` op eigen gebouw of harvester: eerste beslissing binnen 60 s die een gewapende eenheid naar ≤ 8 tegels van die plek stuurt, een verdedigingsgebouw bestelt of repareert. Rapport: tijdstip én reactietijd. Geen reactie = leeg. |
| Eerste counter-productie | Eerste bestelling van een eenheid waarvan de rol de counterrol (tabel hierboven) is van de klasse die op dat moment het grootste deel van de *geziene* vijandelijke legerwaarde vormt (`visible`), terwijl die rol in de 60 s ervoor niet besteld werd |
| Eerste factiemechaniek | Eerste event uit `FACTION_MECHANICS` in `telemetry.ts`. **Vaste lijst, bevroren met dit plan:** Psi = `mindControl` (Mentalist, Hivemind, The Oracle; telt bij een geslaagde overname na het opladen, niet bij de start van de straal); Red Bloc = Leech Drone kruipt in een voertuig, Arc Coil opgeladen, of `ability` Blight-veld; Allied = teleport van de Phase Trooper, Shroud Tank vuurt vanuit camouflage, of `ability` dig-in. Waar nog geen event voor bestaat, komt er een `ability`-event bij. Wat fase 22 uitzet, valt uit de lijst; er komt niets bij. |
| Eerste strategische keuze | Minimum van de vijf momenten hierboven, zonder defensieve reactie |

Doel: kunnen zeggen *"in basis 1.3.0 duurde het gemiddeld X min tot de eerste strategische keuze"*, apart voor AI en mens.

**D. Superwapens, causaal** (nieuw)

| Metriek | Definitie |
|---|---|
| Lead before superweapon | Bij het eerste `superweapon`/`fired` per potje: verhouding schutter : tegenstander in **totale waarde** (leger + gebouwen + credits), en apart in legerwaarde en inkomen (laatste 2 min), uit de laatste snapshot vóór het schot |
| Bakken | Op **totale waarde**: `voor` > 1,25×, `gelijk` 0,8–1,25×, `achter` < 0,8×. Totale waarde, omdat wie een superwapen bouwde $2.500–5.000 in een gebouw heeft zitten in plaats van in zijn leger. De indeling op legerwaarde staat ernaast als controle. Dit is de **enige definitie** van de bakken (fase 24 en de verliesclassificatie gebruiken dezelfde grenzen 0,8–1,25 voor "~gelijk"). Een bak met n < 15 schoten is **onbeslist**. |
| Kernsignaal | In bak `gelijk`: % schoten waarna de tegenstander **binnen 90 s is uitgeschakeld**. Dit is de metriek waar fase 24 op stuurt. |
| Secundair | In bak `gelijk`: % schoten waarna de tegenstander binnen 90 s **beslissend achter** staat (legerwaarde ≤ 0,5× die van de schutter en daarna nooit meer ≥ 0,8×). Alleen rapporteren. |
| Na het schot | Per bak: winrate van de schutter; % potjes waarin de tegenstander binnen 90 s uitgeschakeld is; verloren waarde van de tegenstander in de 90 s na het schot, en het deel daarvan met `cause = 'superweapon'` |
| Overwinst | Winrate van de schutter per klasse **min** de winrate van een speler met dezelfde voorsprongklasse op hetzelfde moment (± 1 min) in de controlerun zonder superwapens (`BALANCE_NOSW=1`) |
| Bestaand | Winrate van de eerste schutter; mediane tijd van schot tot einde; % vernietigde/overgenomen waarde met `cause = 'superweapon'` of overname door `powers.ts` |

Het echte probleem is **`gelijk` → schot → tegenstander binnen 90 s uit**. `voor` → schot → winst is normaal.

**E. Sneeuwbal, comeback, deathball**

| Metriek | Definitie |
|---|---|
| Sneeuwbal | P(winst) bij legerwaarde ≥ 1,5× op 10 min |
| Comeback | % potjes gewonnen door een speler die ooit ≥ 40% achterstond in legerwaarde (na 3 min) |
| Beslissend gevecht | % potjes waarin één gevecht ≥ 50% van de legerwaarde van de verliezer kostte en het potje binnen 5 min eindigde; apart voor gevechten na 15 min |
| Legerconcentratie (nieuw) | Per snapshot: gewapende eenheden van een speler clusteren (single-linkage, `TELEMETRY.clusterGap`, start 5 tegels). Concentratie = waarde grootste cluster / legerwaarde. Alleen als legerwaarde ≥ $2.000 (anders zegt het niets). Rapport: mediaan per fase van het potje, en verloop over tijd per factie. |

**F. Economie en uitbreiding**

| Metriek | Definitie |
|---|---|
| Inkomen | Credits per minuut uit `income` (plus `stolen`, `bonus` apart), per minuut van het potje. Het deel uit Fuel Rigs staat apart in `rig` (zit ook in `income`; toegevoegd 2026-10-06) |
| Besteed | Totaal besteed aan productie per minuut |
| Velden | Aantal velden met een eigen refinery binnen 8 tegels; per veld het restant (% van tick 0) over de tijd; eerste moment < 25% |
| Uitputting | % potjes waarin het startveld ooit < 25% zat, en wanneer |
| Uitbreiding | % potjes met een tweede CY; tijd tot de tweede CY; tijd tot de eerste uitbreiding (C); winrate met vs. zonder |
| Harassment | Per raid op Haulers of raffinaderij van een speler (nieuwe raid ≥ 2 min na de vorige): daling van zijn inkomen in de 2 min erna t.o.v. de 2 min ervoor, in minuten inkomen. **Netto** = min dezelfde daling bij de aanvaller (velden raken toch leeg). Signaal fase 23 gebruikt netto. Toegevoegd 2026-10-06 |
| Patstelling | Potje bereikt 30 min zonder winnaar |

**G. Gebruik en balans**
- **Factiebalans: één definitie voor dit hele plan.** Winrate per factie in de **niet-spiegelpotjes** (gewonnen / gespeeld, patstellingen tellen als gespeeld en niet gewonnen), met 95%-betrouwbaarheidsinterval (Wilson). De band **40–60%** in fase 22–27 geldt voor de **puntschatting**; het interval staat erbij. Spiegelpotjes tellen alleen voor de zetelbias.
  - *Relatie met het balansplan.* `plan/balans-plan.md` gebruikt een andere maat: het **aandeel van alle overwinningen** (inclusief spiegelpotjes), met band 27–40% en pariteit bij 1/3 ≈ 33%. Het rapport toont beide maten naast elkaar, zodat de balansronde vergelijkbaar blijft. Besluiten in dit plan gebruiken alleen de winrate (beslissing 21).
  - *Stand na balansronde 1* (`docs/TODO.md`): land, niet-spiegel: Allied 13/24, Red Bloc 11/24, Psi 12/24 (54/46/50%, binnen de band). Zee, aandeel van 27 potjes: 9/6/12 (33/22/44%, buiten de balansplan-band); de winrate op zee volgt uit de nulmeting.
- Per eenheid (AI-potjes): gebouwd, kills, verloren, kosten-efficiëntie (`cost` van wat ze doodde / eigen `cost`), en % dat ≥ 60 s overleeft.
- **Kosteneffectiviteit per unit (duelmatrix).** Uit `duels.test.ts`: efficiëntie per paar en het gemiddelde in de eigen rol, band **0,8–1,25** (uitgangspunt 2 van het balansplan). Dit is meetlaag 2 (zie §5): unit tegen unit, zonder micro en terrein. Het voedt de kolom "Kosteneffectiviteit" in `roster.md` (22.1).

### 20.3 Duelmatrix en vaste gevechtsscenario's
Alles bouwt voort op `src/game/tests/balance-lab.ts` (lege arena, `run()`, duels en scenario's uit balansronde 1). Geen nieuwe infrastructuur en geen losse `scenarios.test.ts`.

**Twee soorten scenario's, bewust apart:**

| | `balance-scenarios.test.ts` (bestaat) | Regressierapport (nieuw) |
|---|---|---|
| Doel | Bewaakt de doelbanden van balansronde 1 (held tegen basis, Oracle, mind control, Leech, …) | Laat zien wat een interventie verschuift, zonder grens |
| Vorm | 17 tests met een doelband; draait in elke testrun; pass/fail | Opt-in `REGRESS=1`, schrijft naar `docs/metingen/`; geen pass/fail |
| Wijzigt in 1.4 | Alleen via een interventie uit menu BL, met reden | Mag groeien |

**Duelmatrix.** `DUELS=1 npx vitest run duels` blijft het instrument voor unit tegen unit (630 duels, `docs/balans/duels-*.md/csv`). Nieuw in fase 20:
- **Zeematrix:** dezelfde arena op water, met alle schepen (open punt uit balansronde 1: schepen ontbreken, en Red Bloc wint op zee het minst). Rapport `docs/balans/duels-zee.md`.
- De matrix draait mee in de nulmeting (`nul-duels`, `nul-duels-zee`) en na elke balansinterventie (menu BL).

**Regressiescenario's.** Opt-in rapport in `balance-lab.ts` (zelfde patroon als de duels); de code is de specificatie (posities, afstanden, seeds), hieronder de inhoud. Beide kanten krijgen attack-move naar elkaar, op open grond, 12 tegels uit elkaar, tenzij anders vermeld. Gebouwen hebben stroom.

| # | Kant A | Kant B | Budget |
|---|---|---|---|
| 1 | 10 Warden Tank | 8 Anvil Heavy Tank | $7.000 / $6.800 |
| 2 | 5 Rocket Trooper + 10 Rifleman | 2 Colossus Tank | $3.500 / $3.500 |
| 3 | 3 Mentalist + 2 Lash Tank | 20 Draftee | $3.900 / $4.000 |
| 4a–c | 4 Kestrel (vallen een Power Plant aan) | 3 Skyguard SAM / 3 Flak Battery / 9 Flak Gunner rond het doel | $4.800 / $2.700 |
| 5 | 3 Picket Destroyer (op water, vallen de kust aan) | 2 Sentry Gun + 4 Rocket Trooper op de kust | $3.000 / $2.400 |
| 6 | $10.000 aan main tanks van factie X | basis met $5.000 aan de twee verdedigingsgebouwen van factie Y | 9 combinaties X × Y |
| 7 | 1 Thunderhead Airship (valt een Construction Yard aan) | $2.000 aan elke AA-optie van elke factie | $2.000 / $2.000 |

Per scenario: winnaar, overgebleven waarde, duur, TTK. Geen pass/fail maar een **regressierapport** in `docs/metingen/`: een wijziging die een scenario omdraait moet bewust zijn. Scenario 4a–c en 7 meten tegelijk de betaalbaarheid van luchtafweer per factie (open punt uit balansronde 1; zie menu BL).

### 20.4 Telemetrie-export voor mensen
- Knop "Export match data" op het scorescherm: downloadt `s.telemetry` plus `settings` als JSON.
- Alleen lokaal; er wordt niets verstuurd. Geen persoonsgegevens, alleen de spelstand.
- De export bevat `build` en `aiVersion` (constante in `ai.ts`, opgehoogd bij elke AI-wijziging). Potjes met een andere build dan afgesproken tellen niet mee.
- **`build` zonder git.** Het project is nu geen git-repository. Voorstel (beslissing 20): vóór fase 20 een repository aanmaken; dan is `build` de commit-hash en `playtest-r1` een tag. Lukt dat niet, dan is `build` = versienummer + een hash van de gebouwde bundel (`dist/`), en wordt per playtestbuild een kopie van `dist/` gearchiveerd (`docs/playtest/builds/<build>/`). `playtest-r1` is dan de naam van die kopie.
- In playtests staat de exportknop pas open na de vragen: de begeleider draait het scherm weg bij `gameOver` en exporteert na vraag 2 (zie fase 21).
- Zelfde formaat als de AI-runs, zodat `src/game/tests/meting.ts` (20.6) beide leest. Nodig voor fase 21.

### 20.5 Harnas voor economy-only vergelijking
Fase 23 moet de economie los kunnen meten: huidige economie vs. nieuwe economie, **zonder andere wijzigingen**. De ore-regels zijn sinds v1.2 niet veranderd (balansronde 1 raakte ze niet); daarom heet de huidige variant `v12`. Fase 20 levert het harnas, fase 23 de nieuwe regels.
- Nieuw veld `settings.oreRules?: 'v12' | 'v14'` (ontbreekt = `'v12'`). Het staat in de settings, dus in saves en in de JSON.
- `regrowOre` in `economy.ts` kiest op `oreRules`. In fase 20 bestaat alleen `'v12'` (de huidige code, ongewijzigd verplaatst naar `regrowOreV12`). `'v14'` gooit tot fase 23 een duidelijke fout.
- Env-var `BALANCE_ORE=v12|v14` in `balance.test.ts`. Mapgen, AI en alle andere regels blijven gelijk.
- Vergelijking: `COMPARE=a.json,b.json` maakt een rapport met per metriek beide waarden, het verschil en een 95%-interval (bootstrap over potjes, vaste seed).
- **Meetset per variant:** de land- en zeeruns van 20.6 (81 + 36 = 117 potjes), Hard vs. Hard, zelfde seeds.
- **Eén primaire metriek** per vergelijking, met hypothese, in `docs/metingen/` vóór de run (§2 regel 6). Alleen die beslist; de andere intervallen in het `COMPARE`-rapport zijn verkennend en leveren hooguit een nieuwe hypothese op (veel intervallen geven vrijwel zeker een vals positief).
- **Metrieken:** inkomen per minuut, besteed per minuut, tijd tot eerste uitbreiding, duur, uitputting van velden, comeback, patstellingen, en `arm-idle`-tijd (verhongeren).
- **Kanttekening uit de code:** de AI bouwt alleen een Base Crawler als ze geen CY meer heeft (`crawlers()` in `ai.ts`) en extra refineries alleen in de eigen basis. Een economy-only run meet dus het effect op een AI die *niet* uitbreidt. Daarom eist fase 23 eerst een minimale AI-uitbreidingsregel (optie E6) die in **beide** armen draait, bovenop de referentie-AI van 26.A. Fase 20 levert alleen het harnas; de nulmeting met `v12` vermeldt deze beperking.

### 20.6 Rapport en nulmeting
- Nieuw `src/game/tests/meting.ts`: pure functies van telemetrie naar metrieken (A–G). Getest met een opgebouwde telemetrie in `src/game/tests/telemetry.test.ts`.
- **Kruising in de opzet.** De huidige lus in `balance.test.ts` koppelt elk factiepaar aan één vaste kaart (`MAPS[(g + ⌊g/3⌋) % 3]`) en gebruikt seeds `BALANCE_SEED + g`. De lus wordt een volledige kruising: 9 factieparen (waarvan 3 spiegelpotjes) × elke kaart × seeds. Zo zijn factie en kaart niet meer met elkaar verward.
- `balance.test.ts` krijgt `BALANCE_REPORT=<label>`: schrijft `docs/metingen/<datum>-<label>.md` (samenvatting) en `.json` (alle metrieken per potje, plus de settings). Ook `BALANCE_SEED`-reeksen om runs te splitsen en parallel te draaien.
- **Nulmeting op basis 1.3.0** (na B5, zie beslissing 19):

| Run | Instellingen |
|---|---|
| `nul-land` | 81 potjes: 9 factieparen × 3 kaarten (plains, rivers, highlands) × 3 seeds, small, Hard vs. Hard |
| `nul-zee` | 36 potjes: 9 factieparen × 2 kaarten (coast, islands) × 2 seeds |
| `nul-normal-medium` | 27 potjes: 9 factieparen × 3 landkaarten × 1 seed, **medium, Normal vs. Normal**. Referentie voor de mensdata (fase 21) en voor de ijking van de verliesclassificatie, want mensen spelen tegen Normal op medium |
| `nul-nosw-land`, `nul-nosw-zee` | 81 + 36 potjes, als hierboven met `BALANCE_NOSW=1` (controle voor de overwinst in 20.2-D) |
| `nul-ore-v12` | 117 potjes met `BALANCE_ORE=v12`: moet identiek zijn aan `nul-land` + `nul-zee` (bewijs dat het harnas neutraal is) |
| `nul-scenarios` | Regressiescenario's (20.3) en de 17 bandtests van `balance-scenarios.test.ts` |
| `nul-duels`, `nul-duels-zee` | Duelmatrix land en zee (20.3); vergelijkbaar met `docs/balans/duels-b4.md` |

**Alarmbellen** (het rapport zet ze bovenaan; de grenzen worden na de nulmeting bevroren, §2 regel 6):
- Superwapen: `gelijk` → tegenstander binnen 90 s uit, en de overwinst per klasse.
- Keuze-idle en tijd zonder beslissing in de midgame (vooral bij mensen, fase 21).
- Dominante eenheid en legerconcentratie in de lategame.
- Comeback-kans en patstellingen.
- Tijd tot de eerste strategische keuze.

### Bestanden

| Bestand | Wat |
|---|---|
| `src/game/systems/telemetry.ts` (nieuw) | `telemetryOnEvent`, `telemetryTick`, `logDecision`, velden, clusters, `FACTION_MECHANICS` |
| `src/game/core/events.ts` (nieuw) | `emit(s, ev)` |
| `src/game/types.ts` | `Telemetry`-types, `GameState.telemetry?`, `GameSettings.oreRules?`, extra eventvelden en -types |
| `src/game/data/config.ts` | `TELEMETRY` (meetparameters) |
| `src/game/core/sim.ts` | `telemetryTick` aan het eind van `tick`; `defeated`-event |
| `src/game/core/save.ts`, `core/state.ts` | Telemetrie in saves; init in `createGame` |
| `src/game/systems/combat.ts`, `powers.ts` | `damage(..., cause)`; `by`/`cost`/`cause` op `death` |
| `production.ts`, `orders.ts`, `abilities.ts`, `bridges.ts`, `economy.ts`, `crates.ts` | `emit` i.p.v. `push`; `enqueued`, `ability`; `regrowOre` kiest op `oreRules` |
| `src/game/systems/ai.ts`, `src/game/Game.ts` | `logDecision`-aanroepen; exportknop (scorescherm) |
| `src/game/tests/balance.test.ts` | `BALANCE_REPORT`, `BALANCE_ORE`, `COMPARE` |
| `src/game/tests/meting.ts`, `telemetry.test.ts`, `verlies.ts` (nieuw) | Analyse, unit-tests, verliesclassificatie |
| `src/game/tests/balance-lab.ts`, `duels.test.ts` | Regressiescenario's (`REGRESS=1`) en zeematrix erbij |
| `src/game/systems/combat.ts` | Ook: `mindControlStart` / `mindControlBroken` in `charged()` |
| `tools/tijdlijn.html` (nieuw) | Tijdlijnweergave van een export |
| `docs/metingen/` (nieuw) | Rapporten en JSON van de nulmeting |

### Klaar als
- [x] Nulmeting op basis 1.3.0 staat in `docs/metingen/` _(2026-10-06, build `1.3.0+2f1b3f7d`; samenvatting `docs/metingen/2026-10-06-nulmeting-samenvatting.md`)_: land, zee, normal-medium, zonder superwapens, ore-v12, scenario's, duelmatrix land en zee; elk als `.md` en `.json`.
- [x] `build` en `aiVersion` staan in elke export en elk rapport (met of zonder git, 20.4).
- [x] Alarm- en doelgrenzen staan bevroren in `docs/metingen/grenzen.md`, vóór fase 22 begint (§2 regel 6). _(2026-10-06)_
- [x] Het rapport noemt per metriek uit 20.2 de basiswaarde (mediaan en spreiding), apart voor AI; er staan geen verzonnen grenzen in.
- [x] Determinisme: een test speelt hetzelfde potje met en zonder telemetrie (en met `oreRules` leeg vs. `'v12'`) en vergelijkt winnaar, tick en een hash van de eindstand **zonder** `s.telemetry`. Identiek.
- [x] Soak-test en alle bestaande tests groen.
- [x] Een save met telemetrie laadt en loopt gelijk door; een oude save zonder telemetrie laadt ook.
- [x] `src/game/tests/telemetry.test.ts`: elke metriek uit A–G heeft een test op opgebouwde telemetrie (slaat aan en slaat níet aan).
- [x] _(2026-10-06: `docs/metingen/handmatig/2026-10-06-b5-allies-vs-soviets.json`)_ Een handmatig gespeeld potje levert via "Export match data" een JSON die `src/game/tests/meting.ts` zonder fouten leest, inclusief beslissingen van de mens.
- [x] `COMPARE` werkt op twee nulmeting-runs (verwacht: geen verschil). _(ore-v12 tegen land/zee: verschil 0)_
- [x] **Tijdlijnweergave** van een export (inkomen en legerwaarde van beide spelers over tijd, markers voor eerste contact, tweede CY, superwapenschoten, grootste gevecht en de fasegrenzen). Een statische pagina of print is genoeg; nodig voor de fun-audit in fase 21.
- [x] **Classificatiescript** (`src/game/tests/verlies.ts`): leest een export en geeft de geldige verliesoorzaken en de hoofdoorzaak volgens `fun-pass-verliesclassificatie.md`. Eén keer gedraaid op de nulmeting.

---

## Fase 21: Playtest-ronde 1 (mensen)

**Doel:** antwoord op de vraag die geen test kan beantwoorden: *is het leuk, en waar niet?*
Daarvoor leggen we eerst vast wat "leuk" betekent. Dat gebeurt **vóór** de eerste tester speelt.

### 21.0 Wat we met "leuk" bedoelen
"Leuk" is geen enkele score. We splitsen het in vijf dimensies. Elke dimensie heeft één vaste meting.

| Dimensie | Vraag of meting | Schaal | Wanneer |
|---|---|---|---|
| **Retentie** (intentie) | "Wil je nog een potje spelen?" | 1–5 | Na elk potje |
| **Retentie** (gedrag) | Na potje 3: "Je mag nog een vierde potje spelen, of stoppen." | speelt / stopt | Eén keer |
| **Agency** | "Had je het gevoel dat je keuzes ertoe deden?" | 1–5 | Na elk potje |
| **Begrip** | "Kun je uitleggen waarom je won of verloor?" + open antwoord | ja/nee + tekst, gecodeerd volgens `fun-pass-verliesclassificatie.md` | Na elk potje |
| **Comeback-gevoel** | "Was er een moment waarop je dacht: dit kan ik nog omdraaien?" (bij winst: "…dit kan nog misgaan?") | ja/nee + minuut | Na elk potje |
| **Keuzes per fase** | Fun-audit: zes fases, elk 0–2 | 0/1/2 | Na elk potje |

- **Begrip meten we objectief.** Het open antwoord wordt blind gecodeerd tegen een oorzaak die uit de telemetrie volgt. Het ja/nee is het zelfbeeld. Het verschil tussen die twee is zelf een bevinding.
- **Retentie meten we twee keer.** De 1–5-score is wat testers zeggen. Het vierde potje is wat ze doen.
- Deze tabel en de drempels in de twee bijlagen worden bevroren vóór tester 1. Daarna veranderen ze niet meer voor ronde 1 of ronde 2.

### Opzet
- **10 testers:** ~5 genrekenners (RA2/C&C-ervaring) en ~5 RTS-spelers zonder die achtergrond. Geen ontwikkelaars.
- **Elk 3 potjes:** één met elke factie, in wisselende volgorde (vast schema in `protocol.md`). Tegen één AI op **Normal**, medium-kaart, standaardinstellingen. De eerste keer mag de tutorial gespeeld worden.
- **Geen uitleg vooraf** behalve de besturing. De begeleider zegt niets tijdens het spelen.
- **Begeleider noteert** op het observatieformulier: tijdstempels van verwarring ("waar is…?", "waarom…?"), stilte of verveling, vergeten mechanieken en de eerste keer dat een tester uitbreidt. Hij geeft ook zelf een fun-audit-score per fase (zie `fun-pass-fun-audit.md`), zonder de score van de tester te zien.
- **Build:** alle potjes van ronde 1 draaien op één vaste build `playtest-r1` (tag of gearchiveerde kopie, zie 20.4): gameplay en AI van basis 1.3.0, plus de telemetrie van fase 20, **zonder** 26.A. De export toont `build` en `aiVersion`.
- **Vooraf afgerond:** de speeltest B5 van het balansplan (door de opdrachtgever). Leidt die tot nieuwe wijzigingen, dan komen die vóór de nulmeting, of de nulmeting wordt opnieuw gedaan.
- **AI-referentie** voor deze potjes is `nul-normal-medium` (zelfde niveau en kaartgrootte).
- **Data:** telemetrie-export van elk potje, plus scherm-opname als de tester dat goed vindt.

### Vragen na elk potje (~6 min)
De volgorde is vast. Begrip komt eerst, vóór de tester iets van de telemetrie of het scorescherm ziet. Anders leest hij het antwoord van de grafiek af. Bij `gameOver` draait de begeleider het scherm weg; exporteren gebeurt na vraag 2.

1. Wat was je doel?
2. Kun je uitleggen waarom je won of verloor? (ja/nee) Zo ja: waarom? *(woordelijk noteren)*
3. Had je het gevoel dat je keuzes ertoe deden? (1–5)
4. Was er een moment waarop je dacht: dit kan ik nog omdraaien? (ja/nee, en wanneer)
5. Wil je nog een potje spelen? (1–5)
6. **Fun-audit**: zes fases, elk 0/1/2. Eerst **zonder** tijdlijn; daarna, met de tijdlijn ernaast, mag de tester per fase één score corrigeren. Beide scores worden genoteerd; de eerste telt. Bij elke 0: "Wat gebeurde er toen?" *(dit vervangt de oude vraag "Op welk moment werd het saai?")*
7. Welke mechaniek vergat je of begreep je niet?

### Na alle drie de potjes
- Aanbod vierde potje (gedragsmeting; de begeleider noteert alleen ja/nee, en of het potje wordt uitgespeeld).
- "Welke eenheid vond je het leukst, per factie?" *(was vraag 3 per potje; één keer aan het eind is genoeg)*
- "Welke factie zou je opnieuw kiezen, en waarom?"
- "Wat zou je eruit halen?"
- "Maakte het menu je nieuwsgierig?" (beslissing 7)

### Benodigd uit fase 20
- Telemetrie-export (20.4) met de snapshots, gevechten, superwapenschoten, overnames, keuzedichtheid, tijd tot eerste betekenisvolle keuze en legerconcentratie.
- **Tijdlijnweergave** van een export: inkomen en legerwaarde van beide spelers over tijd, met markers voor eerste contact, tweede CY, superwapenschoten, grootste gevecht en de zes fasegrenzen. Een statische pagina of print is genoeg. Toevoegen aan "Klaar als" van fase 20.
- **Classificatiescript:** leest een export en geeft de geldige verliesoorzaken plus de hoofdoorzaak (`fun-pass-verliesclassificatie.md`). Dezelfde regels voeden later de samenvatting van de nabespreking (25.2).

### Materiaal (in `docs/playtest/`)
| Bestand | Inhoud |
|---|---|
| `protocol.md` | Script voor de begeleider, instellingen, factievolgorde per tester, volgorde van de vragen |
| `observatie.md` | Formulier met tijdstempelkolommen en de fun-audit-score van de begeleider |
| `vragenlijst.md` | De vragen hierboven, per potje en na afloop |
| `fun-audit.md` | Fases, ankers voor 0/1/2, afname en rapportage (concept: `plan/fun-pass-fun-audit.md`) |
| `verliesclassificatie.md` | Oorzaakcategorieën, criteria en codeerprocedure (concept: `plan/fun-pass-verliesclassificatie.md`) |
| `codeerblad.md` | Geanonimiseerde antwoorden op vraag 2, voor de twee beoordelaars |
| `rapport-ronde-1.md` | De uitkomst |

### Analyse
1. **Per tester één rij.** Alle scores, per potje, met genrekenner ja/nee en factie. Deze tabel staat volledig in het rapport. Hij is de basis; alles daarna is samenvatting.
2. **Per dimensie:** mediaan, spreiding (laagste–hoogste) en de verdeling van de scores. Bij 1–5: hoeveel testers op elk getal. Geen gemiddelden met twee decimalen.
3. **Begrip:** per potje de hoofdoorzaak (script), de code van beide beoordelaars en de uitkomst (0/1/2). Verloren en gewonnen potjes apart.
4. **Fun-audit:** balk per fase met verdeling, naast de bijbehorende telemetrie (zie `fun-pass-fun-audit.md`). Waar tester en begeleider ≥ 2 punten verschillen, staat dat apart.
5. **Telemetrie van mensen naast die van `nul-normal-medium`** (zelfde niveau en kaartgrootte): speelduur, superwapen-impact, uitbreiding, ongebruikt geld, keuzedichtheid.
6. **Vergeten of onbegrepen mechanieken**, met hoe vaak (x van n testers). Belangrijkste input voor de schrapronde.
7. **Momenten met score 0**, met tijdstempel en context uit observatie en telemetrie.
8. **Helden en specialisten** (open punt uit balansronde 1): worden Nova, The Oracle, de Mentalist en de Toxin Sniper gebouwd, en gebruiken testers hun kracht (C4 geplaatst, gebouw overgenomen, mind control voltooid of afgebroken, Psi-golf/Psi Storm)? Telemetrie (`enqueued`, `ability`, `mindControlStart/Broken`) naast observatie. Worden ze niet gebouwd of niet effectief gebruikt, dan is dat input voor menu BL (BL3).

### Rapporteren met 8–10 testers
Tien testers zijn genoeg om problemen te vinden. Ze zijn niet genoeg om kleine verschillen te meten. Daarom:

- Altijd **"x van n"**, nooit een los percentage. "7 van 10 testers", niet "70%".
- Altijd de **spreiding** naast de mediaan. Een mediaan van 3 met alle scores tussen 1 en 5 is iets anders dan een mediaan van 3 met alleen drieën.
- **Individuele antwoorden** staan in een bijlage, letterlijk. Citaten in de tekst zijn illustratie, geen bewijs.
- **Minimum n:** een criterium met minder dan 8 waarnemingen (bijv. verloren potjes) is **onbeslist**.
- Een conclusie telt pas als **twee bronnen** het eens zijn: antwoorden, observatie of telemetrie (zie §5, risico 2).

| Deze conclusies mogen wel | Deze conclusies mogen niet |
|---|---|
| "6 van 10 vergaten de Repair Depot" → kandidaat voor uitleg of schrappen | "Agency steeg van 3,4 naar 3,7, dus het is beter" |
| "In de midgame gaven 5 van 10 een 0, en de telemetrie toont geen tweede CY" → probleemfase | "Psi is minder leuk dan Red Bloc" op basis van één punt verschil |
| "Niemand noemde superwapens als verliesoorzaak, en het script ook niet" | Uitspraken over genrekenners vs. niet-kenners (5 vs. 5), tenzij het verschil groot is én in elke tester terugkomt |
| Een patroon dat bij ≥ 3 testers terugkomt, als hypothese voor fase 22–26 | Een patroon bij 1 tester als besluit |

### Klaar als
- [ ] 21.0, `fun-pass-fun-audit.md` en `fun-pass-verliesclassificatie.md` zijn bevroren (datum in het bestand) vóór tester 1.
- [ ] De classificatieregels zijn geijkt en gedraaid op `nul-normal-medium`, vóór tester 1; de verdeling over categorieën staat in het rapport.
- [ ] Minstens 8 testers × 3 potjes afgerond, met export van elk potje.
- [ ] Vraag 2 is door twee beoordelaars blind gecodeerd; de overeenstemming staat in het rapport.
- [ ] `rapport-ronde-1.md` bevat: de tabel per tester, per dimensie mediaan + spreiding + verdeling, de fun-audit-balken, begrip volgens de classificatie, de top 5 problemen (x van n) en de lijst van vergeten mechanieken.
- [ ] De streefwaarden voor fase 27 (hieronder) zijn ingevuld met de waarden uit ronde 1 en bevroren vóór fase 23 begint.

**Risico:** testers werven kost tijd. Terugvaloptie: 5 testers, en het plan gaat door met de kanttekening dat de conclusies minder zeker zijn. Met 5 testers rapporteren we alleen individuele antwoorden en patronen, geen medianen per subgroep. De AI-metingen uit 20.2 wegen dan zwaarder.

---

## Fase 22: Ontwerpkern en schrapronde

**Doel:** de kernzin en de factiezinnen vaststellen, en elke eenheid en mechaniek daaraan toetsen.

### 22.1 Rechtvaardiging per eenheid
Nieuw document `docs/ontwerp/roster.md`: een tabel met alle 51 eenheden en 29 gebouwen. Kolommen:

| Kolom | Inhoud |
|---|---|
| Rol | Wat doet hij (anti-tank, scout, economie, …) |
| Factiezin | Welke kernzin versterkt hij? Leeg = kandidaat om te schrappen |
| Uitzonderingsregels | Hoeveel regels moet een speler onthouden die nergens anders gelden |
| Gebruik (AI) | Uit de nulmeting: gebouwd, kosten-efficiëntie in AI-potjes |
| Kosteneffectiviteit | Uit de duelmatrix (`nul-duels`): gemiddelde in de eigen rol, band 0,8–1,25 |
| Gebruik (mens) | Uit de playtest: gekozen, vergeten, leukst |
| Overlap | Welke andere eenheid doet hetzelfde |
| Besluit | Houden / vereenvoudigen / uitzetten |

### 22.2 Complexiteitsbudget
- We tellen per factie het aantal **uitzonderingsregels**: mechanieken die de speler moet kennen en die niet uit "schade, bereik, pantser" volgen. Voorbeelden: IFV-passagierswapen, Shroud Tank-camouflage, Leech Drone (vreet een voertuig 20 s van binnenuit op; een Colossus overleeft het; alleen een Repair Depot haalt hem er eerder uit), Kraken + Sonar Drone, Arc Coil opladen, Thrall Hauler ontplooien, Hivemind-overbelasting (houdt er 4 vast, de vierde kost hp), Hover Disc-diefstal, Nova's C4-tijdbom (3 s lont; een Construction Yard of superwapen vraagt twee ladingen).
- **Nieuw door balansronde 1, en meetellend voor Psi:** mind control laadt eerst op (1 s + 0,5 s per 500 credits van het doel; wegrijden of de controller doden breekt het af), drones en andere mind-controllers zijn immuun, en The Oracle neemt gebouwen over met een **aparte straal** (4,5 tegels, 5 s ononderbroken, een treffer breekt af; Construction Yard en superwapens immuun). Daarmee is het budget van Psi (≤ 8) krapper dan in v3 van dit plan.
- **Doel:** Allied ≤ 6, Red Bloc ≤ 6, Psi ≤ 8 regels. Psi mag het hoogste zijn, want die factie wordt expliciet de "gevorderde" factie.
- Gedeelde mechanieken (engineer, garrison, transport, veterancy) tellen één keer, voor alle facties.
- **Tellen:** de lijst in `roster.md` is canoniek. Twee personen tellen onafhankelijk; verschillen worden besproken en het resultaat staat in `roster.md`.

### 22.3 Schrapkandidaten (voorstel; definitief na 22.1 en de playtest)
Uitzetten via een dataveld `cut: true`: niet bouwbaar, niet in de AI-roster, niet in de UI. De **uitzetlijst** wordt vastgesteld na ronde 1; definitief verwijderen gebeurt pas na ronde 2 (27.3). De code blijft tot dan staan.

| Kandidaat | Waarom (uit de feedback) | Alternatief als hij blijft |
|---|---|---|
| **Duplicator Vats** (Psi) | Economie-uitzondering die niet bij mind control hoort | – |
| **Reclaimer** (Psi) | Idem; de AI gebruikt hem niet | Alleen recyclen van *overgenomen* eenheden (steunt dan de kernzin) |
| **Delirium Drone** (Psi) | Tweede "controle"-systeem naast mind control | Vervangt de Hivemind als de playtest dat aangeeft (één van de twee) |
| **Hover Disc-diefstal** (Psi) | Twee uitzonderingen in één eenheid | Disc houdt alleen zijn laser |
| **Leech Drone** (Red Bloc) | Gotcha: vreet een voertuig 20 s van binnenuit op (`LEECH_SECONDS`); alleen een Repair Depot haalt hem er eerder uit, en dat zie je nergens | Elke reparatie (ook Engineer of Machine Shop) verwijdert hem, plus een eerste-keer-melding (25.3) |
| **Siege Rotor** (Red Bloc) | Lucht → artillerie → gronddoel; overlapt met de Longbow | – |
| **IFV-passagierswapen** (Allied) | Lijst om te onthouden | Alleen: "met infanterie aan boord vuurt hij een tweede wapen" (één regel) |
| **Bonuskratten** | Willekeur die comebacks oneerlijk maakt | Blijven bestaan, maar standaard uit in de lobby |
| **Mutagen Spire** (Psi) | Overlapt met Dominion Engine; twee eigendom-veranderende superwapens | Besluit hier in fase 22; fase 24 meet alleen het effect |

**Niet** op de lijst, omdat ze de kernzin dragen: Mentalist, The Oracle, Hivemind (Psi); Phase Trooper, Shroud Tank, Airfield (Allied); Longbow, Colossus, Arc Coil-opladen (Red Bloc). Dat is wel open voor de playtest.

**Net versterkte units.** Balansronde 1 versterkte de Phase Trooper, Magnetar, Blight Trooper, Shroud Tank en Sapper, omdat niemand ze zou bouwen. De Delirium Drone scoorde ook laag (0,56 in de nulmeting van de duelmatrix) maar is niet aangepast. Voor deze units geldt: een oordeel in de schrapronde alleen op data **ná** de balansronde (`nul-duels`, de AI-nulmeting en ronde 1). "Zwak in duels" is zonder nieuwe meting geen schrapreden meer.

### 22.4 Psi-besluit
Voorstel: **optie C uit de feedback**, waarbij mind control de dominante mechaniek is. Uitwerking:
- **Kern:** Mentalist, Hivemind en The Oracle; Psi Spire als tegenhanger op afstand.
- **Steun:** Lash Tank, Spinner Tank, Magnetar, Mauler en Toxin Sniper.
- **Psi Beacon** blijft, want het is een detectiemiddel en geen extra systeem.
- **In de lobby** staat bij elke factie een moeilijkheidslabel: *Instap / Gemiddeld / Gevorderd*. Dat gaat over het aantal systemen, niet over kracht.

### 22.5 Kernzin overal doorvoeren
- `PRODUCT.md`: kernzin en factiezinnen toevoegen.
- Lobby: de factiezin onder elk embleem, in plaats van de huidige tagline.
- Briefing-tips: per factie gericht op de kernzin.

### Klaar als
- [ ] De opdrachtgever heeft de kernzin, de factiezinnen en de schraplijst vastgesteld (zie §4, beslissingen).
- [ ] `roster.md` is volledig ingevuld; elke eenheid heeft een besluit.
- [ ] Uitgezette eenheden zijn niet bouwbaar, niet in de AI en niet in de UI, en alle tests zijn groen.
- [ ] Een nieuwe meting (zoals in 20.2, plus de duelmatrix) is gedaan: factiebalans opnieuw binnen 40–60% (winrate niet-spiegel, puntschatting, 20.2-G).

---

## Fases 23–26: vaste opbouw

Elke fase: **onderzoeksvraag** → **startvoorwaarde** (welk bewijs uit 20/21/22 activeert haar; zonder bewijs vervalt of krimpt ze) → **interventiemenu** (opties met hypothese, metriek, richting, kosten/risico; een optie is geen besluit) → **werkregel** → **klaar als**.

### Werkregel (geldt voor alle vier de fases)

- **Eén meetrij voor 23–26 én voor balanswijzigingen.** Per iteratie precies één interventie uit één van de menu's: E (23), S/D (24), U (25, per onderdeel, zie daar), A (26) of BL (balans, na fase 26). Een balanswijziging in `data/` is ook een interventie. Bouwen mag parallel in branches; invoeren en meten gebeurt één voor één. De volgorde van de rij is beslissing 15.
- **Maximaal één interventie per iteratie.** Daarna opnieuw meten met dezelfde meetset als de nulmeting.
- **Drempels vooraf vastleggen.** Hypothese, **één primaire metriek** en grens staan in `docs/metingen/` vóórdat de meting draait (§2 regel 6). Andere metrieken zijn verkennend.
- **Terugdraaien** als de hypothese niet uitkomt. Of opnieuw bespreken, met de meting erbij.
- **Vaste AI-versie per vergelijking.** Beide armen van een vergelijking draaien met dezelfde AI-code. Een AI-wijziging is zelf een interventie. Arm A is de **referentie na 26.A** (`ref-26a`), niet de nulmeting. Startvoorwaarden die "Fase 20" noemen, lezen `ref-26a` zodra die er is: de v1.2-AI vindt een verplaatste basis niet, en dat vervuilt duur en patstellingen.
- **Twee lagen moeten het eens zijn** (§5): AI-meting, duelmatrix en scenario's, of playtest. Eén laag is niet genoeg voor een besluit.

---

## Fase 23: Economie en uitbreiding

### Onderzoeksvraag
**Waarom breiden spelers niet uit, en werkt resource denial?**

### Feiten uit de code (basis 1.3.0; de ore-regels zijn sinds v1.2 ongewijzigd)
`economy.ts#regrowOre`, met `config.ts`. Het oude plan gaf dit te grof weer.

| Mechaniek | Werking nu |
|---|---|
| Ritme | Elke `ORE_REGROW_INTERVAL` = 150 ticks = 5 s (`TICK_RATE` 30) |
| Aangroei per tegel | Elke tegel met ore **> 0** en onder het maximum krijgt `ORE_REGROW_AMOUNT` = +8 (max 300, gems 600) |
| Lege tegel | Een tegel op 0 groeit **niet** aan. Een Hauler eet een tegel leeg tot 0 als zijn lading dat toelaat (`HARVEST_BITE` 40) |
| Uitzaaiing | Elke tegel ≥ 50% vol heeft per stap 5% kans (`ORE_SPREAD_CHANCE`) om één lege buur (gras/zand, vrij) te zaaien met 8 ore |
| Mine | Per stap +`ORE_MINE_OUTPUT` = 40 (gems ×2) op **één** willekeurige tegel binnen 2 tegels van de mine, ook op een lege tegel. Valt die tegel af (bezet, verkeerd terrein, andere ore-soort), dan geen aanvulling |
| Kaart (`mapgen.ts`) | Per speler een thuisveld (straal 4) richting het midden; plus `size/20` extra velden (straal 3) willekeurig in het middelste deel, het eerste met gems; puntsymmetrisch |

**Correctie op het oude plan:** "een veld van ~20 tegels herstelt ~40 credits/s" is een **bovengrens**. Die geldt alleen als alle tegels half leeg zijn maar niet op 0. Leeggegeten tegels komen alleen terug via uitzaaiing of de mine (~8 credits/s per mine, 16 bij gems). Hoe snel velden in de praktijk leeglopen, moet fase 20 meten, niet de rekensom.

**Tweede feit:** de AI breidt nu **niet** uit. `crawlers()` bouwt alleen een Base Crawler als er geen CY meer is, en zet hem neer binnen 8 tegels van de start. De AI plaatst raffinaderijen binnen ±12 tegels van haar CY (`bestSpot`); Haulers zoeken ore binnen 20 tegels (`findOre`). Een AI-meting van "uitbreiding" meet dus vooral het onvermogen van de AI.

### Startvoorwaarde
De fase start als er **ten minste twee signalen uit fase 20 of 21** zijn. De rij "Fase 22" is geen signaal maar een **extra voorwaarde** voor E5–E7 (het besluit over de strategische as).

| Bron | Signaal |
|---|---|
| Fase 20 | Velden zakken zelden < 25% van hun maximum; inkomen per minuut blijft na 15 min ≥ 80% van de piek zonder tweede veld |
| Fase 20 | Winrate met vs. zonder tweede CY verschilt < 10 procentpunt (uitbreiden loont niet) |
| Fase 20 | Harassment op Haulers/raffinaderijen kost het slachtoffer < 1 min inkomen (resource denial werkt niet) |
| Fase 21 | Meerderheid van de testers breidt niet uit, of pas na 15 min (observatieformulier) |
| Fase 21 | Saaimomenten of veel ongebruikt geld in de midgame (5–15 min) |
| Fase 22 | Territorium (richting A) is vastgesteld als strategische hoofdas |

**Zonder dit bewijs:**
- Kiest fase 22 níet voor A als hoofdas → fase 23 **krimpt** tot leesbaarheid (bouwradius op de minimap), en alleen als testers de bouwradius niet begrepen.
- Breiden testers wél uit en werkt harassment wél → fase 23 **vervalt**.

### Eis vóór een economiebesluit: economy-only simulatie
De ore-wijziging (geen aangroei per tegel, alleen de mine-druppel) is **geen tweak maar een herontwerp van de economie**. Ze raakt: productietempo, timing van uitbreiden, map control, harassment, comebacks, waarde van defensie, waarde van een tweede CY en de duur van een potje.

Daarom eerst een vergelijking **met alleen de economie als verschil**:

| | Arm A | Arm B |
|---|---|---|
| Economie | v12 (zoals hierboven) | Gekozen variant uit het menu |
| AI | Referentie-AI (26.A) + E6 | Identiek |
| Superwapens, kaarten, eenheden | Identiek | Identiek |
| Omvang | Meetset van 20.6 (117 potjes) | Idem, zelfde seeds |

**Vergelijken:** inkomen per minuut, productie (uitgegeven bedrag, productie-uptime), tijd tot de eerste uitbreiding, speelduur, uitputting (velden < 25%), comeback-kans, aantal patstellingen.

**Let op de AI.** Omdat de AI niet uitbreidt, meet arm B anders vooral uithongering. Eerst is daarom een **minimale, neutrale uitbreidingsregel** nodig (zie optie E6). Die regel komt in **beide** armen, en wordt eerst los gemeten tegen `ref-26a` (eigen iteratie). Dit is geen intentiesysteem uit fase 26.

Pas na deze vergelijking wordt besloten of een variant naar playtest-ronde 2 gaat.

### Interventiemenu

| # | Interventie | Hypothese | Metriek | Richting | Kosten / risico |
|---|---|---|---|---|---|
| E1 | **Geen aangroei per tegel, geen uitzaaiing; alleen de mine** (oud voorstel "eindeloos maar inefficiënt") | Uitgeputte velden dwingen tot uitbreiden; denial gaat werken | Inkomen na 15 min zonder tweede veld; % potjes met tweede veld | ≤ 50% van piek; ↑ (doel ≥ 70% bij Hard, mits E6) | Herontwerp; risico op patstellingen en kortere potjes. Grens: ≤ 2% patstellingen in de meetset |
| E2 | Aangroei per tegel halveren (8 → 4), uitzaaiing blijft | Zachtere versie van E1 | Idem | Idem, kleiner effect | Klein getal in `config.ts`; laag risico |
| E3 | Alleen uitzaaiing uit | Velden groeien niet meer over de kaart uit | Veldgrootte over tijd; uitputting | Velden krimpen ↓ | Laag; effect mogelijk te klein |
| E4 | Mine-opbrengst aanpassen (40 ↑/↓) | Regelt de "druppel" na uitputting | Patstellingen; inkomen uitgeput veld | Stelknop bij E1/E2 | Eén getal; alleen samen met E1/E2 zinvol |
| E5 | **Kaart:** kleinere startvelden (straal 4 → 3); per speler één veilig uitbreidingsveld en één rijk, betwist veld in het midden; tech-gebouwen bij uitbreidingsvelden | Uitbreiden krijgt een duidelijke plek en reden | Tijd tot tweede veld; gevechten bij velden | ↓ / ↑ | `mapgen.ts` + `world/structures.ts`; puntsymmetrie en bereikbaarheidstest moeten blijven |
| E6 | **AI-uitbreidingsregel (minimaal):** bij ≤ 30% ore in het eigen veld een raffinaderij of Base Crawler naar het dichtstbijzijnde vrije veld | Zonder dit is de AI-meting van E1–E5 waardeloos | % AI-potjes met tweede veld | ↑ | Verandert AI-gedrag; eigen iteratie, vóór E1–E5 |
| E7 | **Base Crawler** $3.000 → $2.000 en alleen War Factory vereist (nu `factory` + `depot`) | Uitbreiden wordt eerder een optie | Tijd tot tweede CY | ↓ | Data-wijziging; risico op "CY-spam" |
| E8 | Bouwradius als vlak in teamkleur op de minimap ("territorium") | Spelers zien waar ze kunnen uitbreiden | Playtest: "wist je dat je kon uitbreiden?" | ↑ | Alleen UI; geen gameplay-effect |

Volgorde-advies, geen besluit: E6 → (economy-only simulatie met E1 of E2) → E5 → E7. E8 kan los, want het verandert de simulatie niet.

### Klaar als
- [ ] Startvoorwaarde getoetst en het besluit (start / krimp / vervalt) vastgelegd in `docs/metingen/`.
- [ ] Bij start: economy-only simulatie gedaan (≥ 100 potjes per arm) en besproken vóór een economiebesluit.
- [ ] Elke uitgevoerde interventie heeft een eigen meting; niet-gehaalde hypotheses zijn teruggedraaid.
- [ ] Soak-test groen; alle starts bereikbaar; patstellingen binnen de grens.
- [ ] Ore-regels in het ontwerpdocument kloppen met de code (ook als er niets verandert).

---

## Fase 24: Superwapens en lategame

### Onderzoeksvraag
**Beslissen superwapens potjes die anders open waren, en eindigt de lategame in één deathball-gevecht?**

### Feiten uit de code (basis 1.3.0)
- Zes superwapens, één per gebouw, `limit: 1`. Laadtijd 240 s (Phase Gate, Stasis, Mutagen) of 360 s (Storm, Hammer, Dominion). Kosten $2.500 of $5.000, vereist Tech Center (`lab`).
- Sinds balansronde 1 hebben superwapen-gebouwen 1500 hp: Nova's C4 (1250 schade) vraagt twee ladingen, en The Oracle kan ze niet overnemen. Dat beperkt het uitschakelen van een superwapen met een held; meet dat mee in het kernsignaal.
- Er is geen tijdslot voor spelers. De AI bouwt superwapens pas na 6 min speeltijd (`planBuilding`). De Easy-AI bouwt er nooit een: ze bouwt geen Tech Center (`cfg.towers > 1`).
- Dominion Engine neemt permanent over; Mutagen Spire maakt van vijandelijke infanterie Maulers.

### Waarom de oude beslisregel niet deugde
"Wie het eerste superwapen afvuurt wint > 65%" is te mechanisch. Wie als eerste schiet, stond vaak al voor (meer geld → eerder een superwapen). Dan is 66% normaal en zegt het niets over het superwapen.

### Nieuwe meting (uitbreiding van de analyse in 20.2, geen gameplay)
**Voorsprong vóór het superwapen, bakken en kernsignaal:** definities in 20.2-D (één bron). Kort:
- Bakken op totale waarde (leger + gebouwen + credits), met legerwaarde als controle.
- **Kernsignaal:** in bak `gelijk`, % schoten waarna de tegenstander binnen 90 s is uitgeschakeld.
- "Beslissend achter" is een secundaire metriek; daar stuurt fase 24 niet op.
- Bakken met n < 15 schoten zijn onbeslist.

**Deathball, twee metrieken:**
- Eén gevecht kost ≥ 50% van de legerwaarde van de verliezer en het potje eindigt binnen 5 min (zoals 20.2).
- **Legerconcentratie** (definitie in 20.2-E, parameter `TELEMETRY.clusterGap`): % van de legerwaarde in één cluster, per snapshot na 15 min. Een hoge concentratie zonder groot gevecht is ook een signaal: dan staat er een deathball die nergens op stuit.

### Startvoorwaarde
| Bron | Activeert |
|---|---|
| Fase 20 | Kernsignaal > 25% (bak `gelijk`, n ≥ 15) |
| Fase 20 | Superwapens zijn > 15% van alle vernietigde/overgenomen waarde, of de factiebalans met vs. zonder superwapens verschilt > 10 procentpunt |
| Fase 20 | ≥ 40% van de potjes eindigt met één beslissend gevecht na 15 min, of de mediane legerconcentratie na 15 min is ≥ 70% |
| Fase 21 | Testers noemen een superwapen als reden van verlies zonder dat ze konden reageren, of de lategame als saai/voorspelbaar |
| Fase 22 | Een superwapen staat op de schraplijst (bijv. Mutagen Spire) |

Dit zijn **activeringsdrempels**, bevroren met dit plan (§2 regel 6).

**Doelgrenzen** (wanneer het probleem opgelost is). Voorstel; bevroren na de nulmeting in `docs/metingen/grenzen.md`:

| Metriek | Doel |
|---|---|
| Kernsignaal (bak `gelijk`, n ≥ 15) | ≤ 10% |
| Aandeel superwapens in vernietigde/overgenomen waarde | ≤ 10% |
| Overwinst per bak (20.2-D) | ≤ 10 procentpunt |
| Factiebalans met vs. zonder superwapens | ≤ 5 procentpunt verschil |
| Potjes met één beslissend gevecht na 15 min | ≤ 25% |
| Mediane legerconcentratie na 15 min | ≤ 60% |

**Zonder dit bewijs:** fase 24 krimpt tot **leesbaarheid**: aankondigingen, tooltips en de aftelling zichtbaar maken (optie S5) als testers niet zagen wat er gebeurde. Verder niets.

### Interventiemenu

| # | Interventie | Hypothese | Metriek | Richting | Kosten / risico |
|---|---|---|---|---|---|
| S1 | Superwapen pas bouwbaar na 10 min speeltijd | De dreiging verschuift naar de lategame | Tijd tot eerste schot; kernsignaal | ↑ / ↓ | Klein; kan lategame verder rekken |
| S2 | Eerste lading 1,5× zo lang | Meer tijd om te reageren | Kernsignaal | ↓ | Eén getal per wapen |
| S3 | **Dominion Engine:** overname 60 s, daarna keert alles terug; gebouwen alleen offline | Eigendomswissel is minder definitief | Overgenomen waarde; kernsignaal bij Psi | ↓ | Raakt de Psi-kernzin; afstemmen met 22.4 |
| S4 | **Mutagen Spire** samenvoegen met Dominion of uitzetten | Psi houdt één eigendomswapen | Complexiteitsbudget; Psi-balans | Regels ↓ | Alleen via de schrapronde van fase 22 |
| S5 | Aftelling van 5 s, inslag zichtbaar voor iedereen | Tegenspel wordt mogelijk | Waarde ontweken na waarschuwing; playtest | ↑ | Vooral UI; Hammer Silo heeft al vliegtijd |
| S6 | Stasis werkt niet op Construction Yards | Geen onkwetsbare kernbasis | Stasis-gebruik bij CY's | ↓ | Klein; eerst meten of het voorkomt |
| S7 | Straal kleiner, per wapen (laatste stap) | Minder waarde per schot | Waarde per schot | ↓ | Kan wapens nutteloos maken |
| D1 | Verdedigingsgebouwen +25% HP | Een gat moet worden opengebroken, niet overlopen | Deathball-metrieken | ↓ | Kan turtlen en patstellingen geven |
| D2 | AI zet splash (artillerie, Refractor Tank) gericht in tegen grote groepen | Klonteren wordt bestraft | Legerconcentratie; gevechtsgrootte | ↓ | AI-wijziging; hoort bij fase 26 |

**Blijft uitgesloten:** leger-onderhoud (upkeep). Dat is een nieuw systeem (feature freeze) en botst met genre-spiergeheugen.

### Klaar als
- [ ] Voorsprong-vóór-superwapen en legerconcentratie zitten in de analyse en in de nulmeting.
- [ ] Startvoorwaarde getoetst; besluit vastgelegd.
- [ ] Bij start: het kernsignaal en de deathball-metrieken halen na de interventies de doelgrenzen hierboven, of de interventie is teruggedraaid.
- [ ] Factiebalans met superwapens blijft binnen 40–60% (winrate niet-spiegel, 20.2-G).
- [ ] Announcer-regels en tooltips passen bij de regels zoals ze dan zijn.

---

## Fase 25: De speler begrijpt het spel

### Onderzoeksvraag
**Leert de speler het spel (en niet alleen de interface), en weet hij na een potje waarom hij won of verloor?**

### Startvoorwaarde
Dit deel verandert de simulatie niet, maar volgt dezelfde regel: niets is vooraf verplicht. Elk onderdeel (U1–U3, menu hieronder) start alleen bij bewijs.

| Bron | Bepaalt |
|---|---|
| Fase 21 | Welke mechanieken vergeten of onbegrepen zijn (lijst met frequentie) → welke missies en eerste-keer-meldingen nodig zijn |
| Fase 21 | Hoe vaak het antwoord op "waarom verloor je?" afwijkt van wat de telemetrie laat zien → omvang van de nabespreking |
| Fase 22 | Welke uitzonderingsregels overblijven na de schrapronde → alleen die krijgen uitleg |

**Zonder bewijs:** missies voor mechanieken die testers wél begrepen, vallen af. Begrijpen testers al ≥ 70% van hun verliezen, dan krimpt de nabespreking tot de samenvatting.

### Interventiemenu

| # | Interventie | Start als | Hypothese | Metriek |
|---|---|---|---|---|
| U1 | Tutorialmissies (25.1), **per missie** | ≥ 3 testers (x van n) vergaten of begrepen het concept van die missie niet (21, analyse punt 6) | Wie de missie speelde, vergeet het concept niet | Vergeten mechanieken in ronde 2 |
| U2 | Nabespreking (25.2) | Begrip (code 1 of 2) in ronde 1 < 7 van 10 verloren potjes | Begrip stijgt | Begrip volgens de verliesclassificatie |
| U3 | Eerste-keer-meldingen en "Countered by" (25.3) | Een uitzonderingsregel die de schrapronde overleeft en die ≥ 3 testers vergaten | Minder vergeten | Vergeten mechanieken |

### 25.1 Tutorialmissies: één concept per missie
De huidige checklist-tutorial (10 stappen, `tutorial.ts`: tekst + `done`-functie) blijft als **"Basics"**. Daarnaast korte missies op hetzelfde systeem, plus een startopstelling. Geen verhaal, geen campagne.

**Probleem in het oude plan:** missie 3 ("The bridge") vroeg zes concepten tegelijk: choke point, bruggen, Engineer, brughuisje, uitbreiden en een tweede CY.

**Ontwerpregel:** elke missie vereist precies **één concept** om verder te komen, volgens het patroon:

> Ik probeer X → werkt niet → het spel laat zien waarom → ik ontdek Y → Y werkt.

| Missie | Concept | X (eerste poging) | Waarom het faalt, en hoe het spel dat toont | Y (oplossing) | Geslaagd als |
|---|---|---|---|---|---|
| 1. Harvester under attack | Je economie beschermen | Leger blijft in de basis | Raiders doden de Hauler; melding "Income stopped" + inkomensbalk valt weg | Eenheden bij het veld zetten (guard) | Hauler leeft na 3 min |
| 2. Heavy armor | Counters kiezen | Eigen basistanks tegen zware tanks | Verloren gevecht; tooltip "Countered by" licht op | Anti-tank per factie (Rocket Trooper / Longbow / Magnetar) | Golf van 4 zware tanks verslagen met < $3.000 verlies |
| 3. The bridge | Choke point | Verdedigen in het open veld | Overlopen van meerdere kanten; brug gemarkeerd als vernauwing | Verdediging bij de brug | Drie golven gestopt |
| 4. Dry field | Uitbreiden | Blijven oogsten in het thuisveld | Klein veld raakt leeg; melding + vrij veld gemarkeerd | Base Crawler of raffinaderij bij het nieuwe veld | 1.000 credits geoogst uit het tweede veld |
| 5. Broken bridge (optioneel) | Engineer en brughuisje | Leger over een kapotte brug sturen | Pad geblokkeerd; brughuisje gemarkeerd | Engineer repareert de brug | Leger aan de overkant |

- Missies 3–5 zijn de splitsing van de oude missie 3.
- Missie 4 hangt af van fase 23: de melding moet kloppen met de ore-regels zoals ze dan zijn. De missie werkt met een vooraf ingesteld klein veld, dus ook met de huidige economie (`v12`).
- Missie 5 alleen als fase 21 laat zien dat Engineer/bruggen vergeten worden.
- **Repareren en het Repair Depot** uit de oude missie 1 vallen weg: dat was een tweede concept.

### 25.2 Nabespreking: "Waarom verloor ik?"
Het scorescherm wordt een **post-match analyse** met tabs. Score en rang blijven, klein en secundair (beslissing 8).

**Basis: een vooraf vastgelegde verliesclassificatie.** De samenvatting kiest regels uit de categorieën in `docs/playtest/verliesclassificatie.md` (concept: `plan/fun-pass-verliesclassificatie.md`). Elke categorie heeft daar een definitie op telemetrie. Zo zegt de nabespreking niet zomaar iets plausibels, maar volgt ze dezelfde indeling als de analyse van de playtest.

1. **Samenvatting** (bovenaan, gewone taal), drie tot vijf regels. Voorbeelden uit het oude plan, elk te koppelen aan een categorie:
   - "Enemy economy was 1.8× yours from minute 9." (EU)
   - "Your factories were idle 41% of the time." (PB)
   - "You had no anti-air when their airships arrived." (SC)
   - "Superweapon strikes cost you $8,400." (SW)

   De drempels staan **alleen** in `verliesclassificatie.md`; de voorbeelden hier zijn tekst, geen criteria. Een regel zonder categorie komt niet in de samenvatting.
2. **Economie:** geoogst, piekinkomen, besteed, ongebruikt geld, productie-uptime, inkomen over tijd.
3. **Militair:** vernietigd/verloren per klasse, het grootste gevecht, legerwaarde over tijd.
4. **Controle:** uitbreidingen, tech-gebouwen, overnames, bruggen.

**Toets:** in playtest-ronde 2 komt het antwoord van de tester op "waarom verloor je?" overeen met de categorie die de nabespreking koos.

### 25.3 Uitzonderingsregels uitleggen op het moment zelf
Alleen voor regels die na de schrapronde overblijven:
- **Eerste keer** één regel in het berichtlog (optioneel announcer). Bijv. "A Leech Drone is eating your tank. A Repair Depot pulls it out; otherwise it burns out after 20 seconds." Of, voor de nieuwe regel uit balansronde 1: "Your tank is being mind-controlled. Move it away or kill the controller."
- **Tooltip** van elke eenheid: "Countered by: …".

### 25.4 Touch
**Bevroren.** Geen nieuwe touch-functionaliteit in 1.4; de bestaande e2e-test blijft groen. Een commandowiel komt alleen als playtest-ronde 2 met tablettesters laat zien dat de Select/Order-schakelaar het probleem is (beslissing 6).

### Werkregel voor fase 25
De simulatie verandert niet, dus "één interventie per iteratie" geldt hier per **meetbaar onderdeel**: missies, nabespreking en eerste-keer-meldingen worden apart beoordeeld (eigen vraag in de playtest), zodat duidelijk is welk onderdeel het verschil maakt.

### Klaar als
- [ ] Per missie een e2e-test met twee gescripte strategieën via echte invoer: de **X-strategie** (eerste poging uit de tabel) haalt het doel **niet**, de **Y-strategie** wel. Zo is "één concept" toetsbaar.
- [ ] Nabespreking volgt `docs/playtest/verliesclassificatie.md`; elke samenvattingsregel heeft een unit-test (slaat aan / slaat níet aan).
- [ ] e2e-test op het nabesprekingsscherm bij winst en verlies.
- [ ] Elke overgebleven uitzonderingsregel heeft een eerste-keer-melding en een "Countered by"-regel.
- [ ] Touch-e2e groen, niets toegevoegd.

---

## Fase 26: AI met intenties en geheugen

### Onderzoeksvraag
**Speelt de AI eerlijk en robuust, en voelt ze als een tegenstander met een plan?**

### Feiten uit de code (basis 1.3.0)
`pickTarget` (gebruikt door `attack` en de Phase Gate) werkt alleen op wat de AI **nu** ziet (`canSee`), zonder geheugen:
1. Het zichtbare vijandelijke gebouw het dichtst bij de **eigen start** (geen muren).
2. Anders: de eerste zichtbare vijandelijke eenheid.
3. Anders: een onverkende startpositie waar een vijand begon, dichtstbij eerst.
4. Anders: een willekeurige, nu niet zichtbare, begaanbare tegel binnen ±10 tegels van een vijandelijke **start** (40 pogingen).
5. Anders: een willekeurige niet-zichtbare tegel op de hele kaart; als laatste het kaartmidden.

Gevolg: een gebouw dat de AI net zag maar nu niet meer ziet, bestaat voor haar niet. Een basis ver van de start wordt alleen bij toeval gevonden. `crawlers()` breidt nooit uit (zie fase 23). In `powers()` richten Storm Engine, Hammer Silo, Dominion Engine en Mutagen Spire op de duurste **zichtbare** plek (≥ $1.500); Stasis op de eigen aanvalsgolf; de Phase Gate via `pickTarget`.

### 26.A Onvoorwaardelijk: kennis vs. aannames + exploit-test
Dit deel start **zonder** startvoorwaarde. Waarom:
- **Het is een robuustheidsfout, geen ontwerpkeuze.** De speler kan de AI nu misleiden door een tweede basis te bouwen en de eerste te verkopen. Dat is een exploit, geen strategie die we willen belonen.
- **Het past bij §2 regel 5 (eerlijke AI).** Geheugen gebruikt alleen wat de AI zelf gezien heeft, plus openbare kaartinfo. Het maakt de AI eerlijker, niet sterker door valsspelen.
- **Het is binair te testen.** De AI vindt de basis binnen 3 min, of niet.
- **De metingen hebben het nodig.** Zolang de AI een verplaatste basis niet vindt, kunnen potjes eindeloos duren. Dat vervuilt de duur-, patstelling- en comebackcijfers van fase 23 en 24.

**Wel meten:** het verandert AI-gedrag en dus de AI-tegen-AI-cijfers. **Planning:** direct na de nulmeting van fase 20, parallel aan fase 21. Playtest-ronde 1 speelt nog op de AI van basis 1.3.0 (één build voor alle testers). Na 26.A volgt de **referentiemeting `ref-26a`**: dezelfde runs als de nulmeting (20.6) met de nieuwe AI, en `aiVersion` opgehoogd. Alle vergelijkingen in fase 23–27 gebruiken die AI-versie als arm A.

**Inhoud:**
- **Geheugen:** laatst gezien-positie en tijdstip van vijandelijke gebouwen en legers. Zag ze een gebouw vernietigd worden, dan valt het weg. Ziet ze het niet meer, dan blijft het als *aanname* met een leeftijd.
- **Doelkeuze** gebruikt aannames: eerst het jongste bekende gebouw, pas daarna zoeken.
- **Zoeken** in plaats van willekeurig rond startposities, in volgorde: plaatsen van recente gevechten → ore-velden → tech- en burgergebouwen → laatst bekende posities → de rest van de kaart, van dichtbij naar ver.
- **Eerlijkheidstest:** de soak-invariant "AI valsspeelt niet" blijft; er komt een test bij dat de AI nooit een positie gebruikt die ze niet gezien heeft (behalve openbare kaartinfo).
- **Exploit-test** (`src/game/tests/ai-intent.test.ts`): de speler bouwt een tweede basis, verkoopt de eerste en zet geen leger neer. De AI vindt de nieuwe basis binnen 3 min nadat de oude weg is.

### 26.B Voorwaardelijk: intenties
**Startvoorwaarde:**

| Bron | Activeert |
|---|---|
| Fase 21 | Testers beschrijven de AI als voorspelbaar ("komt steeds hetzelfde doen") of zonder plan; saaimomenten door een passieve AI |
| Fase 20 | AI-potjes lopen steeds hetzelfde (lage spreiding in tijd tot eerste aanval, doelwitten, samenstelling) |
| Fase 23 | Een gekozen economie vraagt dat de AI uitbreidt of denial toepast (meer dan de minimale regel E6) |

**Zonder dit bewijs:** vervalt 26.B. De AI houdt haar huidige golfmodel, plus 26.A.

**Stap 1: algemene intenties, zonder factiegewichten.** Nieuw in `AIState`: `intent`, herzien elke 60 s. Intenties sturen alleen bestaande functies (`planBuilding`, `planUnits`, `attack`, `defend`), geen nieuwe micro.

| Intentie | Wanneer gekozen (voorstel) | Gedrag |
|---|---|---|
| Economic pressure | Vijandelijke raffinaderij of uitbreiding bekend en kwetsbaar | Snelle groep richt zich op Haulers en raffinaderijen |
| Military pressure | Geschatte legerwaarde ≥ 1,2× die van de vijand (uit wat ze zag) | Aanvalsgolf op het dichtstbijzijnde bekende gebouw |
| Expansion | Eigen veld < 30% of vrij veld binnen bereik | Raffinaderij of Base Crawler bij het veld, met verdediging |
| Defensive | Legerwaarde ≤ 0,7× of de basis wordt aangevallen | Verdediging, leger thuis, repareren |
| Tech | Rijk veld en 3 min geen dreiging gezien | Tech Center, tech-eenheden, superwapen (binnen de regels van fase 24) |
| Air | Vijandelijke lucht gezien, of eigen luchtmacht sterker | AA bouwen of luchtmacht inzetten |
| Naval | Zeekaart en geen eigen vloot | Naval Yard en schepen |

Per niveau: Easy kiest willekeurig met een vaste intentie per 3 min; Normal volgt de regels; Hard volgt de regels en wisselt sneller. In dev-modus toont `window.__ai` de intentie; de telemetrie legt intenties vast.

**Stap 2: factievoorkeuren, pas na fase 21/22.** Gewichten per factie komen er alleen als:
- de factiezinnen in fase 22 zijn **vastgesteld**, en
- de telemetrie laat zien dat de AI-factie haar zin niet uitspeelt (bijv. Allied-AI gebruikt geen mobiliteit, Psi-AI neemt weinig over).

Het oude voorstel (Allied = expansion, Red Bloc = military, Psi = tech rush) is dus een **hypothese**, geen ontwerp. Psi = "tech rush" past bovendien slecht bij de voorgestelde kernzin (mind control).

### 26.C Interventiemenu (naast 26.A)

| # | Interventie | Hypothese | Metriek | Richting | Kosten / risico |
|---|---|---|---|---|---|
| A1 | Algemene intenties (stap 1) | AI voelt minder voorspelbaar | Spreiding AI-gedrag; playtest "had de AI een plan?" | ↑ | Middel; complexiteit, soak-test is de poort |
| A2 | Factiegewichten (stap 2) | AI speelt de factiezin uit | Gebruik kernmechaniek per factie | ↑ | Klein, maar alleen na 22 |
| A3 | AI gebruikt bestaande mechanieken: Dig-in (Riflemen), Arc Coil opladen, Infiltrator naar raffinaderij (vereist A1), Reclaimer voor overgenomen eenheden | Bestaande mechanieken komen in het spel voor | Gebruik per mechaniek | ↑ | Klein per stuk; alleen wat de schrapronde overleeft, één per iteratie |
| A4 | Splash gericht tegen klonten (= D2 uit fase 24) | Deathball wordt bestraft | Legerconcentratie | ↓ | Alleen als fase 24 het aantoont |

### Klaar als
- [ ] **26.A:** geheugen en zoekvolgorde werken; exploit-test en eerlijkheidstest groen; nieuwe referentiemeting vastgelegd.
- [ ] **26.B/C:** startvoorwaarde getoetst; bij start zijn intenties zichtbaar in telemetrie en komt elke intentie voor in de meetset.
- [ ] Balans per niveau: Hard wint ≥ 60% van Normal, Normal ≥ 60% van Easy.
- [ ] Factiebalans binnen 40–60% (winrate niet-spiegel, puntschatting, 20.2-G).

---

## Menu BL: balanswijzigingen na 1.3.0

### Onderzoeksvraag
**Welke balansproblemen blijven na balansronde 1 over, en welke merken spelers?**

Balansronde 1 (`plan/balans-plan.md`) wordt vóór fase 20 afgerond en vormt de basis. **Besluit opdrachtgever (2026-10-02):** de open punten van balansronde 1 (B4-criterium niet gehaald voor lucht, Lash Tank en Anvil; zeeband niet gehaald; Delirium Drone niet aangepast) worden niet meer in 1.3.0 opgelost, maar hier opgepakt (BL1–BL5), gemeten met de instrumenten van fase 20. Wat daarna nog aan cijfers verandert, is een interventie in de gezamenlijke meetrij (werkregel), met dezelfde regels als E, S/D, U en A: startvoorwaarde, hypothese, één primaire metriek, terugdraaien als het niet uitkomt.

### Startvoorwaarde
Een optie start alleen als **twee lagen** het probleem tonen: duelmatrix of scenario's, AI-meting, of playtest.

### Interventiemenu

| # | Interventie | Start als | Hypothese | Primaire metriek | Kosten / risico |
|---|---|---|---|---|---|
| BL1 | **Zeebalans Red Bloc** (cijfers van Flak Boat, Barracuda, Leviathan, Kraken) | Zeematrix (`nul-duels-zee`) toont Red Bloc-schepen onder 0,8 in hun rol, én de zee-winrate van Red Bloc ligt onder 40% | Red Bloc wint op zee even vaak | Winrate Red Bloc op zee (niet-spiegel) | Laag per getal; zeepotjes zijn een kleiner deel van de meetset (36) |
| BL2 | **Luchtafweer per factie betaalbaarder** (kosten of bereik van de goedkoopste AA-optie) | Duelmatrix: lucht ver boven 1,25 tegen grondlegers (nu rond 4), én scenario 4/7 laat zien dat $2.000 aan AA de aanval niet stopt, én testers of AI verliezen op lucht (verliesoorzaak SC met lucht) | Lucht houdt een rol, maar een gerichte AA-investering wint | Scenario 4a–c en 7 (winnaar, overgebleven waarde) | Lucht kan nutteloos worden; één factie per iteratie |
| BL3 | **Specialisten** (Nova, The Oracle, Mentalist, Toxin Sniper) | Fase 21, analyse punt 8: ≥ 3 testers bouwen ze niet of gebruiken hun kracht niet, en de AI-telemetrie bevestigt laag gebruik | Wordt gebouwd en effectief ingezet | Gebouwd + kracht gebruikt per potje (20.2-C/G) | Bandtests van `balance-scenarios.test.ts` bewaken dat ze niet weer te sterk worden |
| BL4 | **Uitschieters in de duelmatrix** (laatste meting `duels-b4`: Lash Tank 1,57, Anvil 1,40; lucht 3–4,5 valt onder BL2) | Buiten 0,8–1,25 in de eigen rol in `nul-duels`, én in AI-potjes een dominante eenheid (20.2-B) | Geen unit domineert een leger | Dominante eenheid (20.2-B) | Kleine stappen; elke wijziging raakt ook de factiebalans |
| BL5 | **Delirium Drone** (stond in balansronde 1 op de lijst om te versterken, maar is niet aangepast; gemiddeld 0,56) | Fase 22 houdt hem (niet geschrapt), én `nul-duels` bevestigt < 0,8 in zijn rol | Wordt een zinvolle keuze naast de Hivemind | Kosteneffectiviteit in eigen rol + gebruik in AI-potjes | Laag; vervalt als fase 22 hem uitzet |

### Klaar als
- [ ] Elke uitgevoerde BL-interventie heeft een eigen meting (duelmatrix + AI-meting) en is teruggedraaid als de hypothese niet uitkwam.
- [ ] De 17 bandtests van `balance-scenarios.test.ts` zijn groen, of een gewijzigde band heeft een vastgelegde reden.

---

## Samenvatting: wat onvoorwaardelijk blijft

| Onderdeel | Status | Reden |
|---|---|---|
| 26.A geheugen + exploit-test | **Onvoorwaardelijk** | Eerlijkheids-/robuustheidsfix; nodig voor betrouwbare metingen |
| 25 nabespreking, missies, eerste-keer-meldingen | Voorwaardelijk (U1–U3) | Geen simulatiewijziging, maar ook hier start alleen wat 21/22 aantoont |
| 23 economie, kaart, Base Crawler | Voorwaardelijk | Economy-only simulatie vóór elk besluit |
| 24 superwapens, deathball | Voorwaardelijk | Kernsignaal op voorsprong vóór het schot |
| 26.B intenties, factiegewichten | Voorwaardelijk | Algemeen eerst; factie pas na 21/22 |
| BL balans | Voorwaardelijk | Alleen als twee lagen een probleem tonen; na balansronde 1 |
| 25.4 touch | Bevroren | Tenzij playtest-ronde 2 het vraagt |

---

## Fase 27: Playtest-ronde 2, vergelijking en release 1.4

### 27.1 Playtest-ronde 2
- **Zelfde protocol** als ronde 1, met **minstens 10 nieuwe testers** (de criteria gelden voor hen) en daarnaast herhalers uit ronde 1 (apart gerapporteerd).
- Extra vraag: "Wat deed je in de midgame (5–15 min), en waarom?"
- Optioneel: 2–3 testers op een tablet, alleen als beslissing 6 daarom vraagt.

### 27.2 Vergelijking
`docs/metingen/vergelijking-1.3-1.4.md` zet naast elkaar:
- **AI-metingen in drie kolommen:** basis 1.3.0 (nulmeting) → `ref-26a` → 1.4 (eindmeting), voor alle metrieken uit 20.2, de scenario's en de duelmatrix uit 20.3. Zo staat het effect van de AI-fix los van de gameplaywijzigingen.
- **Effect van de AI-wissel op de playtest:** winrate tegen Normal in `nul-normal-medium` vs. dezelfde run op de AI van ronde 2. Ronde 2 draait op een andere AI dan `playtest-r1`; dat verschuift het aantal verloren potjes en comebacks.
- **Playtest:** de vijf dimensies uit 21.0 (retentie, agency, begrip, comeback-gevoel, fun-audit per fase) en het aantal vergeten mechanieken, per nieuwe tester; herhalers apart.

**Succescriteria voor 1.4**

**Eerlijk vooraf:** de streefwaarden hieronder zijn **voorlopig**. Zonder ronde 1 weten we niet waar we staan. Waar het kan, zijn ze relatief ten opzichte van ronde 1 (R1). Na ronde 1 vullen we de kolom "R1" in en zetten we de doelen vast. Daarna passen we ze niet meer aan, ook niet als ronde 2 tegenvalt.

**Vergelijkingsgroep.** Ronde 2 heeft minstens 10 nieuwe testers. De criteria hieronder gelden voor de **nieuwe testers**, want alleen die zijn vergelijkbaar met R1. Herhalers rapporteren we apart, per persoon (R1 → R2). Zij kennen het spel al, dus hun begrip en agency stijgen sowieso.

**Volgorde in ronde 2.** De nabespreking (25.2) toont straks zelf een verliesoorzaak. Vraag 2 wordt daarom gesteld **vóór** de tester het scorescherm ziet. Anders meten we of hij kan lezen, niet of hij het begreep.

| Dimensie | Meting | R1 | Doel ronde 2 (voorlopig) |
|---|---|---|---|
| Retentie (intentie) | "Nog een potje?", 1–5: per tester de mediaan over zijn potjes | *invullen* | Mediaan ≥ R1 + 1, én ≥ 2 testers per 10 meer met een 4 of 5 |
| Retentie (gedrag) | Testers die het vierde potje spelen | *invullen* | Meer dan in R1 (x van n) |
| Agency | "Keuzes deden ertoe", 1–5, alle potjes | *invullen* | Mediaan ≥ 4, of ≥ R1 + 1 |
| Begrip | Verloren potjes met code 1 of 2 (`verliesclassificatie.md`) | *invullen* | ≥ 7 van 10, én ≥ R1 + 2 per 10; minimaal 8 verloren potjes, anders onbeslist |
| Begrip (hoofdoorzaak) | Verloren potjes met code 2 | *invullen* | Stijgt |
| Begrip (zelfbeeld) | "Ja" op vraag 2 vs. correct gecodeerd | *invullen* | Geen doel; de kloof rapporteren |
| Fun-audit | Per fase: mediaan en aantal nullen | *invullen* | Geen fase met mediaan 0. Beide midgame-fases: mediaan ≥ 1 én aantal nullen ≤ R1 − 2 per 10 testers. Geen fase krijgt per 10 testers 2 of meer nullen extra t.o.v. R1 |
| Comeback-gevoel | Potjes met "ja" op vraag 4 | *invullen* | Stijgt, en in ≥ 1 op 3 potjes |
| Comeback (AI) | % potjes gewonnen na ≥ 40% achterstand (20.2) | nulmeting en `ref-26a` | ≥ 15% |
| Vergeten/onbegrepen mechanieken | Per tester | *invullen* | Halveert |
| Superwapens en deathball | Kernsignaal en deathball-metrieken (fase 24) | nulmeting en `ref-26a` | Doelgrenzen van fase 24; alleen als fase 24 gestart is |
| Factiebalans (AI) | 20.2-G | nulmeting en `ref-26a` | 40–60% winrate per factie in niet-spiegelpotjes (puntschatting), land en zee |
| Kosteneffectiviteit (duelmatrix) | 20.3 | `nul-duels` | Geen nieuwe unit buiten 0,8–1,25 in de eigen rol t.o.v. de nulmeting; de 17 bandtests groen |
| Tests | tsc, vitest, soak, e2e | — | Groen in 3 browsers |

**Hoe we "gehaald" lezen:**
- Een doel is gehaald als het getal het haalt **én** de verdeling geen nieuwe groep ontevreden testers laat zien (bijvoorbeeld meer enen en tweeën, ook als de mediaan stijgt).
- Valt een doel net onder of net boven de grens (binnen 1 tester), of zijn er te weinig waarnemingen (minder dan 8, of n < 15 bij AI-bakken), dan noemen we het **onbeslist**. We zeggen dan niet dat 1.4 het wel of niet verbeterd heeft.
- De drie zwaarste criteria zijn **begrip**, **fun-audit midgame** en **retentie (gedrag)**. Die toetsen precies waar 1.4 over gaat: uitbreiden in de midgame en snappen waarom je verloor.

### 27.3 Opruimen
- Eenheden en mechanieken die uitgezet bleven, worden **definitief verwijderd**: data, code, art, stemregels, tests en asset-register.
- Code die door het schrappen ongebruikt raakt, wordt verwijderd.

### 27.4 Documentatie
- `IRON-FRONT-ONTWERP.md` herschrijven:
  - Kernzin en factiezinnen vooraan.
  - Uitbreiden als kernmechaniek.
  - Ore-regels correct beschreven.
  - Bij elke keuze óf een spelreden óf een technische reden.
  - "Engineering" als apart hoofdstuk.
- CHANGELOG 1.4.0, README.

### Klaar als
- [ ] Elk criterium heeft een uitslag: **gehaald**, **niet gehaald** of **onbeslist**, volgens de regels hierboven, vastgelegd in `vergelijking-1.3-1.4.md`.
- [ ] **Releaseregel.** 1.4.0 wordt uitgebracht als (a) alle tests groen zijn, (b) geen criterium aantoonbaar achteruitgaat ten opzichte van R1 of `ref-26a` (onbeslist telt niet als achteruit), en (c) minstens 2 van de 3 zwaarste criteria (begrip, fun-audit midgame, retentie gedrag) gehaald zijn. Haalt 1.4 dit niet, dan worden de gameplay-interventies zonder aantoonbaar effect teruggedraaid. De meetinstrumenten, 26.A en de uitslag blijven en gaan als 1.4.0 uit, met een eerlijk rapport.
- [ ] Versie 1.4.0.

---

## 3. Wat níet in 1.4 zit, en waarom

| Niet | Waarom |
|---|---|
| Nieuwe eenheden, gebouwen, kaarten, superwapens | Feature freeze; we hebben al te veel, niet te weinig |
| Campagne / verhaalmissies | Groot, en lost geen kernprobleem op. De tutorialmissies (4, optioneel 5) zijn bewust klein en gebruiken bestaande kaarttypes |
| Multiplayer, teams, diplomatie | Raakt alle systemen; pas zinvol als de kern staat |
| Upkeep, research tree, commander-systeem | Nieuwe systemen = nieuwe complexiteit |
| Nieuwe art-systemen | Bestaande assets beter maken mag; nieuwe pijplijnen niet |
| Uitbreiding van touch | Pas als playtests het vragen (beslissing 6) |
| Achievements, ranking, progression, skins | Geen bijdrage aan "is het leuk om te spelen" |

---

## 4. Beslissingen voor de opdrachtgever

**Genomen op 2026-10-02:** 5, 6, 17, 18 en 21 volgens voorstel. 20: eerst **geen git** (fallback met broncode-hash); **op 2026-10-06 toch een repository** (`github.com/fvdh/IronFront`). Sindsdien is `build` = versie + commit-hash, en een playtestbuild een tag. 19: fase 20 wordt nu gebouwd; de nulmeting draait pas na speeltest B5 en de release 1.3.0.

| # | Beslissing | Voorstel | Wanneer nodig |
|---|---|---|---|
| 1 | Kernzin van het spel | C als fundament, A als strategische as, B behouden (§1) | In fase 22 |
| 2 | Factiezinnen | Zie §1 | In fase 22 |
| 3 | Psi-richting | Mind control als dominante mechaniek; Psi = "gevorderd" | Fase 22 |
| 4 | Schraplijst | Uitzetlijst (22.3) vastgesteld na ronde 1; definitief verwijderen na ronde 2 (27.3) | Fase 22 |
| 5 | Feature freeze tot 1.4 | Ja, zoals §2; geldt vanaf 1.3.0 (de mechanieken van balansronde 1 horen bij de basis) | Nu |
| 6 | Touch | Bevriezen in 1.4; alleen werken als tablettesters het vragen | Nu |
| 7 | Live menu-achtergrond | Houden als sfeer, **niet** omdat het laden versnelt; beoordelen in playtest ("maakt dit je nieuwsgierig?") | Fase 21 |
| 8 | Score en rang | Secundair op het nabesprekingsscherm; niet verwijderen | Fase 25 |
| 9 | Bonuskratten | Kandidaat "standaard uit"; besluit met de schraplijst | Fase 22 |
| 10 | Juridische toets op IP/positionering | Laten doen vóór een publieke release; "namen en assets veranderd" is geen juridisch oordeel | Vóór publicatie, los van 1.4 |
| 11 | Werving testers en beoordelaars | Wie werft, hoeveel tijd, eventuele vergoeding; plus twee (en een reserve-) beoordelaars voor het blind coderen, van wie hooguit één ontwikkelaar | Vóór fase 21 |
| 12 | Definitie van "leuk" en de verliesclassificatie | Akkoord op 21.0, `fun-pass-fun-audit.md` en `fun-pass-verliesclassificatie.md`; daarna bevroren | Vóór tester 1 |
| 13 | Streefwaarden fase 27 | Invullen met de uitkomst van ronde 1 en bevriezen | Na fase 21, vóór fase 23 |
| 14 | 26.A (AI-geheugen, exploit-fix) onvoorwaardelijk | Ja: eerlijkheids- en robuustheidsfix, nodig voor betrouwbare metingen | Na de nulmeting |
| 15 | Per fase 23–26: start, krimp of vervalt, en de volgorde van de gezamenlijke meetrij | Volgens de startvoorwaarden; besluit vastgelegd in `docs/metingen/` | Na fase 22 |
| 16 | Volledige kruising in `balance.test.ts` (meetset 117 potjes plus `nul-normal-medium`) | Ja | Fase 20 |
| 17 | Releaseregel 1.4 | Zoals in fase 27, "Klaar als" | Nu |
| 18 | Versienummering | Balansronde 1 gaat uit als **1.3.0**; de Fun Pass wordt **1.4**, met nulmeting op basis 1.3.0. Alternatief: de balansronde gaat op in een Fun Pass 1.3; dan is de nulmeting nog steeds de huidige code, niet v1.2 | Nu |
| 19 | Speeltest B5 van het balansplan | Afronden **vóór** de nulmeting van fase 20. Wijzigingen daaruit komen vóór de nulmeting; anders wordt de nulmeting opnieuw gedaan. **Besloten (2026-10-02):** de open punten van balansronde 1 gaan naar menu BL, niet in 1.3.0 | Vóór fase 20 |
| 20 | Versiebeheer | **Aanbevolen:** git-repository aanmaken vóór fase 20 (`build` = commit-hash, `playtest-r1` = tag). Fallback: `build` = versie + hash van `dist/`, met een gearchiveerde kopie per playtestbuild (20.4) | Vóór fase 20 |
| 21 | Definitie van factiebalans | Winrate per factie in niet-spiegelpotjes, band 40–60% (20.2-G). Het aandeel overwinningen uit het balansplan (27–40%) wordt ernaast gerapporteerd, maar beslist niet | Nu |

---

## 5. Risico's

| Risico | Gevolg | Maatregel |
|---|---|---|
| Te weinig testers | Conclusies uit de playtest zijn wankel | Minimaal 5 in ronde 1 en 10 nieuwe in ronde 2; minder dan 8 waarnemingen per criterium = onbeslist; metingen uit 20.2 wegen dan zwaarder |
| AI-wissel tussen ronde 1 en 2 | Winrate, aantal verloren potjes en comebacks verschuiven | `build` en `aiVersion` in de export, vaste build `playtest-r1`, effect van de AI-wissel apart in 27.2 |
| Geen versiebeheer | `build` niet herleidbaar; een playtestbuild is niet terug te halen | Git vóór fase 20 (beslissing 20); anders bundel-hash en gearchiveerde `dist/` per playtestbuild |
| De basis schuift nog | De speeltest B5 of een late balansfix verandert de code na de nulmeting; alle vergelijkingen kloppen dan niet meer | B5 vóór fase 20 (beslissing 19); elke latere cijferwijziging is een BL-interventie met eigen meting |
| Twee maten voor factiebalans | Het balansplan (27–40%, aandeel overwinningen) en dit plan (40–60%, winrate) lijken elkaar tegen te spreken | Eén beslismaat (beslissing 21); beide maten naast elkaar in het rapport |
| Kleine aantallen in AI-bakken | Toevallige uitschieters bij superwapens | n < 15 per bak = onbeslist; factiebalans met Wilson-interval |
| Fun-audit gekleurd door de tijdlijn | Een zichtbare achterstand drukt de score | Eerst zonder tijdlijn scoren; de eerste score telt |
| De AI speelt een gewijzigd spel anders dan mensen | AI-balans zegt weinig (feedback §6) | Drie lagen: AI-meting (20.2), duelmatrix en scenario's (20.3), mensen (21/27). Conclusies alleen als ten minste twee lagen het eens zijn |
| De ore-wijziging maakt potjes korter of geeft meer patstellingen | Spelritme verandert sterk | Eerst de economy-only simulatie (≥ 100 potjes per arm); de varianten E1–E4 zijn getallen in `config.ts` |
| De AI breidt niet uit | De economy-only meting meet uithongering in plaats van uitbreiden | Eerst een minimale, neutrale uitbreidingsregel (E6) in beide armen, apart gemeten |
| Grenzen worden achteraf verschoven | Je bewijst wat je al dacht | Hypothese, metriek en grens staan in `docs/metingen/` vóór de meting; streefwaarden fase 27 bevroren vóór fase 23 |
| Begrip wordt subjectief beoordeeld | De ontwikkelaar bepaalt achteraf wat "correct" was | Verliesclassificatie met script, blind coderen door twee beoordelaars, derde bij onenigheid |
| Testers lezen de oorzaak af van de nabespreking | Begrip in ronde 2 lijkt beter dan het is | De begripsvraag komt vóór het scorescherm en vóór de tijdlijn |
| Schrappen voelt als verlies van werk | Weerstand om echt te schrappen | Eerst uitzetten (omkeerbaar); definitief pas na ronde 2 met data |
| Intentie-AI wordt complex | Meer bugs, trager | Alleen bij bewijs (26.B); eerst algemene intenties zonder factiegewichten; intenties sturen alleen bestaande functies. Soak-test blijft de poort |
| Telemetrie beïnvloedt de simulatie | Saves en determinisme kapot | Telemetrie is alleen-lezen op de staat; test dat potjes met en zonder telemetrie gelijk eindigen |

---

## Bijlage A: Feedbackpunten → plan

| # | Feedbackpunt | Waar in dit plan | Opgevolgd? |
|---|---|---|---|
| 1 | "Greatest hits"; elke unit moet de factiezin versterken | §1, fase 22.1 | Ja |
| 2 | Psi te complex (opties A/B/C) | Fase 22.3 + 22.4 (optie C + label "gevorderd" uit A) | Ja |
| 3 | Superwapens te bepalend; meten | Fase 20.2-D, fase 24 | Ja, met causale meting (zie bijlage B) |
| 4 | Oneindige ore haalt resource denial weg | Fase 23 (feiten, economy-only simulatie, E1–E4) | Ja, voorwaardelijk; feiten uit de code gecorrigeerd |
| 5 | Bouwradius en uitbreiden als kernmechaniek | §1 (A), fase 23 (E5–E8), missie 4 | Ja, voorwaardelijk |
| 6 | AI-balans ≠ spelbalans; drie lagen | Fase 20.2, 20.3 (duelmatrix + scenario's uit balansronde 1), 21; §5 | Ja |
| 7 | Te veel "gotcha"-mechanieken | Fase 22.2 (budget), 22.3, 25.3 | Ja |
| 8 | Genre-spiergeheugen vs. eigen identiteit; IP | §1, beslissing 10 | Deels: identiteit via kernzin; juridisch buiten scope |
| 9 | Eén kernzin kiezen | §1 | Ja |
| 10 | Touch als apart schema, met minder | Fase 25.4, beslissing 6 | Ja, bevroren tot playtest het vraagt |
| 11 | Tutorial op basis van problemen | Fase 25.1 | Ja |
| 12 | Score voelt aangeplakt | Fase 25.2, beslissing 8 | Ja |
| 13 | "Waarom verloor ik?" | Fase 25.2 | Ja |
| 14 | AI zonder intenties | Fase 26.B | Ja, voorwaardelijk |
| 15 | AI-kennis vs. aannames; exploit | Fase 26.A | Ja, onvoorwaardelijk |
| 16 | Techniek en ontwerp lopen door elkaar | §2 regel 4, beslissing 7, fase 27.4 | Ja |
| 17 | Geen nieuwe art-systemen | §2, §3 | Ja |
| 18 | Wat nu niet toevoegen | §2, §3 | Ja |
| 19 | "Fun audit" over zes fases van een potje | `fun-pass-fun-audit.md`, 20.0 (fasegrenzen), 20.2, 21, 27 | Ja |
| 20 | Playtest met 10 testers en 5 vragen | Fase 21 (7 vragen na elk potje), 27 | Ja |
| 21 | Prioriteitenlijst P0/P1/P2 | Volgorde fases 20–27 volgt P0 → P1; P2 = §3 en beslissing 6 | Ja |
| 22 | Asymmetrie niet veranderen | §1 (B), §2 regel 5 | Ja |

**Waar het plan afwijkt van de feedback:**
- **AI-zoekgedrag (§15).** De AI zoekt nu al eerst rond de startposities en daarna over de hele kaart, dus niet alleen op vaste plekken. De uitbuiting blijft wel mogelijk, en daarom staat 26.A in het plan.
- **Superwapens (§3).** We passen niets aan zolang de meting geen probleem aantoont (startvoorwaarde van fase 24, op basis van de voorsprong vóór het schot). De zorg is terecht, maar zonder data zou ingrijpen gokken zijn.
- **Deathball (§19.5).** Geen upkeep-systeem, want dat breekt de feature freeze en het genre-spiergeheugen. We gebruiken eerst bestaande middelen (verdediging, splash, AI-inzet).

---

## Bijlage B: Review van plan v1 → plan v2

| # | Reviewpunt | Waar in dit plan |
|---|---|---|
| 1 | Fase 23–26 te voorschrijvend; onderscheid "vermoeden" en "doen" | §0 (rolverdeling), §2 regel 2, "Fases 23–26: vaste opbouw": onderzoeksvraag, startvoorwaarde, interventiemenu, max. één interventie per iteratie |
| 2 | Keuzedichtheid meten | 20.1 (steekproef per wachtrij: `keuze-idle` vs. `geldgebrek`), 20.2-B |
| 3 | "Leuk" definiëren vóór fase 21 (retentie, agency, begrip, comeback-gevoel) | 21.0, vragen na elk potje, gedragsmeting met het vierde potje |
| 4 | Objectief "correct begrijpen waarom ik verloor" | `fun-pass-verliesclassificatie.md`: 8 oorzaken + X, script, blind coderen; zelfde regels voor 25.2 |
| 5 | Tijd tot eerste betekenisvolle keuze | 20.2-C |
| 6 | Economie = herontwerp; eerst economy-only simulatie | 20.5 (harnas), fase 23 (eis vóór besluit, E6 eerst) |
| 7 | Superwapen-beslisregel causaal maken (voorsprong vóór het schot) | 20.2-D (incl. vergelijking met de run zonder superwapens), fase 24 |
| 8 | Legerconcentratie bij deathball | 20.2-E, fase 24 |
| 9 | Tutorialmissie 3 te veel concepten | 25.1: één concept per missie, patroon X → faalt → waarom → Y; oude missie 3 gesplitst in 3–5 |
| 10 | AI-intenties eerst algemeen, factiegewichten pas na data | 26.B stap 1 en 2 |
| 11 | Expliciete fun-audit | `fun-pass-fun-audit.md`; vraag 6 na elk potje |
| 12 | Regel "geen vooraf gekozen oplossing is verplicht" | §2 regel 2 |
| 13 | Niet alvast aan gameplay beginnen | Volgorde §0; enige uitzondering 26.A (beslissing 14) |

**Waar dit plan bewust verder gaat dan de review:**
- **26.A (AI-geheugen) is onvoorwaardelijk.** De exploit is een fout en geen ontwerpvraag. Zonder deze fix kunnen potjes in de metingen eindeloos duren.
- **Een minimale AI-uitbreidingsregel (E6) komt vóór de economy-only simulatie.** De code laat zien dat de AI nu nooit uitbreidt, dus zonder deze regel meet de simulatie het verkeerde.
- **Feiten over de ore-aangroei zijn gecorrigeerd** ("~40 credits/s per veld" was een bovengrens).

### Review op v2 → v3

| Categorie | Wat veranderde |
|---|---|
| A. Dekking | 26.A als expliciete uitzondering in §0; §1 als hypothese; fase 25 met startvoorwaarde en menu U1–U3; één kernsignaal voor superwapens; vier dimensies plus fun-audit; tutorialopstellingen zijn geen nieuwe kaarten |
| B. Consistentie | Eén definitie van de fases van een potje (20.0); bevriesmomenten in §2 regel 6; drempels van de nabespreking alleen in de verliesclassificatie; bakken alleen in 20.2-D; verwijzingen in bijlage A, beslissingen 1, 2, 4 en 9 en de paden (`src/game/tests/`) rechtgezet |
| C. Feiten uit de code | Leech Drone brandt al na 20 s op; superwapen-oorzaak uit de bron (Hammer, Storm, Stasis); nieuw event `mutated` voor de Mutagen Spire; volledige kruising factie × kaart in de balansopzet; Easy-AI bouwt geen superwapens; richtregels van `powers()`; plaatsing van raffinaderijen; rolvolgorde (anti-pantser vóór AA) |
| D. Toetsbaarheid | Releaseregel in fase 27; doelgrenzen in fase 24; missietest met gescripte X- en Y-strategie; keuze-idle per wachtrij; productie-uptime gedefinieerd; counterrol per klasse; vaste lijst factiemechanieken; ijkmethode, kantelpunt en aanslagmoment in de verliesclassificatie; hash zonder telemetrie; scenario's uitgeschreven; telvoorschrift complexiteitsbudget |
| E. Methode | Eén meetrij voor 23–26; `ref-26a` als arm A en drie kolommen in 27; `nul-normal-medium` voor mensdata en ijking; `build`, `aiVersion` en tag `playtest-r1`; bakken op totale waarde; minimum n; startvoorwaarde 23 alleen op bewijs; classificatie wijzigt niet meer in 1.3; één primaire metriek per iteratie; 10 nieuwe testers in ronde 2; scorescherm en tijdlijn pas na de vragen |

### Afstemming op balansplan (v3 → v4)

| # | Punt | Wat veranderde |
|---|---|---|
| 1 | Basislijn | Nulmeting op basis 1.3.0 (v1.2.0 + balansronde 1); "Feiten uit de code" bijgewerkt; v1.2-cijfers alleen als historie |
| 2 | Versienummering | Fun Pass wordt 1.4; titel, succescriteria, releaseregel, CHANGELOG en `vergelijking-1.3-1.4.md` aangepast (beslissing 18) |
| 3 | Geen git | `build` en `playtest-r1` met git of met bundel-hash en gearchiveerde `dist/` (20.4, beslissing 20, risico) |
| 4 | Feiten | Leech Drone (Colossus overleeft), Hivemind (houdt 4), mind control laadt op, aparte Oracle-gebouwstraal, drones immuun, C4-tijdbom, superwapen-gebouwen 1500 hp; in 22.2, 24, 25.3 en `FACTION_MECHANICS` |
| 5 | Net versterkte units | Oordeel in de schrapronde alleen op data na de balansronde (22.3); Delirium Drone gemeten zwak maar niet aangepast |
| 6 | Meetinstrumenten | 20.3 bouwt op `balance-lab.ts`, `duels.test.ts` en `balance-scenarios.test.ts`; geen losse `scenarios.test.ts`; zeematrix en duelmatrix in de nulmeting; kolom kosteneffectiviteit in `roster.md` |
| 7 | Factiebalans | Eén beslismaat: winrate niet-spiegel, 40–60%; balansplan-maat ernaast (20.2-G, beslissing 21) |
| 8 | Verdere balanswijzigingen | Menu BL (zee, luchtafweer, specialisten, uitschieters) in de gezamenlijke meetrij; §2 regel 2 |
| 9 | Speeltest B5 | Vóór fase 20 (beslissing 19); helden en specialisten als analysepunt 8 in fase 21 |
| 10 | Feature freeze | Mechanieken van balansronde 1 horen bij de basis; freeze vanaf 1.3.0 (§2) |
| 11 | Nieuwe events | `mindControlStart` / `mindControlBroken` om het nieuwe tegenspel te meten (20.1) |
