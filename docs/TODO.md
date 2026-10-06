# Status & TODO

## Voortgang — 2026-09-30

### Assets (vervanging van procedurele placeholders)
- Open gelicentieerde 3D-modellen (Quaternius, Kenney, poly.pizza CC0/CC-BY) worden bij het laden naar isometrische sprites gerenderd: 32 richtingen, losse geschuttorens, echte schaduwen, teamkleuren; gebouwen met factietint.
- Terrein met CC0-fototexturen (ambientCG), naadloos geprojecteerd, zachte overgangen. 3D-bomen en rotsen. Explosies/rook met Kenney-particles.
- Attributie in de game (Credits), `public/assets/licenses/CREDITS.txt` en `docs/asset-register.md`.
- Dev-tool: `/?art` toont alle gebakken sprites (oriëntatie/schaal kalibreren).

### Fase 1 — uitbreiding (subagents, 2026-09-30)
- **Water**: geanimeerd, wereld-verankerd (16 frames), afgeronde kustlijnen met schuim en branding (`render/water.ts`, procedureel).
- **Bruggen**: rechte betonnen verkeersbruggen met leuningen en pijlers, per overspanning in three.js gebakken (`render/bridge.ts`, ambientCG CC0).
- **Ore/gems**: gebakken 3D-kristalclusters, 6 uitputtingsstadia, doorlopende veldondergrond, glinstering (`render/ore.ts`).
- **Ore mines** (gameplay): elk veld heeft een onuitputtelijke bron die ore rondom aanvult; rijke tegels groeien uit naar lege buurtegels. Velden zijn groter.
- Kaartgeneratie: wegen eindigen op het zelf-symmetrische middelpunt (bruggen breken niet meer door het spiegelen), kleine waterplasjes worden land. Test: alle starts bereikbaar op alle presets/groottes.

### Fase 1 — volledig (zie eerdere notities)
### Fase 2 — Core RTS
Volledig en getest:
- Barracks + infanterie: Rifleman en **Rocket Trooper** (antitank).
- Nieuwe voertuigen: **Scout Jeep** (snel, anti-infanterie), **Heavy Tank** (vereist radar).
- Nieuw gebouw: **Radar** — minimap werkt alleen met radar én voldoende stroom; vereiste voor zware voertuigen.
- **Repareren** (kost credits, via Repair-knop) en **verkopen** (50% × gezondheid, via Sell-knop).
- **Rally points**: productiegebouw selecteren + rechtsklik; nieuwe units rijden er met attack-move heen.
- Productiequeues, prerequisites, power, fog, minimap, attack-move, guard, formaties (al aanwezig).
- AI: bouwt radar, kiest units op basis van wat ze ziet (raketten tegen pantser, jeeps tegen infanterie, zware tanks), repareert beschadigde gebouwen.
- Kaarten zijn puntsymmetrisch (eerlijke startposities).

- Verbeterde AI: spaart eerst voor de tweede raffinaderij voordat ze een leger bouwt.
- Balansmeting (`BALANCE=27 npx vitest run balance`, 27 potjes hard, small): P0 11 · P1 14 · 2 patstellingen (was ~1/3). Oorzaken van de patstellingen waren: ore raakte op (nu mines) en onbereikbare bases op Twin Rivers (mapgen-fix).

Gedeeltelijk / bekend:
- Balans tussen facties (Allies 11 · Soviets 8 · Psi 6 winsten) nog niet fijngeslepen — fase 5.
- Projectielen zijn nog procedureel getekend.
- Water: op de grens van verkend/onverkend kan een hoekje water of schuim over het zwart vallen. Water-frames kosten ~19 MB geheugen en ~1,2 s laadtijd.
- Infanterie heeft geen echte loopanimatie (bob-effect), het soldatenmodel heeft alleen een staande pose.
- Bundel ~945 KB (three.js); menu zou three.js lazy kunnen laden.

### Fase 3 — Facties (2026-10-01)
Volledig en getest (`phase 3: factions` in sim.test.ts):
- Eigen roosters per factie (data in `data/units.ts`, `data/buildings.ts`, `factions.ts` → `roster`):
  - **Allied Coalition**: Rifleman, Rocket Trooper, Attack Dog · Warden Tank, Lancer IFV, Refractor Tank (tech) · Pillbox, Refractor Tower.
  - **Red Bloc**: Draftee, War Hound, Arc Trooper (radar) · Anvil Tank, Raider, Longbow Launcher (artillerie, radar), Colossus Tank (tech, zelfherstel) · Sentry Gun, Arc Coil.
  - **Psi Directorate**: Adept, Mauler · Lash Tank, Spinner Tank (gatling), Magnetar (tech) · Gatling Cannon, Psi Spire.
- Nieuw gedeeld tech-gebouw **Tech Center** (per factie andere naam), vereist War Factory + radar; ontgrendelt de tech-unit.
- Nieuwe mechanieken: spatschade (`splash`), gatling-opdraaien (`ramp`), zelfherstel (`regen`), wapens die bepaalde doelen niet kunnen raken worden niet meer automatisch gekozen (honden negeren voertuigen).
- Faction-check bij bouwen/produceren (`forFaction`), menu toont de unieke units per factie.
- AI bouwt per factie uit `roster` (inclusief Tech Center en tech-units); bug opgelost waardoor de AI-"dobbelsteen" altijd een geheel getal was.
- Balansmeting (27 potjes hard): Allies 9 · Soviets 8 · Psi 8 overwinningen, 2 patstellingen (was 11/8/6).

Gedeeltelijk / bekend:
- AI bouwt de tweede, dure verdediging (Refractor Tower / Arc Coil / Psi Spire) zelden.

### Fase 4 — Advanced gameplay (2026-10-01)
Volledig en getest (`phase 4: advanced gameplay` in sim.test.ts):
- **Mind control** (Psi: Mentalist): neemt één eenheid over; sterft de Mentalist, dan keert de eenheid terug. Paarse markering boven overgenomen eenheden.
- **Engineers** (alle facties): rechtsklik op vijandelijk gebouw = overnemen, op eigen beschadigd gebouw = volledig repareren. Engineer wordt verbruikt.
- **Veterancy**: kills leveren ervaring op (veteraan na eigen waarde, elite na 3×). +20% schade, −15% schade ontvangen per rang, elite herstelt langzaam. Gouden strepen naast de levensbalk.
- **Luchtmacht**: Kestrel VTOL (Allies), Thunderhead Airship (Red Bloc, bommen met spatschade), Hover Disc (Psi). Vliegen recht over obstakels; alleen wapens met `aa` raken ze (raketten, IFV, Raider, gatlings, Sentry Gun, Pillbox, vliegtuigen zelf).
- **Repair Depot**: repareert eigen voertuigen ernaast (kost credits).
- **AI**: bouwt depot, luchtmacht en (bij gezien luchtgevaar) luchtafweer, Psi zet Mentalists in, zwaar beschadigde voertuigen rijden naar de depot. Per AI een eigen moeilijkheid mogelijk (`AIState.difficulty`).
- Balansmeting met moeilijkheidsparen: `BALANCE=27 BALANCE_DIFF=hard,easy npx vitest run balance --silent=false`.
- **Eerlijke startposities**: uitgangen van fabrieken en docks van raffinaderijen wijzen naar het kaartmidden, en de AI-plaatsing spiegelt mee. Voorheen won speler 2 (P1) tot 24 van 33 potjes puur door zijn positie; nu 13–12 (hard vs hard). `canPlace` controleert nu ook dat de eigen uitgang/dock van een nieuw gebouw vrij is.
- **Moeilijkheidsgraden** (gemeten, 2 × 16–18 potjes per paar, beide kanten):
  - Easy: 30% tragere productie, stuurt alleen de minimale golf. Normal: 15% trager. Hard: geen handicap en geen bonus (de AI valsspeelt nooit), grotere eerste aanval na 5 min, golf trekt terug bij 50% verlies.
  - Normal wint van easy ~20–12, hard van normal 21–11, hard van easy 21–11. (Voorheen won easy 23–2 van normal: de 'slimmere' niveaus spaarden te lang en vielen met te kleine golven aan.)
  - Gevonden: sneller 'denken' (elke 12 ticks) maakte hard juist zwakker; nu 30.
- Factiebalans hard vs hard (27 potjes): Allies 11 · Red Bloc 6 · Psi 8, 2 patstellingen.

Niet gedaan in fase 4 (bewust uitgesteld):
- **Zeemacht**: kaarten hebben bijna geen open water; vereist shipyard + varende pathfinding. Pas zinvol met watermaps.
- **Garrisoning**: vereist neutrale burgergebouwen op de kaart (mapgen + art).
- **Vernietigbare bruggen**: bruggen zijn terrein; vernietigen/repareren (met engineers) vergt brug-HP en opnieuw bakken van de brug-art.
- AI gebruikt zelf (nog) geen engineers en bouwt de Repair Depot zelden (pas bij veel geld).
- Red Bloc wint iets minder vaak dan de andere facties.

### Fase 5 — Polish (2026-10-01)
Gedaan en getest:
- **Audio**: echte samples (Kenney CC0, rubberduck CC0, Baradari CC-BY 3.0, Thimras CC0) met varianten en toonhoogtevariatie, stereo-panning op schermpositie, synthese als terugval. Muziek: 3 nummers (Zhelanov CC-BY 3.0/4.0, congusbongus CC0), shuffle + crossfade, eigen volumeschuif. Nieuwe geluiden voor overnemen, promotie, mind control.
- **Animaties**: infanterie loopt/vuurt/sterft (Quaternius "Soldier", CC-BY 3.0), hond rent/bijt. Mondingsvuur, lichtsporen, granaat-/raketbogen met rookspoor, elektrische bogen, mind-control-golf, inslagvonken, terugslag van kanonnen. Beschadigde gebouwen roken (<50%) en branden (<25%), opbouwanimatie met lasvonken.
- **Performance**: three.js en de game worden pas bij het starten geladen (menu-bundel 1007 → 295 kB). Alleen de sprites van de facties in het potje worden gebakken (overgenomen/gestolen eenheden op aanvraag). Laadtijd ~17 s → ~3,5 s, spritegeheugen 184 → 77 MB, shroud-pass 22 ms → 0,07 ms. Water 19 → 13 MB; fog-rand waterlek dichtgezet.
- **UI**: tooltips tonen "sterk/zwak tegen", luchtafweer, spatschade, vliegt, etc.; selectie toont rang en mind control; sneltoetsenoverzicht (F1 / ?); tutorial uitgebreid (infanterie, engineers, veterancy, radar).
- **Save/load**: test die midden in een potje opslaat en controleert dat het geladen spel exact gelijk doorloopt (AI, mind control, veterancy).

Niet geverifieerd / bekend:
- Geluid en muziek zijn niet beluisterd (testtab stond op de achtergrond); niveaus zijn geschat.
- Muziek is AAC (.m4a): Firefox op Linux zonder systeemcodecs speelt geen muziek.
- Kustschuim kan op kaarten met veel kust meer geheugen kosten (~0,66 MB per kustvorm).
- Op-aanvraag bakken (overgenomen gebouwen) geeft een korte hapering.
- Zeemacht, garrisoning en vernietigbare bruggen (uit fase 4) staan nog open.

### Fase 6 — Release candidate (2026-10-01, versie 1.0.0-rc.1)
Getest:
- **Soak-test** (`npm run soak`): 24 volledige AI-potjes (alle kaarten, 3 groottes, 2–4 spelers, alle facties/niveaus) met elke seconde invariantcontroles: geen negatieve/onverdiende credits (AI valsspeelt niet), wachtrijen binnen limiet, geen units in gebouwen/rotsen, geen NaN, bezettingsgrid klopt, geen vastgelopen units. Resultaat: 0 overtredingen.
- **End-to-end** (`npm run e2e`, Playwright): de volledige checklist uit de masterprompt via echte klikken/toetsen in **Chromium, Firefox en WebKit (Safari-engine)**: skirmish starten, power + refinery, oogsten, factory + tank, selecteren (sleepkader), bewegen, aanvallen, AI bouwt/oogst/produceert/valt aan, pauze/hervatten, opslaan/laden, winnen, opnieuw spelen, verliezen, menu, instellingen, credits, sneltoetsen — zonder consolefouten.
- **Productiebuild** in alle drie engines: start zonder fouten.
- **Geheugen**: 6× spel starten/stoppen → JS-heap blijft 37 MB, alle canvassen opgeruimd.
- **Licentie-audit**: alle bestanden in public/assets gedekt; ongebruikt soldier.glb verwijderd; CC-BY-attributies aangevuld (titel, auteur, bron, licentie, wijzigingen); README.md toegevoegd.

Gevonden en opgelost:
- Units konden eindeloos blijven wachten op een pad (bv. aanvalsdoel over water, oogster klem tussen gebouwen): elke tick een nieuwe zware padberekening. Nu meldt beweging 'opgegeven' en kiezen units iets anders.
- Oogsters kozen ore in een afgesloten zak (onbereikbaar): nu alleen ore in hun eigen terreingebied (`regions()`), en onbereikbare tegels worden overgeslagen.
- Groepsformaties konden plekken aan de overkant van een rivier kiezen: nu alleen in het aangeklikte gebied.
- Padbudget per tick wordt eerlijk rondgedeeld (round-robin) zodat geen unit verhongert.
- Weergavenamen te dicht bij RA2 hernoemd (Dynamo Plant, Draftee, Adept, Mauler, Psi Sensor Array).

Open / beslissing eigenaar:
- Code-licentie kiezen (TODO in README.md).
- Algemene namen die ook in C&C voorkomen (Construction Yard, War Factory, Ore Refinery, Repair Depot) en factienamen: eventueel hernoemen.
- Geluid/muziek beluisteren (overwinning-/nederlaag-jingle staan op "in review").
- Edge niet apart getest (niet geïnstalleerd; zelfde engine als Chromium). Echte Safari-app niet getest (wel WebKit).
- Headless Chromium zonder GPU laadt traag (~17 s); in echte Chrome ~3 s.
- Zeemacht, garrisoning, vernietigbare bruggen: niet geïmplementeerd.

### Fase 7 — Fundament uitbreiding (2026-10-01, zie plan/uitbreidingsplan.md)
Gedaan:
- **Ability-systeem** (`data/abilities.ts`, `systems/abilities.ts`): één vaardigheid per eenheid/gebouw, toets E of knop in het selectiepaneel, cooldown.
  Eerste vaardigheden: Ontplooien (Base Crawler), Inpakken (Construction Yard), Uitladen (transport), Ingraven (Rifleman: +1,5 bereik, 40% minder schade, staat stil).
- **Base Crawler** (MCV): rijdt overal heen en ontplooit tot extra Construction Yard; de CY kan weer inpakken. De AI bouwt er een als zijn CY verloren is (met factory + depot).
- **Transport**: Flak Hauler (Red Bloc, AA + 5 infanteristen). Rechtsklik met infanterie op het transport. Passagiers zijn onzichtbaar en onraakbaar en sterven met het voertuig.
- **Vliegtuigmunitie + Airfield** (Allies): Kestrels starten vanaf 4 landingsplaatsen, hebben 3 salvo's, vliegen zelf terug om te herladen. Geparkeerd zijn ze gronddoel. Max. 4 per Airfield.
- **Muren** (per factie een naam/uiterlijk): slepen voor een rij, elk extra stuk $100; nooit automatisch beschoten, tellen niet mee voor overleven.
- **Luchtafweer-gebouwen**: Skyguard SAM (Allies), Flak Battery (Red Bloc): alleen luchtdoelen. De AI bouwt ze zodra hij vijandelijke lucht ziet.
- **Build-limiet** (`limit` op een eenheid) klaar voor helden in fase 8.
- Tests: 10 nieuwe unit-tests (`tests/phase7.test.ts`), extra soak-invarianten (transport-boekhouding, munitie, landingsplaatsen), e2e-scenario via de UI (E-toets, muur slepen, instappen).

Verschoven: het algemene statuseffect-framework komt in fase 8 mee met de eerste effecten (bevriezen, berserk, straling); zonder gebruiker zou het dode code zijn.

Open:
- De AI gebruikt transport en muren nog niet en bouwt het Airfield zelden (fase 13: AI).

### Fase 8 — Infanterie & helden (2026-10-01)
Nieuw (alle eigen namen/ontwerpen, geen EA-personages):
- Allies: **Skyjumper** (vliegende jetpack-infanterie), **Infiltrator** (spion: vermomd, sabotage per gebouwtype), **Phase Trooper** (teleporteert; straal haalt doelen uit de tijd), held **Nova** (pistolen + C4).
- Red Bloc: **Flak Gunner**, **Sapper** (tijdbom), **Blight Trooper** (ontplooibaar stralingsveld), held **Grom** (laser-markering → luchtaanval).
- Psi: **Toxin Sniper** (gifwolk), held **De Orakel** (neemt ook gebouwen over, Psi-storm); de Mentalist kreeg **Psi-golf**.
- Systemen:
  - secundair wapen (`weapon2`)
  - statuseffecten: bevroren/uit de tijd, tijdbom
  - grond-hazards: gifwolk, straling
  - vermomming + detectie (honden)
  - infiltratie: geld stelen, stroomuitval 45 s, kaart wissen, veteranen, inlichtingen
  - teleport
  - heldenlimiet (1)
  - helden zijn immuun voor gedachtenbeheersing
- De AI mengt specialisten en helden in zijn leger.
- Tests: 13 nieuwe unit-tests (`tests/phase8.test.ts`), soak-invarianten (fase/bom/bevriezing/hazards/max. 1 held).

Gevonden en opgelost:
- **Economie-deadlock bij de AI**: zonder oogsters bleven dure items half betaald in de wachtrij hangen, zodat er nooit een nieuwe oogster kwam (potje eindigde nooit). Nu annuleert de AI alles behalve een nieuwe oogster.
- **Save/load-bug (al ouder)**: `Infinity` in de vastloopdetectie werd in JSON `null`, waardoor een geladen spel soms anders verliep. Nu een eindig getal; oude saves worden gerepareerd bij het laden.

Verschoven naar fase 9: **Thrall** (komt met het ontplooien van de Thrall Hauler). Nova kan nog niet zwemmen (komt met de zee-bewegingslaag in fase 11).

### Fase 9 — Voertuigen & lucht (2026-10-01)
Nieuw:
- **Bewegingslagen** (grond / amfibisch / water) in pathfinding, regio's, botsing en formaties; basis voor de vloot in fase 11.
- **Amphibious Transport** (alle facties): 8 infanteristen over land en water; uitladen aan de kust.
- **Lancer IFV** neemt 1 infanterist mee en krijgt diens wapen (Rifleman → machinegeweer, Phase Trooper → fasestraal, Nova → scherpschutter).
- Allies:
  - **Shroud Tank**: lijkt voor de vijand een boom zolang hij stilstaat en niet vuurt; honden zien het.
  - **Talon Strike Jet**: één zware bom, herlaadt op het Airfield.
- Red Bloc:
  - **Leech Drone**: doodt infanterie, kruipt in voertuigen en vreet ze op; alleen een Repair Depot haalt hem eruit.
  - **Siege Rotor**: helikopter die landt als artillerie.
- Psi:
  - **Hivemind**: beheerst 3 eenheden, raakt overbelast bij meer.
  - **Delirium Drone**: waanzin-gas; getroffen vijanden vallen alles aan, ook eigen troepen.
  - **Thrall Hauler** met 3 Thralls: ontplooid is hij een mobiele refinery en delven de Thralls rondom. Psi-refineries leveren nu een Thrall Hauler.
  - **Hover Disc**: zuigt geld uit refineries en legt centrales plat.
- De AI mengt de nieuwe voertuigen in zijn leger.
- Gestolen credits worden bijgehouden (`stats.stolen`); de soak-controle "AI valsspeelt niet" telt ze mee.
- Tests: 12 nieuwe unit-tests (`tests/phase9.test.ts`), soak-invarianten (thralls, leech), e2e-scenario (landen met E, IFV-wapen).

Gevonden en opgelost:
- **Instappen mislukte soms**: stond een voertuig op een tegel waar infanterie niet kan lopen, dan vroeg de infanterist elke tick een nieuw pad aan en stapte nooit in. Nu stapt hij in vanaf de buurtegel (unit-test toegevoegd).
- **AI-patstellingen** (4–5 per 27 potjes):
  - Blut en zonder oogster: de AI annuleert nu wachtrijen (terugbetaling), verkoopt overbodige gebouwen voor een oogster of factory, en valt aan met wat hij heeft.
  - Verborgen laatste eenheden: zonder bekend doel doorzoekt het leger de kaart.
- Gatling Cannon (Psi) draaide zijn loop de verkeerde kant op.

Open:
- De AI ontplooit de Thrall Hauler nog niet en zet het transport niet in (fase 13).
- Mogelijk lichte zetel-bias: 20–32 over 54 gemengde potjes. In spiegelpotjes (`BALANCE_MIRROR=1`) 62–75 over 150 potjes, dus niet significant. Uitzoeken in fase 13.

### Fase 10 — Kaart & neutraal (2026-10-01)
Nieuw (aan/uit in het skirmish-scherm: "Burgers" en "Bonuskratten"):
- **De burgers**: een neutrale speler die stadjes, tech-gebouwen en bruggen bezit. Speelt niet mee, verliest nooit, wordt nooit automatisch beschoten (Ctrl+rechtsklik = gericht vuur).
- **Garrison**:
  - Burgerhuis, kantoor, boerderij en stadhuis (3–8 plaatsen).
  - Infanterie gaat erin met rechtsklik; het gebouw wordt van jou, de bewoners vuren met extra bereik en zijn onraakbaar.
  - Stort het in, dan komen ze er levend uit. E = evacueren; een leeg gebouw gaat terug naar de burgers.
- **Tech-gebouwen** (overnemen met een Engineer):
  - Fuel Rig: +$15/s
  - Field Hospital: infanterie geneest overal
  - Machine Shop: voertuigen repareren overal
  - Outpost: zicht 14
- **Vernietigbare bruggen**: alleen gericht vuur raakt ze; wat erop staat verdrinkt; routes en weergave worden bijgewerkt (`map.rev`). Een Engineer in het brughuisje herbouwt ze.
- **Bonuskratten**: geld, promotie, reparatie of kaartonthulling.
- **Nieuwe kaarten**: *Inland Sea* (binnenzee met middeneiland) en *Archipelago* (eilanden met lange bruggen).
- Alle structuren worden puntsymmetrisch geplaatst en blokkeren nooit de route tussen bases.
- Tests: 9 nieuwe unit-tests (`tests/phase10.test.ts`), soak met burgers/kratten/nieuwe kaarten plus invarianten (lege burgergebouwen neutraal, brugstatus = terrein), e2e (garrison via rechtsklik, evacueren met E).

Gevonden en opgelost:
- Spatwapens (artillerie) konden een brug ook met gericht vuur niet raken.
- Sidebar-iconen gingen "kapot" midden in een potje: het hot-reloaden van de art-code door de art-agents wiste de gebakken sprites. De placeholder-icoon was veel te groot. Placeholder is verkleind (art-agent). Om ongestoord te spelen staat een vaste build op poort 5232.

Open:
- De AI gebruikt garrison, tech-gebouwen en brughuisjes nog niet (fase 13). Op *Archipelago* kan een vernielde brug de AI blokkeren.

### Fase 11 — Zee (2026-10-01)
Nieuw:
- **Naval Yard** (alle facties, vereist Ore Refinery): wordt op open water gebouwd, binnen bouwbereik. Bouwt schepen (in de voertuigen-wachtrij) en repareert schepen die ernaast liggen.
- **Havens op de zeekaarten**: elke basis op *Inland Sea* en *Archipelago* krijgt een havenbekken met een vaargeul naar de gedeelde zee. Daarvoor ligt het eigen ertsveld nu aan de andere kant van de basis.
- **9 schepen** (`move: 'water'`, varen ook onder bruggen door):
  - Allied: Picket Destroyer (kanon + dieptebommen, sonar 7), Bastion Cruiser (zware luchtafweer), Skyhaven Carrier (drones, bereik 10), Sonar Drone (snel, sonar, schudt een Kraken af).
  - Red Bloc: Flak Boat (luchtafweer + licht), Barracuda Sub (torpedo's), Leviathan (raketten, bereik 13), Kraken (grijpt en verbrijzelt schepen).
  - Psi: Psi Submarine (raketten tegen land, torpedo's tegen schepen).
- **Onderzeeërs**: onzichtbaar voor de vijand (ook voor de AI) tot een sonar in de buurt is of ze vuren (1,5 s boven water). Alleen torpedo's, dieptebommen en sonarpulsen raken ze.
- **Torpedo's** raken alleen doelen op het water (schepen, onderzeeërs, Naval Yards).
- **Kraken-grijp**: het doelschip zit vast zolang de Kraken knijpt (groene ring); een Sonar Drone schudt hem af.
- **Kustgevecht**: schepen beschieten land vanaf het water, landeenheden beschieten schepen vanaf de kust.
- **Nova zwemt** (amfibisch).
- **AI**: bouwt op zeekaarten een Naval Yard (nooit in een plas) en mengt schepen in het leger.
- Tests: 9 nieuwe unit-tests (`tests/phase11.test.ts`), e2e (Naval Yard via de sidebar op het water, destroyer bouwen, blijft op zee). Soak zonder problemen.
- Balansmeting: `BALANCE=27`: P0 12 · P1 15 · 0 patstellingen. Nieuw `BALANCE_MAPS=coast,islands,coast` voor de zeekaarten: P0 13 · P1 14 · 0 patstellingen, 18 werven en 24 schepen gebouwd.
- Art: alle schepen en de werf zijn procedureel gemaakt (geregistreerd in `docs/asset-register.md`).

Open (fase 13):
- De AI bouwt weinig schepen (geldgebrek), jaagt niet gericht op onderzeeërs en gebruikt de Sonar Drone niet tegen de Kraken.
- Leviathan-raketten zijn nog niet te onderscheppen door luchtafweer.
- De Carrier lanceert geen echte drones; ze zijn projectielen met groot bereik.

### Fase 12 — Superwapens & economie (2026-10-01)
Nieuw:
- **Superwapens**: één per soort per speler. Standaard aan; uit te zetten met het vinkje "Superwapens" in het skirmish-scherm.
  - Ze laden alleen bij voldoende stroom.
  - Iedereen krijgt een waarschuwing bij bouwen, bij gereed en bij afvuren; de inslagplek wordt gemarkeerd.
  - In de sidebar staat per superwapen een knop met aftelklok. Klik en richt met een cirkel; rechtsklik of Esc annuleert.
  - Allied:
    - Phase Gate (4 min): eerst de groep aanklikken, dan de bestemming. Voertuigen teleporteren in formatie. Infanterie sterft, behalve Phase Troopers en helden. Wat op water of rotsen belandt, gaat verloren.
    - Storm Engine (6 min): 10 s bliksem.
  - Red Bloc:
    - Hammer Silo (6 min): enorme explosie plus 25 s straling.
    - Stasis Projector (4 min): voertuigen en gebouwen 20 s onkwetsbaar (rode gloed); infanterie sterft.
  - Psi:
    - Dominion Engine (6 min): neemt alles in het gebied voorgoed over, behalve helden.
    - Mutagen Spire (4 min): vijandelijke infanterie wordt Maulers voor jou.
- **Economie**:
  - Assembly Plant (Red Bloc): voertuigen en schepen 25% goedkoper en sneller. De sidebar toont de korting.
  - Duplicator Vats (Psi): elke infanterist komt dubbel, behalve helden.
  - Reclaimer (Psi): rechtsklik met eigen of overgenomen grondeenheden: ze worden gerecycled voor 50%.
  - Psi Beacon (Psi): toont vijandelijke aanvalsdoelen als kruisjes op de minimap en ontmaskert onderzeeërs en spionnen binnen 10 tegels.
  - Arc Coil: een Arc Trooper ernaast laadt hem op. Hij werkt dan zonder stroom en vuurt twee keer zo snel.
- **AI**:
  - Bouwt na 6 minuten superwapens.
  - Vuurt aanvalswapens af op de rijkste bekende vijandelijke plek.
  - Stasis en Phase Gate gebruikt ze voor haar eigen aanvalsgolf.
  - Assembly Plant en Duplicator Vats bouwt ze ook.
- **AI-fixes** (gevonden met de balansmeting): een aanvalsgolf die een hele golf over tijd is, vertrekt met wat er is (minstens de helft). Golven groeien tot maximaal 20 eenheden. Zonder deze fixes kon een AI met een groot leger 30 minuten blijven wachten, en dat gaf patstellingen.
- **Tests**:
  - 10 nieuwe unit-tests (`tests/phase12.test.ts`).
  - e2e: superwapen via de sidebar-knop en een klik op de kaart.
  - Soak zonder problemen.
  - Nieuw `BALANCE_NOSW=1`: balansmeting zonder superwapens.
- **Balansmeting** (2 × 27 potjes, hard, small):
  - Seed 1000: P0 11 · P1 16 · 0 patstellingen.
  - Seed 2000: P0 17 · P1 10 · 0 patstellingen.
  - Per factie: allies 23 · soviets 15 · psi 16.
- **Art**: 10 procedurele gebouwen, geregistreerd in `docs/asset-register.md`.

Open (fase 13):
- Allies winnen iets vaker. Dat nemen we mee in de balansronde.
- De AI gebruikt de Reclaimer, de Psi Beacon en het opladen van coils niet. Phase Gate en Stasis zet ze alleen in voor een lopende golf.
- De Hammer Silo slaat direct in, zonder vluchttijd.

### Fase 13 — AI, balans, release (2026-10-01, versie 1.1.0)
Nieuw in de AI:
- **Engineers**: neemt vrije tech-gebouwen in de buurt in en herbouwt verwoeste bruggen die ze kent. Alleen doelen op het eigen eiland; een opdracht die vastloopt wordt opgegeven.
- **Garrison**: zet ongebruikte infanterie in een leeg burgergebouw vlak bij de eigen basis.
- **Abilities**: Mentalist en Oracle gebruiken psi-golf en psi-storm op groepjes vijandelijke infanterie.
- **Veerdienst**: als er geen route over land naar de vijand is (eilanden, brug kapot), bouwt de AI een Amphibious Transport. Die brengt infanterie over en zet ze aan land voor een aanval.
- **Psi Beacon**: Psi bouwt er een (detectie van onderzeeërs en spionnen).
- **Zoeken**: ziet de AI geen vijandelijke gebouwen meer, dan zoekt ze rond de startposities van de overgebleven tegenstanders. Voorheen ging ze soms naar een lege hoek op een onbereikbaar eiland, met patstellingen tot gevolg.
- Garnizoenen en passagiers tellen niet meer mee als "leger" voor een aanvalsgolf.

Engine:
- **Hammer Silo**: de raket heeft nu vluchttijd (een paar seconden, iedereen ziet hem komen). De straling ontstaat op de inslagplek.
- **Leviathan-raketten** kunnen door luchtafweer worden onderschept (SAM, flak, IFV, Rocket Troopers enz.).

Balans (gemeten met gelijke legers per budget en met AI-tegen-AI):
- Lash Tank: 280 → 360 gezondheid, schade 44 → 50.
- Anvil Heavy Tank: schade 44 → 47, bereik 5,2 → 5,5.
- Colossus Tank: 850 → 1000 gezondheid, schade 60 → 85.
- Rocket Trooper: schade 55 → 45.
- Adept: schade 20 → 16.
- Arc Trooper: bereik 3,5 → 4.
- Resultaat over 81 potjes AI-tegen-AI (hard, 3 seeds, landkaarten): allies 27 · soviets 27 · psi 26, 1 patstelling (beide spelers blut). Voorheen was het allies 26 van 54.
- Zeekaarten (27 potjes): allies 10 · soviets 6 · psi 11, 0 patstellingen.
- Zetel-bias: over alle 108 potjes won P0 er 56 en P1 er 51. Geen bias.

Tests:
- 6 nieuwe unit-tests (`tests/phase13.test.ts`): engineer/tech, brug herbouwen, garrison, psi-golf, veerdienst, onderschepping.
- Soak heeft nieuwe invarianten (laadstand superwapens, duur van stasis, geen infanterie in stasis): 24 potjes zonder problemen.
- e2e: een AI-tegen-AI-potje op Archipelago (hard, superwapens aan) dat 12 minuten draait en rendert zonder fouten.

Bekende beperkingen (bewust niet gedaan):
- De Carrier lanceert geen echte drones (wel projectielen met groot bereik).
- De AI gebruikt de Reclaimer, het opladen van Arc Coils en dig-in niet. Spionnen/Infiltrators zet ze niet bewust in.
- De veerdienst vervoert alleen infanterie. Voertuigen blijven bij een kapotte brug thuis tot een Engineer hem herbouwt.

### Fase 14 — Fundament UX: taal, tokens, fonts (2026-10-02, zie plan/ux-plan.md)

- **Camera** (wens tussendoor): met de rechtermuisknop slepen verschuift de kaart; een rechtsklik zonder slepen blijft een bevel. Schermrand-scrollen werkt nu ook onder de topbalk en aan de vensterrand boven de sidebar, met een zachte versnelling en uitloop. e2e-test in drie browsers.
- **Alles Engels**: UI, tooltips, tutorial, kaartbeschrijvingen, eenheid- en gebouwbeschrijvingen, opslaan/laden-meldingen. "De Orakel" heet nu "The Oracle". Instellingen heet overal "Options". e2e `english.e2e.ts` loopt menu, opties, credits, setup, HUD, elke tab met elke tooltip, help en pauzemenu langs op Nederlandse woorden.
- **Design tokens** in `styles.css`: OKLCH-neutralen, statuskleuren, spacing, lagen en per factie (`[data-faction]` op de `.game`-root) chrome- en gloedkleuren. De oude namen (`--accent` enz.) wijzen naar de nieuwe tokens, dus het accent volgt nu al de factie. Geen gekleurde zijstrepen meer bij berichten en factiekaarten.
- **Fonts**: Barlow Condensed (labels), Barlow (tekst), Share Tech Mono (cijfers), alle OFL, gebundeld via Fontsource, geregistreerd in het asset-register en CREDITS.txt.
- `prefers-reduced-motion` zet animaties en transities uit.
- De sidebar rendert al op ~8 Hz plus bij invoer (`Game.notify`); daar was geen extra throttle nodig.

### Fase 15 — Sidebar & HUD als factie-console (2026-10-02)

- **Materiaal per factie**: `.plate` (geborsteld/gelakt metaal) en `.well` (verzonken glas), puur CSS. Allied koel staal met cyaan, Red Bloc oxiderood met amber en hoekige platen, Psi violet met magenta gloed en afgeronde hoeken.
- **Sidebar**: factie-embleem (eigen ontwerp, `ui/icons.tsx`) met credits als rollende teller, radar met luiken die opengaan zodra de radar werkt, verticale stroomrail (segmenten, marker = verbruik, rood bij tekort), Repair/Sell met iconen, vier icoontabs (Structures, Defense, Infantry, Vehicles; Defense = gebouwen met wapen + muren) met voortgangsring of ready-stip.
- **Cameo-staten**: building (clock-wipe met wijzer en resterende tijd), queued ×N, **on hold** (nieuw: rechtsklik pauzeert, linksklik hervat, nogmaals rechtsklik annuleert met terugbetaling), ready, locked (slot), te duur (rode prijs), placing. De render zoomt per voetafdruk/categorie in.
- **Superwapen-timers** linksboven, eigen (klikbaar als ze klaar zijn) en alle vijandelijke; berichten staan eronder.
- **Commandobalk** onderaan de kaart: portret, naam, hp-pips (10 segmenten), details, en bevelen met sneltoetsletter (F/G/X/E). Groepen tonen per type een knop.
- **Topbalk** als metalen strip bovenin het midden; tutorial rechtsboven.
- **Responsive**: ≥1680 px sidebar 340 px en 3 cameo-kolommen; touch of <1180 px: de sidebar wordt een lade (de stroomrail is de handgreep en toont de credits), cameo's in 3 kolommen, grotere knoppen, en een Select/Order-schakelaar.
- **Touch-besturing**: tik = selecteren (of bevel in Order-modus), slepen = pannen, twee vingers = pannen + knijpzoomen, lang drukken + slepen = sleepselectie. Bij plaatsen schuift de lade dicht.
- Tests: `tests/phase15.test.ts` (on hold), `e2e/hud.e2e.ts` (cameo-staten, timers, commandobalk per factie met screenshots als bijlage; tablet-test met touch in chromium en webkit; Firefox ondersteunt geen touch-emulatie).

### Fase 16 — Announcer & feedback (2026-10-02)

- **Eigen announcers per factie**, offline gegenereerd met Piper TTS (`tools/gen-voices.py`, regels in `src/game/data/voicelines.json`): **AEGIS** (Allied, Brits-vrouwelijk, schone radio), **KOMMAND** (Red Bloc, lage mannenstem, veldradio met ruis), **CHOIR** (Psi, stem met verlaagde laag erbij, echo en een toon i.p.v. squelch). 70 regels per announcer, inclusief alle superwapen-meldingen (online/ready/activated en de vijandelijke waarschuwingen).
- **Licenties**: alleen stemmodellen die *from scratch* op publiek-domein-opnames zijn getraind (LibriVox, LJ Speech). libritts_r en andere van "lessac" afgeleide modellen afgewezen (Blizzard 2013-data, beperkende licentie), net als NC-stemmen. Zie `public/assets/licenses/piper-voices.txt` en het asset-register. Generator controleert de lengte per regel en probeert opnieuw bij "gebrabbel"; te korte norman-regels zijn iets langer geformuleerd.
- **Spreekwachtrij** (`src/game/announcer.ts`): één regel tegelijk, prioriteit (gevaar > afwachten > klikfeedback), cooldown per regel, verouderde regels vallen weg. Muziek zakt 6 dB terwijl de announcer praat. Regels zonder opname vallen terug op browserspraak.
- **Nieuwe meldingen**: Battle control online, Power restored, Radar online/offline, New construction options, Our harvester is under attack (aanvallen op gewone eenheden zeggen niets meer), Unit promoted, Building captured, Structure sold, Select target, klikfeedback (Building/Training/On hold/Cancelled).
- **Unit-antwoorden** bij selecteren en bevelen: per factie en per klasse (infanterie droog, voertuig/schip/vliegtuig over de radio, Psi met echo), 8 regels per klasse; helden Nova, Grom en The Oracle hebben eigen regels. Een nieuw antwoord breekt het vorige af; snel opnieuw selecteren blijft stil.
- **Radar-pings**: rode uitdijende ringen op de minimap waar iets van jou geraakt wordt. **Spatie** springt naar de laatste melding; pauze zit nu alleen op **P**.
- **Berichtlog** (knop "Log" in de topbalk) met tijdstempels en de naam van de announcer.
- **Screen shake** bij een superwapen in beeld (uit bij `prefers-reduced-motion`).
- **Instellingen**: Announcer aan/uit, Announcer volume, Unit voices.
- In-game credits vermelden nu ook de stemmen en de fonts (fase 14 was die vergeten).
- Tests: `tests/phase16.test.ts` (elke regel wordt door de game gezegd, elk bestand bestaat, geen verdwaalde bestanden, wachtrij/cooldown/prioriteit), `e2e/voice.e2e.ts` (AAC decodeert in chromium, firefox en webkit; log werkt).
- **Bewust doorgeschoven** naar fase 17: $-deeltjes bij verkopen, sleutelicoon bij repareren, stofwolk bij plaatsen. Credits-tik bij oogsten weggelaten (zou bij elke vracht klinken).
- ~~Niet door een mens beluisterd~~: op 2026-10-02 door de gebruiker beluisterd en goedgekeurd.

### Fase 17 — Leesbaarheid slagveld (2026-10-02)

- **Selectie**: hoekhaken rond voertuigen, schepen, vliegtuigen en gebouwen (wit, rood voor iets van de vijand); infanterie houdt de kleine ellips (rood bij vijand). De levensbalk van een gebouw staat nu boven het model in plaats van er middenin.
- **Levensbalk in segmenten**: 4 (infanterie), 6 (voertuig), 8 (schip) of 6–14 (gebouw, naar breedte). Kleur groen > 50 %, geel > 25 %, rood; het aantal brandende segmenten vertelt hetzelfde zonder kleur. Vijandelijke balken zijn gestreept (kleurenblind). Groepsnummer naast de balk, veteranie-chevrons blijven.
- **Orderlijnen**: elk bevel tekent een lijn van elke eenheid naar het doel (groen move, rood attack, oranje attack-move, geel capture/guard), weg na 0,6 s.
- **Contextcursors** (`src/game/cursors.ts`, eigen SVG's als data-URI): select, move, cannot-move (water/kaartrand voor landeenheden), attack, enter/garrison, capture, repair, sell, nope, deploy, superwapen-doel, plaatsen, en 8 scrollpijlen aan de schermrand. Het canvas krijgt `data-cursor` voor tests.
- **Plaatsing**: raster per cel (groen/rood per cel via nieuwe `cellFree`), stippelcirkel met het bereik van een verdediging, en een stippelrand rond het gebied waar je mag bouwen (`BUILD_RADIUS`).
- **Stroomtekort**: gebouwen die stroom nodig hebben worden gedimd en ontkleurd, met een knipperende bliksem; verdediging toont **OFFLINE**.
- **Rally-vlag** in teamkleur (wapperend) met stippellijn, alleen zolang het productiegebouw geselecteerd is (op verzoek van de gebruiker; eerst stond de vlag altijd).
- **Kaartrand**: zachte, korrelige overgang naar zwart in plaats van een harde ruit.
- **Uit fase 16**: "+$" stijgt op boven de raffinaderij bij elke vracht (nieuw event `income`), sleutelicoon bij repareren, stofwolkjes achter rijdende voertuigen.
- Tests: `tests/phase17.test.ts` (elk geleverd credit komt als income-event binnen; raster = precies de geblokkeerde cellen), `e2e/battlefield.e2e.ts` (cursor op vijand/terrein/eigen gebouw/schermrand/verkoopmodus in drie browsers, alle cursor-SVG's decoderen, orderlijn verdwijnt; twee pixel-snapshots in chromium op een vaste seed met bevroren klok via dev-hook `__freeze`).
- **Niet gedaan**: shift-waypoints (de game kent nog geen bevelwachtrij; dat is gameplay, geen leesbaarheid). Snapshots alleen in chromium en alleen op deze machine (pixelbaselines zijn platformgebonden).
- **Na feedback**: kaartrand-overgang ligt nu alleen op de grond (gebouwen aan de rand kregen vlekken), dunne lichte naad op de kaartgrens weg. Geland vliegtuig op het achterste platform van een vliegveld werd achter het gebouw getekend; staat nu altijd net vóór zijn vliegveld.

### Fase 18 — Shell: menu, lobby, briefing, score (2026-10-02)

- **Hoofdmenu**: consolepaneel rechts ("Iron / Front", grote knoppen met klikgeluid, eerste klik start ook de muziek), versie linksonder. Op de achtergrond een **live AI-vs-AI-potje** (`src/ui/Attract.tsx`): kleine willekeurige kaart, 60 % snelheid, gedimd, camera drijft tussen de bases, geen geluid, "Live · AI vs AI · kaartnaam" linksboven. Loopt door achter lobby, opties en credits; stopt (ook het sprite-bakken, nieuwe `abort` in `prepareArt`) zodra een echt spel laadt. Bij `prefers-reduced-motion` een stilstaand beeld. In tests standaard uit (`navigator.webdriver`), aan met `?attract`.
- **Lobby** (`SkirmishSetup.tsx`): factiekeuze als drie grote eigen emblemen; spelerslots als rijen met nummer, embleem, naam, factie (of willekeurig), AI-niveau en kleur per AI; AI toevoegen/verwijderen (1–3). **Kaartvoorbeeld** van de echte seed met genummerde startposities in spelerskleur (`MapPreview.tsx`). Map, grootte, credits en superwapens zichtbaar; erts, burgers, kratten en seed onder "Advanced". Nieuw in `GameSettings`: `ais` (factie/kleur/niveau per AI); oude saves zonder `ais` werken zoals voorheen.
- **Briefing** als laadscherm (`Briefing.tsx`): factie-embleem, kaartnaam, kaartvoorbeeld met startposities, tegenstanders, doel, echte laadstappen als terminalregels ("Baking sprites… 42/91"), voortgangsbalk en wisselende tips. Blijft minstens 1 s staan.
- **Scorescherm** (`ScoreScreen.tsx`): "MISSION ACCOMPLISHED / FAILED"-plaat met kaart en speeltijd, vijf tellers die oplopen met tikgeluid en segmentbalken (verliezen rood), stand per speler met scorebalk in spelerskleur, rang van Recruit tot Field Marshal. Play again / Main menu.
- **Consolestijl** voor alle panelen en knoppen (pauzemenu, opties, credits).
- Tests: `tests/phase18.test.ts` (slots → factie/kleur/niveau, oude saves, voorbeeld = speelkaart, score/rang), `e2e/shell.e2e.ts` (menu → lobby → briefing → spel → score → opnieuw → verlies → menu, en de live achtergrond, in drie browsers).
- **Niet gedaan**: teams in de lobby. De game kent geen bondgenootschappen (iedereen tegen iedereen); dat is gameplay en raakt doelwit-keuze, AI, fog en overwinning. Kan als losse stap.

### Fase 19 — Polish, toegankelijkheid, test (2026-10-02)

- **Opties** in drie groepen (Sound, Display, Controls). Nieuw: **Subtitles** (announcerregels als tekst; de log houdt ze altijd), **Interface size** 90–125 % (CSS `zoom` op HUD en menu's, niet op de kaart; minimapklik rekent mee), **Reduce motion** (bovenop de systeeminstelling: geen schudden, stilstaande menu-achtergrond, geen optellende scores, CSS-animaties uit), **Colour-blind palette** (Okabe-Ito spelerskleuren, ook voor New Game/Tutorial/Sandbox; levensbalk blauw/geel/vermiljoen; orderlijnen hemelsblauw/vermiljoen). Edge scrolling bestond al; de scrollpijl-cursor volgt die instelling nu ook.
- **Contrast**: `tests/phase19.test.ts` rekent OKLCH → WCAG-contrast uit voor elke tekst-/paneelkleur in het menuthema en de drie factiethema's. Gevonden en verholpen: kleine grijze tekst (`--n-ink-3`) zat op 4,1–4,3 (nu ≥ 4,5), Psi-labels (`--glow-dim`) op 2,7 (nu ≥ 3).
- **Beweging**: test dat geen animatie of transitie layout-eigenschappen raakt (de laadbalk animeerde `width`, weg) en dat elke `@keyframes`-naam uniek is (de briefing-cursor overschreef `blink` van de HUD; nu `caret`).
- **Prestatie**: dev-build meet React-tijd van de HUD (`Profiler`, `window.__hud`). Gemeten tijdens een lopend potje op 2× snelheid: 0,47 ms/frame (Chromium, software-GPU), 0,22 (Firefox), 0,17 (WebKit); budget 1 ms.
- **Laadtijd**: de briefing staat er nu vóór het sprite-bakken begint (was 2,4 s → 0,9 s met echte GPU). Met de menu-achtergrond is het spel sneller klaar (2,7 s i.p.v. 9,6 s) omdat gedeelde art al gebakken is. Headless Chromium in de tests gebruikt SwiftShader (software-GPU); daar is alles met WebGL veel trager dan in een echte browser.
- **Visuele regressie**: `e2e/polish.e2e.ts` legt per factie een desktop- (1440×900) en tabletbeeld (1024×768, lade open) vast op vaste seed met bevroren klok (6 baselines, alleen Chromium).
- **Docs**: versie 1.2.0 (package.json, menu), CHANGELOG 1.2.0, README met screenshots (`docs/screenshots/`, opnieuw te maken met `e2e/screenshots.e2e.ts`).
- **Open (buiten dit plan)**: teams in de lobby, shift-waypoints.

### Balansronde 1 — units (2026-10-02, plan/balans-plan.md)

**Meten (B1).** Nieuw: `tests/balance-lab.ts`, met drie onderdelen:
- een lege arena;
- duels tussen twee legers met hetzelfde budget, waarbij leeches, tijdbommen en phase beams uitlopen;
- scenario's met een doelband.

`DUELS=1 npx vitest run duels --silent=false` schrijft de matrix (630 duels, ~6 s) naar `docs/balans/`: `duels-baseline` = voor, `duels-b4` = na. De scenario's draaien voortaan in elke testrun (`tests/balance-scenarios.test.ts`, 17 stuks).

**Helden (B2):**
- Regeneratie pas na 5 s zonder schade (geldt ook voor elite-units).
- **Nova:**
  - pistolen 0,47 → 0,73 s per schot;
  - **C4 is een tijdbom met een lont van 3 s** en een cooldown van 5 s;
  - 1250 schade: elk gebouw in één keer, behalve de Construction Yard (1500 hp) en superwapens (nu ook 1500 hp), die twee ladingen vragen.
- **Grom:** laseraanwijzer elke 14 s (was 8), bereik 7 → 6, luchtaanval 3 × 300 → 3 × 200.
- **The Oracle:**
  - aparte straal voor gebouwen: bereik 4,5 (binnen elke toren), **5 s ononderbroken**, een treffer breekt het af;
  - Construction Yard en superwapens zijn immuun;
  - units overnemen blijft op 7 tegels;
  - Psi Storm 400 → 260 schade, straal 4,5 → 3,5, cooldown 15 → 30 s;
  - hp 220 → 260.

**Mind control (B3):**
- Elke overname **laadt eerst op**: 1 s + 0,5 s per 500 credits van het doel. Je ziet de straal, en wegrijden of de controller doden breekt het af.
- Drones (Leech, Sonar, Delirium) en andere mind-controllers zijn immuun.
- Een onderbroken straal begint opnieuw (eerst bleef de opgebouwde tijd staan, zodat terugrijden direct overname gaf). Waarschuwing "Warning: mind control beam" met radarping, ingesproken door alle drie de announcers (`tools/gen-voices.py --missing` maakt alleen nieuwe regels aan; Piper staat in `~/piper-venv`, stemmen in `~/piper-voices`).
- **Mentalist:** hp 100 → 150, cooldown 2 → 2,5 s, Psi-golf 260 → 200.
- **Hivemind:** overbelasting maximaal +1 (was +2), hp 500 → 700.

**Overige uitschieters (B4):**

| Unit | Wijziging |
|---|---|
| Leech Drone | Stopt na 20 s in een voertuig: een lichte tank is dood, een Colossus overleeft het. |
| Longbow Launcher | Tegen infanterie 0,6 → 0,4, ontploffing 1,6 → 1,3. |
| Lash Tank | Schade 50 → 46, tegen infanterie 1,2 → 0,9. |
| Phase Trooper | 1500 → 1000 credits, hp 130 → 200, bereik 6. |
| Magnetar | Hp 260 → 400, schade 55 → 70, cooldown 40 → 34. |
| Blight Trooper | 600 → 450 credits, hp 150 → 180. |
| Shroud Tank | 1000 → 900 credits, hp 220 → 300. |
| Sapper | Hp 125 → 160. |

**Resultaat:**

| | Nulmeting | Na |
|---|---|---|
| Oracle alleen tegen basis | Construction Yard over na 5 s | Basis houdt stand, Oracle sterft |
| Mind control tegen gelijk budget tanks | Mentalist 4–5×, Hivemind 5–13× | 1,2–2,7× (Rocket Trooper: 3–5×) |
| Nova of Grom + escorte | Construction Yard na 7–12 s | Hooguit 2× zo snel als de escorte alleen |
| Leech Drone tegen Colossus | Colossus opgegeten | Colossus overleeft |

- Hoofdtanks liggen nu tussen 1,0 en 1,6 gemiddeld; geen grondunit staat er nog ver boven.
- Factiebalans AI-tegen-AI op land, 81 potjes: Allies 30, Soviets 24, Psi 27, 0 patstellingen. Buiten de spiegelpotjes 13/24, 11/24, 12/24.
- Zee (27 potjes): Allies 9, Soviets 6, Psi 12; vóór deze ronde 10/6/11.
- Bestaande tests aangepast aan de nieuwe regels: The Oracle (opladen, immuniteit), Grom (twee aanwijzingen nodig), Hivemind (houdt er 4 vast).

**Open:**
- **Zee:** schepen zitten niet in de duelmatrix; de Soviets zijn op zee al langer zwakker. Volgende stap: een zeematrix (dezelfde arena op water).
- **Lucht** scoort hoog tegen grondlegers zonder luchtafweer. Dat is een rol, maar per factie nalopen of goede luchtafweer betaalbaar genoeg is.
- **Specialisten** (Nova, Oracle, Mentalist, Toxin Sniper) scoren laag in een open veldslag zonder hun abilities en micro. Dat is bewust; een speeltest moet laten zien of ze de moeite waard blijven.


### Fun Pass fase 20 — meetinstrumenten (2026-10-02, plan/fun-pass-plan.md)

**Gebouwd** (de nulmeting zelf wacht op speeltest B5 en 1.3.0, besluit 19):
- **Telemetrie** (`systems/telemetry.ts`, `core/events.ts`):
  - alle simulatie-events lopen via `emit()`;
  - `death` heeft `by`, `killer`, `cost`, `cause` en `age`; `underAttack` heeft `by`;
  - nieuwe events: `defeated`, `enqueued`, `ability`, `mindControlStart`/`mindControlBroken`, `mutated`, plus `ability`-events voor de factiemechanieken leech, arccharge, teleport en ambush;
  - snapshots elke 10 s en een productiesteekproef per seconde per wachtrij;
  - beslissingen van mens en AI via `logDecision` in de commando-functies.
  - Uit te zetten met `settings.telemetry = false`. Gaat mee in saves.
- **Read-only bewezen:** `tests/telemetry.test.ts` speelt hetzelfde AI-potje met en zonder telemetrie, en met `oreRules` leeg of `v12`. Winnaar, tick en een hash van de eindstand zijn identiek. Een save met telemetrie loopt gelijk door; een oude save laadt ook.
- **Metrieken A–G** (`tests/meting.ts`): rapport (alarmbellen bovenaan) en `COMPARE` met een bootstrap-interval. **Verliesclassificatie** in `tests/verlies.ts`. Elke metriek en elke verliesoorzaak heeft een test op opgebouwde telemetrie, die aanslaat en die níet aanslaat.
- **`balance.test.ts`** draait nu een volledige kruising (factiepaar × kaart × seed). Nieuw: `BALANCE_REPORT`, `BALANCE_ORE`, `BALANCE_PART` en `BALANCE_CONTROL` (overwinst superwapens).
- **Zeematrix** (`DUELS_SEA=1`) en **regressiescenario's** (`REGRESS=1`, 27 gevechten, geen pass/fail).
- **Export match data** op het scorescherm. `build` is versie + hash van de broncode (geen git, besluit 20); `aiVersion` is `AI_VERSION` in `telemetry.ts`.
- **Hulpmiddelen:** `tools/nulmeting.sh` (alle runs van 20.6; 27 potjes duren ±35 s) en `tools/tijdlijn.html`.

**Eerste bevindingen uit proefruns** (geen nulmeting):
- **"Eerste uitbreiding"** slaat bij de AI vaak al na ±2,5 min aan. Op kleine kaarten ligt de raffinaderij in de basis soms dichter bij een ander veld dan bij het startveld. De definitie komt uit het plan; bespreken vóór de grenzen bevroren worden.
- **PB** ("geld niet besteed") slaat bij de AI in bijna elk verloren potje aan: productie-uptime rond 50%. Dat is precies wat de ijking op `nul-normal-medium` moet rechtzetten.
- **Startvelden** op een kleine kaart zijn binnen ±3 min onder 25% (± $5.000 erts per veld).
- **Zeematrix:** onderzeeërs scoren ±3 tegen schepen zonder sonar; de Bastion Cruiser zakt naar 0,16. Input voor BL1.
- **Regressiescenario 7:** een Thunderhead Airship sloopt een CY tegen de meeste $2.000-opties luchtafweer. Alleen Rocket Troopers, Skyguard SAM en Flak Battery houden hem tegen. Input voor BL2.

**Handmatig potje** (2026-10-06, speeltest B5, `docs/metingen/handmatig/`): Allies tegen Soviets (Normal), medium plains, gewonnen in 6,3 min.
- De export leest zonder fouten in `meting.ts` en `verlies.ts`, met 65 beslissingen van de mens.
- Build `1.2.0+09e9b0aa-dev`: gespeeld op de ontwikkelserver vóór de versiewissel. De broncode-hash is gelijk aan release `1.3.0+09e9b0aa`, dus het is dezelfde code.
- Verliesoorzaak voor de AI: geldig ES (harvesters kwijt, 4,1 min) en PB (3,0 min); hoofdoorzaak PB. Dat bevestigt dat PB geijkt moet worden.
- Beperking gevonden: gratis Ore Haulers bij een raffinaderij tellen niet als "gebouwd" in de unitstatistiek (geen `unitReady`-event). Alleen bij G per unit.

**Nulmeting** (2026-10-06, build `1.3.0+2f1b3f7d`): gedraaid; zie `docs/metingen/2026-10-06-nulmeting-samenvatting.md`.
- Het buildlabel was eerst instabiel: macOS `.DS_Store`-bestanden zaten in de hash. Die worden nu overgeslagen, en testruns krijgen geen `-dev` meer.
- `nulmeting.sh` bewaart nu ook de ruwe telemetrie.

**Open in fase 20:** akkoord op `docs/metingen/grenzen.md` (grenzen, ijking verliesclassificatie, definitie uitbreiding), daarna bevriezen.
