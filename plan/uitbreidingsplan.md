# Uitbreidingsplan — van release candidate naar volwaardige RTS

Status: **fase 7–13 uitgevoerd, versie 1.1.0** (2026-10-01). Fase 14 (campagne) staat bewust niet op de planning. Verslag per fase: `docs/TODO.md`.
Basis: `plan/plan.md` §5 (facties), §13 (abilities), master-prompt fase 4-items die nog open staan.

---

## 0. Uitgangspunt: helden, namen en IP

`plan.md` noemt originele RA2-eenheden (Tanya, Yuri, Boris, Prism Tank, Kirov …).
`plan/assets.md` verbiedt imitaties van beschermde ontwerpen, en de licentie-audit
heeft om die reden al namen als "Tesla Plant" en "Conscript" hernoemd.

**Tanya, Yuri en Boris zijn merk- en auteursrechtelijk beschermde personages van EA.**
Hun naam, uiterlijk, stemregels en portretten gebruiken we dus niet.

Wat wél kan en wat dit plan doet:

- Elke **gameplayrol** uit RA2 krijgt een eigen eenheid met een eigen naam, eigen
  model en eigen achtergrond.
- De rol "elite-commando die gebouwen opblaast" (Tanya-archetype) wordt dus
  bijvoorbeeld **Nova**.
- De rol "psionische leider die alles overneemt" (Yuri-archetype) wordt **De Orakel**.

Spelmechanieken zijn niet beschermd; namen, personages en uiterlijk wel.
Alle namen hieronder zijn voorstellen en makkelijk te wijzigen. Ze staan in één
datatabel.

---

## 1. Wat er nu is (v1.0.0-rc.1)

| | Allied Coalition | Red Bloc | Psi Directorate |
|---|---|---|---|
| Infanterie | Rifleman, Rocket Trooper, Attack Dog, Engineer | Draftee, Arc Trooper, War Hound, Engineer | Adept, Mauler, Mentalist, Engineer |
| Voertuigen | Warden Tank, Lancer IFV, Refractor Tank, Scout Jeep, Ore Hauler | Anvil, Colossus, Longbow, Raider, Ore Hauler | Lash Tank, Spinner Tank, Magnetar, Thrall Hauler |
| Lucht | Kestrel VTOL | Thunderhead Airship | Hover Disc |
| Verdediging | Pillbox, Refractor Tower | Sentry Gun, Arc Coil | Gatling Cannon, Psi Spire |
| Basis (gedeeld) | CY, Power, Refinery, Barracks, Factory, Radar, Tech Center, Repair Depot |||

Mechanieken die er zijn:

- splash, AA, mind control
- engineer-capture, veterancy, repair depot
- lucht (zonder munitie/landingsplaats)
- water en bruggen (niet vernietigbaar)

Wat ontbreekt t.o.v. RA2:

- zee
- garrison
- superwapens
- actieve abilities
- helden
- transport
- stealth/detectie
- MCV
- muren
- tech-gebouwen
- spion
- AI-gebruik van dat alles

---

## 2. Doel-roster per factie

Legenda: ✅ bestaat · 🆕 nieuw · (archetype uit plan.md).

### 2.1 Allied Coalition — flexibel, hightech, teleportatie

**Infanterie**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Rifleman | ✅ | GI | Anti-infanterie. 🆕 **ability "Ingraven"**: staat stil, meer bereik en pantser. |
| Rocket Trooper | ✅ | Guardian GI | Anti-tank. |
| Skyjumper | 🆕 | Rocketeer | Jetpack-infanterie die vliegt; alleen AA kan hem raken. |
| Attack Dog | ✅ | Dog | Snelle infanteriekiller, detecteert spionnen. |
| Engineer | ✅ | Engineer | Capture/repair. |
| Infiltrator | 🆕 | Spy | Vermomd als vijandelijke infanterie. Infiltratie-effect per gebouw, zie §3.7. |
| Phase Trooper | 🆕 | Chrono Legionnaire | Teleporteert in plaats van lopen; "faset" een doelwit langzaam uit de tijd (doel bevroren, daarna weg). Tech Center vereist. |
| **Nova** (held) | 🆕 | Tanya | Max. 1. Dubbele pistolen doden infanterie in één schot; C4 op gebouwen en schepen; kan zwemmen. |

**Voertuigen**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Warden Tank | ✅ | Grizzly | Hoofdtank. |
| Lancer IFV | ✅ | IFV | AA. 🆕 **Transport voor 1 infanterist; het wapen wisselt per passagier**: rocket → AA, engineer → reparatie, rifle → MG. |
| Refractor Tank | ✅ | Prism Tank | Kettingstraal. |
| Shroud Tank | 🆕 | Mirage Tank | Ziet eruit als een boom zolang hij stilstaat (stealth tot hij vuurt). |
| Base Crawler | 🆕 | MCV | Gedeeld door alle facties. Rijdt en ontplooit tot Construction Yard. |
| Amphibious Transport | 🆕 | — | Gedeeld. Land + water, 8 infanterie of 1 voertuig. |

**Lucht**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Kestrel VTOL | ✅ | Harrier | 🆕 Munitie; herlaadt op het Airfield. |
| Talon Strike Jet | 🆕 | Black Eagle | Zware bom, munitie 1, Tech Center vereist. |

**Zee**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Picket Destroyer | 🆕 | Destroyer | Kanon plus anti-sub (detecteert onderzeeërs). |
| Bastion Cruiser | 🆕 | Aegis | Zware AA. |
| Skyhaven Carrier | 🆕 | Aircraft Carrier | Lanceert drones; groot bereik. |
| Sonar Drone | 🆕 | Dolphin | Snel, sonische straal, detecteert subs; bevrijdt van grijparmen. |

**Gebouwen**

| Gebouw | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Airfield | 🆕 | Air Force Command | 4 landingsplekken; vereist voor vliegtuigen. Geeft ook een spionagevlucht (support power). |
| Naval Yard | 🆕 | Shipyard | Op water geplaatst; repareert schepen. |
| Skyguard SAM | 🆕 | Patriot | AA-verdediging. |
| Allied wall | 🆕 | Wall | Muur. |
| **Phase Gate** (superwapen) | 🆕 | Chronosphere | Teleporteert een groep voertuigen. Infanterie sterft, behalve Phase Trooper en Nova. |
| **Storm Engine** (superwapen) | 🆕 | Weather Control | Bliksemstorm boven een gebied. |

### 2.2 Red Bloc — pantser, artillerie, brute kracht

**Infanterie**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Draftee | ✅ | Conscript | Goedkope infanterie. |
| Arc Trooper | ✅ | Tesla Trooper | Elektrisch; 🆕 laadt Arc Coils op (meer bereik, werkt ook bij stroomtekort). |
| Flak Gunner | 🆕 | Flak Trooper | AA-infanterie. |
| Sapper | 🆕 | Crazy Ivan | Plakt een tijdbom op alles, ook op eigen eenheden. |
| Blight Trooper | 🆕 | Desolator | Ontplooit tot een stralingsveld dat infanterie op de grond doodt. |
| War Hound | ✅ | Dog | Snelle infanteriekiller. |
| Engineer | ✅ | Engineer | Capture/repair. |
| **Grom** (held) | 🆕 | Boris | Max. 1. Markeert gebouwen met een laser; een bommenwerpervlucht volgt. |

**Voertuigen**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Anvil | ✅ | Rhino | Hoofdtank. |
| Colossus | ✅ | Apocalypse | Superzware tank. |
| Longbow | ✅ | V3 | Artillerie. |
| Raider | ✅ | — | Snelle verkenner. |
| Flak Hauler | 🆕 | Flak Track | AA plus transport voor 5 infanterie. |
| Leech Drone | 🆕 | Terror Drone | Kruipt in een voertuig en vreet het van binnenuit op; alleen een repair depot redt het. |
| Siege Rotor | 🆕 | Siege Chopper | Helikopter die landt en ontplooit als artillerie. |
| Base Crawler | 🆕 | — | Gedeeld. |
| Amphibious Transport | 🆕 | — | Gedeeld. |

**Zee**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Flak Boat | 🆕 | Sea Scorpion | AA plus licht. |
| Barracuda Sub | 🆕 | Typhoon | Onzichtbaar onder water; torpedo's alleen tegen schepen. |
| Leviathan | 🆕 | Dreadnought | Raketschip met langeafstandsraketten (onderschepbaar door AA). |
| Kraken | 🆕 | Giant Squid | Onzichtbaar; grijpt en verbrijzelt schepen. |

**Gebouwen**

| Gebouw | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Flak Battery | 🆕 | Flak Cannon | AA-verdediging. |
| Naval Yard | 🆕 | — | Op water geplaatst. |
| Assembly Plant | 🆕 | Industrial Plant | Voertuigen 25% goedkoper en sneller. |
| Bloc wall | 🆕 | — | Muur. |
| **Hammer Silo** (superwapen) | 🆕 | Nuclear Silo | Enorme explosie plus straling. |
| **Stasis Projector** (superwapen) | 🆕 | Iron Curtain | 20 s onkwetsbaarheid voor voertuigen en gebouwen; infanterie sterft. |

### 2.3 Psi Directorate — mind control, onconventioneel

**Infanterie**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Adept | ✅ | Initiate | Basisinfanterie. |
| Mauler | ✅ | Brute | Zware infanterie. |
| Mentalist | ✅ | Yuri Clone | Mind control; 🆕 **ability "Psi-golf"** (doodt infanterie rondom). |
| Toxin Sniper | 🆕 | Virus | Lang bereik; slachtoffers laten een gifwolk achter. |
| Thrall | 🆕 | Slave | Komt mee met de Thrall Hauler; delft handmatig en wordt vrij als de hauler sterft. |
| Engineer | ✅ | Engineer | Capture/repair. |
| **De Orakel** (held) | 🆕 | Yuri Prime | Max. 1. Neemt ook gebouwen over (inclusief CY) en is sterker dan de Mentalist. |

**Voertuigen**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Lash Tank | ✅ | Lasher | Hoofdtank. |
| Spinner Tank | ✅ | Gatling | Vuurt steeds sneller. |
| Magnetar | ✅ | Magnetron | Magneetstraal. |
| Thrall Hauler | ✅ | Slave Miner | 🆕 Ontplooit tot een mobiele raffinaderij. |
| Hivemind | 🆕 | Mastermind | Beheerst tot 3 eenheden; daarboven raakt hij overbelast en neemt hij schade. |
| Delirium Drone | 🆕 | Chaos Drone | Gaswolk; getroffen vijanden vallen alles in de buurt aan (berserk). |
| Base Crawler | 🆕 | — | Gedeeld. |
| Amphibious Transport | 🆕 | — | Gedeeld. |

**Lucht**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Hover Disc | ✅ | Floating Disc | 🆕 Zuigt stroom uit centrales of geld uit raffinaderijen. |

**Zee**

| Eenheid | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Psi Submarine | 🆕 | Boomer | Raketten tegen land; onzichtbaar. |

**Gebouwen**

| Gebouw | Status | Archetype | Rol / mechaniek |
|---|---|---|---|
| Reclaimer | 🆕 | Grinder | Recyclet eigen of overgenomen eenheden tot credits. |
| Duplicator Vats | 🆕 | Cloning Vats | Elke getrainde infanterist komt dubbel. |
| Psi Beacon | 🆕 | Psychic Sensor | Toont vijandelijke aanvalsdoelen op de minimap. |
| Psi wall | 🆕 | — | Muur. |
| **Dominion Engine** (superwapen) | 🆕 | Psychic Dominator | Neemt alles in een gebied permanent over. |
| **Mutagen Spire** (superwapen) | 🆕 | Genetic Mutator | Verandert infanterie in een gebied in Maulers voor jou. |

### 2.4 Neutraal en kaart

- **Burgergebouwen (garrisonable):** woonblok, kantoor, kerk/hal, boerderij.
  - Mapgen zet ze in clusters.
  - Infanterie kan erin; het gebouw vuurt met de gecombineerde kracht.
  - Ontruimen gebeurt door vernietigen of met wapens die tegen garrison sterk zijn (Draftee/Flak/Desolator-achtig).
- **Tech-gebouwen** (te capturen met een engineer):

  | Gebouw | Effect |
  |---|---|
  | Fuel Rig | +inkomen |
  | Field Hospital | geneest infanterie |
  | Machine Shop | geneest voertuigen |
  | Civil Airport | paradrop |
  | Outpost | extra zicht |

- **Vernietigbare bruggen** met een Bridge Repair Hut (engineer repareert).
- **Kratten** (optioneel, aan of uit in de setup): geld, veterancy, genezing, onthullen.
- **Nieuwe kaarttypes:** *Coast* (land met een grote zee) en *Islands*, voor de vloot.

---

## 3. Nieuwe systemen (engine)

Alles blijft deterministisch en volledig data-gedreven (`data/*.ts`). Elk systeem
krijgt eigen unit-tests en een soak-invariant.

1. **Ability-systeem** (`systems/abilities.ts`)
   - `AbilityDef`: cooldown, doeltype (`self` / `point` / `unit` / `building`), bereik, effect-id.
   - UI-knop in het selectiepaneel plus sneltoets (D = deploy, eerst-vrije F-toetsen).
   - Cursorstand bij targeting, met een cooldown-ring op de knop.
   - Dekt: Ingraven, Psi-golf, Blight-ontplooiing, Siege Rotor landen, Thrall Hauler ontplooien, Base Crawler ontplooien, C4, laseraanwijzing.
2. **Superwapens / support powers** (`systems/powers.ts`)
   - Laadtijd. Pauzeert bij stroomtekort.
   - Iedereen krijgt een waarschuwing als een superwapen wordt gebouwd en als het klaar is.
   - Knoppen in de sidebar plus een targeting-cursor.
   - Instelling in de skirmish-setup: aan of uit.
3. **Helden**
   - `limit: 1` op de UnitDef.
   - Herbouwbaar na de dood.
   - Eigen portret-icoon (eigen art) en een unieke selectiering.
4. **Transport**
   - `passengers` op een eenheid; laden met rechtsklik op de transporter, lossen met D.
   - Passagiers sterven mee, behalve bij de amfibische transporter op land.
   - Het IFV-wapen wisselt per passagier.
5. **Zee**
   - Movement-laag per type: land, water, amfibisch, lucht.
   - `regions()` per laag.
   - Naval Yard plaatsen op water.
   - Schepen kunnen niet het land op; ze kunnen wel kust-eenheden raken.
6. **Stealth en detectie**
   - Vlag `stealth` (subs, Kraken, Shroud Tank, vermomde Infiltrator).
   - `detects`-radius (Picket Destroyer, Sonar Drone, honden, Psi Beacon).
   - Onzichtbaar voor de vijand tenzij gedetecteerd. Ook de AI ziet het niet: geen valsspelen.
7. **Infiltratie** (Infiltrator in een vijandelijk gebouw):

   | Gebouw | Effect |
   |---|---|
   | Refinery | steelt geld |
   | Power | stroom valt 30 s uit |
   | Radar | reset zijn kaart |
   | Barracks / Factory | eigen eenheden worden veteraan |
   | Superwapen | reset de timer |

8. **Garrison**
   - Burgergebouwen in mapgen, plus het in- en uitstappen van infanterie.
   - Het gebouw krijgt het wapen van de bewoners.
9. **Statuseffecten** (gedeeld systeem)
   - bevroren (fase), onkwetsbaar (stasis), berserk (delirium), straling/gif (DOT-zone)
   - leech (drone in voertuig), gegrepen (Kraken), opgeladen (Arc → coil)
10. **Vliegtuigmunitie en landingsplaatsen** voor Kestrel en Talon.
11. **Base Crawler**: meerdere bouwvelden. De CY kan weer inpakken.
12. **Muren**: sleep-plaatsen (een lijn tiles), blokkeren pathing.
13. **Economie-extra's**: Reclaimer, Duplicator Vats, Assembly Plant, disc-diefstal, Fuel Rig.

---

## 4. Art en audio (zelfde regels als nu)

- Bronnen zijn alleen CC0 of CC-BY met juiste attributie, geregistreerd in
  `docs/asset-register.md` en zichtbaar in de credits.
- Alles wordt gebakken naar isometrische sprites, net als nu.
- **Licenties worden pas als "goedgekeurd" geregistreerd nadat ik de bronpagina heb gecontroleerd.**
  Kandidaten (nog niet gecontroleerd):

  | Nodig voor | Kandidaat-bron |
  |---|---|
  | Schepen | Kenney (Watercraft / Pirate Kit), Quaternius-schepen |
  | Helden en extra infanterie | Quaternius geanimeerde characters, varianten van het bestaande `trooper.glb` (andere kleur, uitrusting, wapen) |
  | Helikopter, drone, onderzeeër | Quaternius / Kenney (Space Kit heeft drones), Poly Pizza |
  | Burger- en tech-gebouwen | Kenney City Kit (Suburban/Commercial), al gebruikte Industrial Kit |
  | Superwapens | samenstellingen uit Kenney Space Kit (zoals de huidige lab/coil) |
  | Effecten (straling, gif, bliksem, teleport) | procedureel in `render/fx.ts`; geen nieuwe assets nodig |

- Waar niets passends gevonden wordt, komt een samengesteld model uit bestaande
  kits plus de factie-tint. Dat wordt gemarkeerd als placeholder in het register.
- Geen stemmen van bestaande games. Wel eventueel CC0 "unit acknowledgement"-blips.

---

## 5. Fasering

Elke fase eindigt speelbaar, met groene tests (vitest, tsc, soak, e2e) en een
Nederlands rapport. De volgorde volgt de afhankelijkheden: systemen eerst,
daarna de inhoud die ze gebruikt.

| Fase | Inhoud | Omvang |
|---|---|---|
| **7. Fundament** | Ability-systeem + UI, statuseffecten-framework, transport, hero-limiet, Base Crawler (+ CY inpakken), muren, AA-gebouwen (Skyguard, Flak Battery), vliegtuigmunitie + Airfield | L |
| **8. Infanterie & helden** | Skyjumper, Infiltrator (+ infiltratie, detectie door honden), Phase Trooper, Flak Gunner, Sapper, Blight Trooper, Toxin Sniper, Thrall; **Nova, Grom, De Orakel**; Rifleman-ingraven, Psi-golf | L |
| **9. Voertuigen & lucht** | Shroud Tank (stealth), Flak Hauler, Leech Drone, Siege Rotor, Hivemind, Delirium Drone, Talon Strike Jet, Amphibious Transport; IFV-passagierswapen; Hover Disc-diefstal; Thrall Hauler-ontplooiing | L |
| **10. Kaart & neutraal** | Burgergebouwen + garrison, tech-gebouwen, vernietigbare bruggen + repair hut, kratten, kaarttypes Coast/Islands | M |
| **11. Zee** | Movement-lagen, Naval Yards, 9 schepen, sub-detectie, Kraken-grijp, kustgevecht | L |
| **12. Superwapens & economie** | 6 superwapens + waarschuwingen + setup-optie, Assembly Plant, Reclaimer, Duplicator Vats, Psi Beacon, Arc-coil-opladen | M |
| **13. AI, balans, release** | AI gebruikt álles (helden, transport, garrison, vloot op waterkaarten, superwapens, abilities, detectie); balansronden per matchup; soak uitgebreid met nieuwe invarianten; e2e uitgebreid; v1.1 | L |
| *14. (optioneel) Campagne* | Scriptbare missies (triggers, doelen, briefings), 3–4 missies per factie | XL |

Bij elke fase zet ik subagents parallel in waar de bestanden niet overlappen:
art/assets, systemen en AI apart, zoals in fase 3–6.

Totaal nieuw:

- ~30 eenheden
- ~25 gebouwen/structuren
- 6 superwapens
- ~12 abilities

### Testaanpak per fase

- Unit-test per mechaniek (zoals de bestaande `describe('fase 4')`-blokken).
- Soak-invarianten erbij:
  - geen eenheid permanent in een transport of garrison na de dood van de houder
  - geen statuseffect blijft hangen
  - superwapens laden niet bij stroomtekort
  - schepen nooit op land
- Balansrun per fase: geen factie wint meer dan ~60% in mirror-loze duels per moeilijkheid.
- e2e: per fase één nieuw scenario via de echte UI (ability-knop, superwapen afvuren, garrison).

---

## 6. Beslissingen voor jou

1. **Helden-namen**: akkoord met eigen personages (Nova, Grom, De Orakel) in plaats
   van Tanya/Boris/Yuri? Dit advies ik sterk: het past bij je eigen asset-regels en voorkomt IP-problemen.
2. **Campagne** (fase 14): wil je die, of is skirmish de focus?
3. **Volgorde**: zee is het grootste losse stuk. Eerder (na fase 7) of later (zoals nu)?
4. **Superwapens standaard aan** in skirmish? Dit is mijn voorstel, zoals in het origineel.
5. **Namen**: lijst §2 akkoord, of wil je zelf namen kiezen?
