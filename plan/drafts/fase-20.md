## Fase 20: Meetinstrumenten en nulmeting

**Doel:** van "werkt het?" naar "hoe verloopt een potje, en heeft de speler iets te kiezen?". Alles wat fases 21–27 moeten meten, wordt hier gebouwd en één keer gemeten op v1.2.0. Dat is de nulmeting.

**Principe:** fase 20 bepaalt wát er daarna gebeurt. Latere fases lossen alleen problemen op die deze metingen aantonen. Fase 20 bevat dus **geen gameplaywijziging**: alleen instrumenten, een schakelaar voor de ore-regels (20.5) en de nulmeting.

### 20.0 Uitgangspunten
- **Alleen-lezen.** Telemetrie leest de spelstand en schrijft alleen naar `s.telemetry`. De simulatie leest `s.telemetry` nooit. Geen `nextRandom`, geen `Date`.
- **Geen grenswaarden vooraf.** De nulmeting levert basiswaarden en spreiding. Grenzen worden pas daarna gezet (fase 22, 23, 24). Waar dit plan een getal in een definitie noemt (venster, straal), is dat een **meetparameter** in `TELEMETRY` (config), geen doel.
- **Mens en AI apart.** Elke metriek wordt per speler berekend met de vlag `ai`. Rapporten tonen mens en AI nooit als één gemiddelde.
- **Gedeelde begrippen:**

| Begrip | Definitie |
|---|---|
| Speler | Elke `Player` zonder `neutral`. Burgers tellen nergens mee. |
| Legerwaarde | Som van `cost` van levende eenheden met een wapen, zonder harvesters en zonder eenheden met `inside` (in transport). Overgenomen eenheden tellen bij de huidige eigenaar. |
| Gebouwwaarde | Som van `cost × hp/maxHp` van eigen gebouwen met `built = 1`, zonder muren en bruggen. |
| Veld | Een 8-verbonden groep ore-tegels op tick 0 (incl. tegels binnen 2 van een mine). Vast per potje, berekend bij de eerste telemetrie-tick. Startveld = het veld het dichtst bij `startX/startY`. |
| Gevecht | Cluster van doden (eenheden en gebouwen) binnen 8 tegels en 30 s van elkaar (single-linkage). |
| Fases van een potje | Opening 0–5 min, midgame 5–15, lategame 15–30, einde = laatste 3 min (zelfde indeling als `fun-pass-fun-audit.md`). |
| Snapshot | Elke 10 s (300 ticks), per speler. |
| Uitgeschakeld | `player.defeated` wordt `true` (via `checkVictory`). |

### 20.1 Telemetrie-infrastructuur
**Probleem in de code:** gebeurtenissen staan in `s.rt.events`. Dat is runtime (niet in saves) en wordt elk frame geleegd door `Game.ts` (`splice(0)`) of door tests (`length = 0`); `balance.test.ts` leegt hem nooit. Achteraf uitlezen is dus onbetrouwbaar.

**Oplossing:** één helper `emit(s, ev)` in `core/events.ts` die `s.rt.events.push(ev)` doet én `telemetryOnEvent(s, ev)` aanroept. De 28 `rt.events.push`-plekken (sim, production, orders, abilities, bridges, economy, crates, powers, combat) gaan mechanisch over op `emit`. Aan het eind van `tick()` draait `telemetryTick(s)` voor snapshots en steekproeven.

**Uitbreidingen op bestaande events** (alleen extra velden; bestaande lezers blijven werken):

| Event | Nieuw veld | Waarom |
|---|---|---|
| `death` | `by` (speler die de klap gaf), `cost`, `cause: 'weapon' \| 'superweapon' \| 'hero' \| 'mc' \| 'hazard' \| 'self'` | Wie doodde wat, en waarmee. `damage()` krijgt een optionele parameter `cause`; `powers.ts` geeft `'superweapon'` mee. |
| `underAttack` | `by` | Eerste contact, eerste aanval op economie. Zelfde throttle (150 ticks per doelwit). |

**Nieuwe events:**

| Event | Waar | Inhoud |
|---|---|---|
| `defeated` | `checkVictory` in `sim.ts` | `owner` |
| `enqueued` | `enqueue()` in `production.ts` | `owner`, `def` |
| `ability` | `abilities.ts` bij gebruik | `owner`, `def`, `ability` |

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
| Keuze-idle | % van de seconden met minstens één wachtrij in `keuze-idle`, per fase van het potje. Los daarvan: % `geldgebrek` en `arm-idle`. Zo is "geen geld" te scheiden van "niets gekozen". |
| Ongebruikt geld | Gemiddelde `credits` over seconden met minstens één `keuze-idle`-wachtrij, en het aantal credit-seconden daarin. |
| Productieopties | Per snapshot: aantal `def`s in `catalog()` zonder `missingRequirements` en met `capLeft > 0`, per categorie. Plus: aantal verschillende `def`s besteld in de laatste 2 min (gebruikte breedte). |
| Tijd zonder beslissing | Gaten tussen opeenvolgende betekenisvolle beslissingen: langste gat, mediaan gat, en % speeltijd in gaten ≥ `TELEMETRY.quietGap` (start 30 s). |
| Dominante eenheid | Per snapshot: aandeel van de grootste `def` in de legerwaarde. Rapport: tijdgewogen gemiddelde en % tijd boven 50%. |
| Planwissels | Besteding per 60 s-venster verdeeld over rollen (zie onder). Wissel = L1-afstand tussen de genormaliseerde verdeling van twee opeenvolgende vensters ≥ `TELEMETRY.planShift` (start 0,5). Aantal per potje en per fase. |

**Betekenisvolle beslissing** = een `logDecision` van soort: nieuw `def` in een wachtrij (niet hetzelfde als het vorige item in die wachtrij), gebouw plaatsen, aanval/verplaatsing van ≥ 1 gewapende eenheid naar een punt ≥ 6 tegels van haar huidige positie, ability, superwapen, verkopen, overname-opdracht. Herhaalde klikken binnen 2 s op hetzelfde doel tellen één keer.
- *Mens:* invoercommando uit `Game.ts`.
- *AI:* actie uit `ai.ts`. De AI denkt elke 30–60 ticks; haar gaten zeggen iets over het AI-script, niet over het spel. Daarom zijn B-metrieken voor AI **diagnose**, en voor mensen (fase 21) het eigenlijke signaal.
- *Let op:* de AI houdt bewust een geldreserve aan (`planUnits`, `reserve`). Dat telt als `keuze-idle`. Het rapport vermeldt dit naast de AI-cijfers.

**Rollen** (afgeleid uit data, geen handwerk): `AA` als `weapon.aa`; `anti-pantser` als `versus.heavy ≥ versus.none`; anders `anti-infanterie`; plus `economie` (harvester, refinery), `verdediging` (gebouw met wapen), `tech` (`lab` en gebouwen die hem vereisen), `superwapen`, `overig`.

**C. Tijd tot de eerste betekenisvolle beslissing** (nieuw), per speler, in minuten:

| Moment | Definitie |
|---|---|
| Eerste uitbreiding | Eerste refinery of CY met `built = 1` die dichter bij een ander veld ligt dan bij het startveld |
| Eerste tech-keuze | Eerste `enqueued` van `lab`, of van een `def` die `lab` direct of indirect vereist, of eerste overname van een tech-gebouw |
| Eerste aanval op economie | Eerste `underAttack`/`death` met `by` = deze speler op een vijandelijke harvester of refinery |
| Eerste defensieve reactie | Na de eerste vijandelijke `underAttack` op eigen gebouw of harvester: eerste beslissing binnen 60 s die een gewapende eenheid naar ≤ 8 tegels van die plek stuurt, een verdedigingsgebouw bestelt of repareert. Rapport: tijdstip én reactietijd. Geen reactie = leeg. |
| Eerste counter-productie | Eerste bestelling van een eenheid waarvan de rol past bij de klasse die op dat moment het grootste deel van de *geziene* vijandelijke legerwaarde vormt (`visible`), terwijl die rol in de 60 s ervoor niet besteld werd |
| Eerste factiemechaniek | Eerste event uit `FACTION_MECHANICS` in `telemetry.ts`. Voorstel: Psi = `mindControl`; Red Bloc = Leech Drone-treffer of Arc Coil-opladen; Allied = teleport van de Phase Trooper of camouflage van de Shroud Tank. Waar nog geen event voor bestaat, komt er een `ability`-event bij. De definitieve lijst staat in het rapport. |
| Eerste strategische keuze | Minimum van de vijf momenten hierboven, zonder defensieve reactie |

Doel: kunnen zeggen *"in 1.2 duurde het gemiddeld X min tot de eerste strategische keuze"*, apart voor AI en mens.

**D. Superwapens, causaal** (nieuw)

| Metriek | Definitie |
|---|---|
| Lead before superweapon | Bij het eerste `superweapon`/`fired` per potje: verhouding schutter : tegenstander in legerwaarde, gebouwwaarde en inkomen (laatste 2 min), uit de laatste snapshot vóór het schot |
| Klasse | `voor` (legerwaarde ≥ 1,25×), `gelijk` (0,8–1,25×), `achter` (≤ 0,8×). Zelfde definitie van "~gelijk" als in de verliesclassificatie. Dit zijn rapportagebakken, geen grens. |
| Na het schot | Per klasse: winrate van de schutter; % potjes waarin de tegenstander binnen 90 s uitgeschakeld is; verloren waarde van de tegenstander in de 90 s na het schot, en het deel daarvan met `cause = 'superweapon'` |
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
| Inkomen | Credits per minuut uit `income` (plus `stolen`, `bonus` apart), per minuut van het potje |
| Besteed | Totaal besteed aan productie per minuut |
| Velden | Aantal velden met een eigen refinery binnen 8 tegels; per veld het restant (% van tick 0) over de tijd; eerste moment < 25% |
| Uitputting | % potjes waarin het startveld ooit < 25% zat, en wanneer |
| Uitbreiding | % potjes met een tweede CY; tijd tot de tweede CY; tijd tot de eerste uitbreiding (C); winrate met vs. zonder |
| Patstelling | Potje bereikt 30 min zonder winnaar |

**G. Gebruik en balans**
- Factie-winrate met 95%-betrouwbaarheidsinterval (Wilson).
- Per eenheid: gebouwd, kills, verloren, kosten-efficiëntie (`cost` van wat ze doodde / eigen `cost`), en % dat ≥ 60 s overleeft.

### 20.3 Vaste gevechtsscenario's
Uitbreiding van het bestaande `tests/balance-lab.ts` (lege arena, `run()`), geen nieuwe infrastructuur. Nieuw `tests/scenarios.test.ts` met de zeven scenario's uit het oude plan (Warden vs. Anvil, Rocket+Rifle vs. Colossus, Mentalist+Lash vs. Draftee, Kestrel vs. AA, Picket vs. kust, $10.000-aanval vs. $5.000 verdediging per factie, Thunderhead vs. elke AA). Per scenario: winnaar, overgebleven waarde, duur, TTK. Geen pass/fail maar een **regressierapport** in `docs/metingen/`: een wijziging die een scenario omdraait moet bewust zijn. `balance-scenarios.test.ts` (bestaande banden) blijft ongewijzigd.

### 20.4 Telemetrie-export voor mensen
- Knop "Export match data" op het scorescherm: downloadt `s.telemetry` plus `settings` als JSON.
- Alleen lokaal; er wordt niets verstuurd. Geen persoonsgegevens, alleen de spelstand.
- Zelfde formaat als de AI-runs, zodat `tests/meting.ts` (20.6) beide leest. Nodig voor fase 21.

### 20.5 Harnas voor economy-only vergelijking
Fase 23 moet de economie los kunnen meten: 1.2-economie vs. nieuwe economie, **zonder andere wijzigingen**. Fase 20 levert het harnas, fase 23 de nieuwe regels.
- Nieuw veld `settings.oreRules?: 'v12' | 'v13'` (ontbreekt = `'v12'`). Het staat in de settings, dus in saves en in de JSON.
- `regrowOre` in `economy.ts` kiest op `oreRules`. In fase 20 bestaat alleen `'v12'` (de huidige code, ongewijzigd verplaatst naar `regrowOreV12`). `'v13'` gooit tot fase 23 een duidelijke fout.
- Env-var `BALANCE_ORE=v12|v13` in `balance.test.ts`. Mapgen, AI en alle andere regels blijven gelijk.
- Vergelijking: `COMPARE=a.json,b.json` maakt een rapport met per metriek beide waarden, het verschil en een 95%-interval (bootstrap over potjes, vaste seed).
- **Meetset per variant:** 108 potjes (81 land + 27 zee), Hard vs. Hard, zelfde seeds.
- **Metrieken:** inkomen per minuut, besteed per minuut, tijd tot eerste uitbreiding, duur, uitputting van velden, comeback, patstellingen, en `arm-idle`-tijd (verhongeren).
- **Kanttekening uit de code:** de AI bouwt alleen een Base Crawler als ze geen CY meer heeft (`crawlers()` in `ai.ts`) en extra refineries alleen in de eigen basis. Een economy-only run meet dus het effect op een AI die *niet* uitbreidt. Daarom eist fase 23 eerst een minimale AI-uitbreidingsregel (optie E6) die in **beide** armen draait. Fase 20 levert alleen het harnas; de nulmeting met `v12` vermeldt deze beperking.

### 20.6 Rapport en nulmeting
- Nieuw `tests/meting.ts`: pure functies van telemetrie naar metrieken (A–G). Getest met een opgebouwde telemetrie in `tests/telemetry.test.ts`.
- `balance.test.ts` krijgt `BALANCE_REPORT=<label>`: schrijft `docs/metingen/<datum>-<label>.md` (samenvatting) en `.json` (alle metrieken per potje, plus de settings). Ook `BALANCE_SEED`-reeksen om runs te splitsen en parallel te draaien.
- **Nulmeting v1.2.0:**

| Run | Instellingen |
|---|---|
| `nul-land` | 81 potjes (3 seeds × 27), plains/rivers/highlands, Hard vs. Hard |
| `nul-zee` | 27 potjes, coast/islands |
| `nul-nosw` | Als land en zee, `BALANCE_NOSW=1` (controle voor 20.2-D) |
| `nul-ore-v12` | 108 potjes met `BALANCE_ORE=v12`: moet identiek zijn aan `nul-land` + `nul-zee` (bewijs dat het harnas neutraal is) |
| `nul-scenarios` | 20.3 |

**Alarmbellen** (het rapport zet ze bovenaan; de grens volgt na de nulmeting):
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
| `src/game/tests/meting.ts`, `telemetry.test.ts`, `scenarios.test.ts`, `verlies.ts` (nieuw) | Analyse, unit-tests, scenario's, verliesclassificatie |
| `tools/tijdlijn.html` (nieuw) | Tijdlijnweergave van een export |
| `docs/metingen/` (nieuw) | Rapporten en JSON van de nulmeting |

### Klaar als
- [ ] Nulmeting v1.2.0 staat in `docs/metingen/`: land, zee, zonder superwapens, ore-v12, scenario's; elk als `.md` en `.json`.
- [ ] Het rapport noemt per metriek uit 20.2 de basiswaarde (mediaan en spreiding), apart voor AI; er staan geen verzonnen grenzen in.
- [ ] Determinisme: een test speelt hetzelfde potje met en zonder telemetrie (en met `oreRules` leeg vs. `'v12'`) en vergelijkt winnaar, tick en een hash van de eindstand. Identiek.
- [ ] Soak-test en alle bestaande tests groen.
- [ ] Een save met telemetrie laadt en loopt gelijk door; een oude save zonder telemetrie laadt ook.
- [ ] `tests/telemetry.test.ts`: elke metriek uit A–G heeft een test op opgebouwde telemetrie (slaat aan en slaat níet aan).
- [ ] Een handmatig gespeeld potje levert via "Export match data" een JSON die `tests/meting.ts` zonder fouten leest, inclusief beslissingen van de mens.
- [ ] `COMPARE` werkt op twee nulmeting-runs (verwacht: geen verschil).
- [ ] **Tijdlijnweergave** van een export (inkomen en legerwaarde van beide spelers over tijd, markers voor eerste contact, tweede CY, superwapenschoten, grootste gevecht en de fasegrenzen). Een statische pagina of print is genoeg; nodig voor de fun-audit in fase 21.
- [ ] **Classificatiescript** (`tests/verlies.ts`): leest een export en geeft de geldige verliesoorzaken en de hoofdoorzaak volgens `fun-pass-verliesclassificatie.md`. Eén keer gedraaid op de nulmeting.
