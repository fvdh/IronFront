# Balansplan units (versie 1.3.0)

_Status 2026-10-06: **afgerond als 1.3.0.** B1–B4 uitgevoerd, B5 gemeten en door de gebruiker gespeeld. Details en cijfers in `docs/TODO.md` ("Balansronde 1")._

_**Afronding (besluit 2026-10-02):** na de speeltest B5 gaat deze ronde uit als 1.3.0. De punten die hun "Klaar als" niet halen, worden niet meer in deze ronde opgelost maar doorgeschoven naar het Fun Pass-plan (`plan/fun-pass-plan.md`, menu BL): lucht (3–4,5 in `duels-b4`), Lash Tank (1,57) en Anvil (1,40) buiten 0,8–1,25 (BL2, BL4); zeeband niet gehaald, Red Bloc 6/27 en Psi 12/27 (BL1); Delirium Drone niet aangepast (BL5)._

Opgesteld 2026-10-02. Doel: elke unit heeft een duidelijke rol, een counter en een prijs die past bij wat hij doet. Helden en mind control zijn sterk, maar niet in hun eentje beslissend.

## 1. Waarom de huidige balansmeting dit mist

De balans van 1.1.0 is gemeten met AI-tegen-AI (81 potjes, facties gelijk: 27 · 27 · 26). Dat zegt iets over facties als geheel, niet over losse units:

- De AI gebruikt helden en mind control **zonder micro**. Ze lopen gewoon mee in een aanvalsgolf. Een speler die Nova met C4 een basis laat binnensluipen, of The Oracle vanaf 7 tegels een Construction Yard laat overnemen, haalt veel meer uit dezelfde unit.
- Een factie kan gemiddeld kloppen terwijl één unit veel te sterk is en een andere nooit de moeite waard is.

Daarom komt er eerst een meetinstrument per unit (fase B1), en pas daarna gaan de cijfers om.

## 2. Eerste analyse (statisch, uit `data/units.ts` en `data/weapons.ts`)

Schade per seconde (dps) tegen het pantser dat een unit moet bestrijden, en "waarde" = dps × levenspunten / kosten² (hoe meer, hoe kosteneffectiever). Een gewone tank zit rond 150–300.

| Unit | Kosten | Wat valt op |
|---|---|---|
| **Nova** (held) | 1500 | 343 dps tegen infanterie op 5,5 tegels: elke 0,47 s een dode soldaat. **C4 sloopt elk gebouw in één keer** (4000 schade, ook de Construction Yard met 1500 hp), elke 2 s. Regenereert 4,5 hp/s, ook midden in een gevecht. Kan zwemmen. |
| **Grom** (held) | 1500 | 122 dps tegen infanterie én **61 tegen lichte voertuigen**. Laseraanwijzer: elke 8 s drie luchtaanvallen van 300 (≈ 112 dps tegen gebouwen) vanaf 7 tegels, buiten bereik van de Pillbox (5,5) en Sentry Gun (6,5). |
| **The Oracle** (held) | 1800 | **Neemt gebouwen blijvend over**, elke 1,7 s, vanaf 7 tegels: ook de Construction Yard, fabrieken en verdediging. Psi Storm: 400 schade in een straal van 4,5 tegels, elke 15 s. |
| **Mentalist** | 800 | Neemt direct elke niet-held over (Colossus 1750, Airship 2000) tot hij sterft. Psi-golf 260 schade (straal 3) elke 20 s. |
| **Hivemind** | 1750 | Houdt 3 units vast, met overbelasting zelfs 5. |
| **Leech Drone** | 500 | Kruipt in een voertuig en eet 36 hp/s **tot een Repair Depot hem verwijdert**. Een Colossus (1750) is in 28 s dood. |
| **Mauler** | 500 | Waarde 991, de hoogste van alle gewone units (340 hp, 73 dps tegen alles). Wel melee. |
| **Phase Trooper** | 1500 | 110 dps tegen alles, het doelwit is bevroren en onkwetsbaar tot het verdwijnt. Breekbaar (130 hp). |
| **Toxin Sniper** | 600 | 125 schade op 9 tegels: elke Rifleman (125 hp) in één schot, plus gifwolk. |
| Anvil Heavy Tank | 850 | Juist **zwak** per credit (waarde 149 tegen 253 voor de Warden en 300 voor de Lash). |
| Refractor Tank | 1200 | 160 hp voor 1200: valt bij alles om (waarde 35). |

Veteranie versterkt dit: elke rang geeft +20 % schade en −15 % schade ontvangen, en een held krijgt de kosten van elk slachtoffer als ervaring, dus is snel elite.

## Besluiten (2026-10-02)

- **The Oracle:** gebouwen overnemen vraagt 5 s ononderbroken straal (schade breekt het af); Construction Yard en superwapens immuun.
- **Mind control:** opladen naar doelwaarde (1 s + 0,5 s per 500 credits), zichtbaar en onderbreekbaar; drones/robots immuun.
- **Nova C4:** lont van 3 s en 5 s cooldown.
- **Volgorde:** eerst meten (B1), dan aanpassen.

## Resultaat B1 (nulmeting, 2026-10-02)

Instrument: `src/game/tests/balance-lab.ts` (arena, duels, scenario's), rapport `DUELS=1 npx vitest run duels --silent=false` → `docs/balans/duels-baseline.md` en `.csv`. 630 duels in 6 s.

**Bevestigd te sterk:**
- **The Oracle** neemt in zijn eentje binnen **5 s** een Construction Yard over, tegen elke basis.
- **Mind control:** 2 Mentalists ruilen 4–5× zo goed als hetzelfde budget aan tanks; een Hivemind 5–13×. Gemiddeld tegen voertuigen: Hivemind 4,34, Mentalist 1,97, Oracle 2,73.
- **Nova en Grom met steun:** met 2 tanks erbij valt de Construction Yard na 7 s (Nova, C4) of 12 s (Grom, luchtaanval). Alleen sterven ze tegen 2 verdedigingsgebouwen, dat is goed.
- **Leech Drone** eet een Colossus helemaal op.
- **Longbow Launcher** (1,86 gemiddeld, 3,91 tegen infanterie) en de **Lash Tank** (1,50, tegen 1,05 voor de Warden en 1,25 voor de Anvil).

**Niet te sterk in een open gevecht:** Nova (1,66 tegen infanterie; haar kracht zit in C4), Grom (0,69). Het geweer van Grom hoeft dus niet aangepast; alleen de luchtaanval.

**Onverwacht zwak** (gemiddeld onder 0,6; niemand zou ze bouwen):

| Unit | Gemiddelde |
|---|---|
| Phase Trooper | 0,17 |
| Magnetar | 0,26 |
| Blight Trooper | 0,27 |
| Shroud Tank | 0,36 |
| Sapper | 0,43 |
| Delirium Drone | 0,56 |

**Lucht** scoort hoog (Airship, Disc, Talon, Skyjumper rond 4). Dat komt doordat de meeste grondunits geen luchtafweer hebben. Dat is een rol, geen fout, maar het hoort bij B4: is er per factie genoeg betaalbare luchtafweer?

**Statische analyse klopte niet overal:** de Anvil is in duels niet zwak (1,25); zijn extra hp compenseert de lage schade. Die blijft van de lijst.

## 3. Uitgangspunten

1. **Elke unit heeft een counter** die goedkoper is dan de unit zelf.
2. **Kosteneffectiviteit** in de eigen rol ligt tussen 0,8 en 1,25 (zie 4a). Erboven = te sterk, eronder = niemand bouwt hem.
3. **Helden** zijn een vermenigvuldiger, geen leger. Een held alleen wint niet van een normaal verdedigde basis (2 verdedigingsgebouwen). Met steun wel.
4. **Mind control** blijft het hart van Psi, maar met tegenspel: je ziet het aankomen, je kunt het onderbreken, en dure units kosten meer moeite.
5. **Geen instant-win-knoppen.** Eén klik mag geen Construction Yard of superwapen kosten.

## 4. Fasen

### B1 — Meten (eerst, zonder cijfers aan te passen)

a. **Duelmatrix** (`src/game/tests/duels.test.ts`, opt-in `DUELS=1`). Voor elk paar gevechtsunits: twee legers van elk 3000 credits op een open veld, beide met attack-move, tot één kant op is of 90 s voorbij zijn. Uitkomst: kosteneffectiviteit (vernietigde waarde / verloren waarde) per paar, plus per unit een gemiddelde over de matchups uit zijn eigen rol. Rapport als tabel in `docs/balans/duels.md`, zodat elke ronde vergelijkbaar is.

b. **Scenario's met een doelband** (snel, draaien in de normale testrun). Voorbeelden:
- Held alleen tegen een standaardbasis (CY, Power Plant, Barracks, 2 verdediging): de held mag **niet** winnen.
- Held + 1500 aan steun tegen dezelfde basis: moet kunnen winnen.
- The Oracle tegen een basis: de Construction Yard mag niet binnen 10 s van zijn kant wisselen.
- 2 Mentalists (1600) tegen 1600 aan tanks: geen eenzijdige uitslag (50–70 % voor een van beide).
- Leech Drone tegen een Colossus: de Colossus overleeft het zonder depot.
- Nova tegen 6 Riflemen (1200): mag winnen, maar niet zonder schade.

c. **Factiebalans** met de bestaande AI-tegen-AI-meting (81 potjes land, 27 zee) als regressie: geen factie boven 40 % of onder 27 %, geen zetel-bias.

**Klaar als:** basisrapport van huidige stand staat in `docs/balans/`, met de uitschieters bevestigd of ontkracht.

### B2 — Helden

Voorstel (wordt bijgesteld na B1):
- **Algemeen:** regeneratie alleen na 5 s zonder schade (nu ook midden in een gevecht). Helden blijven immuun voor mind control.
- **Nova:**
  - pistolen 0,47 → 0,73 s per schot (blijft één schot per Rifleman, minder doden per seconde);
  - **C4 krijgt een lont van 3 s** (net als de Sapper) en 5 s cooldown, zodat een basis niet in seconden verdwijnt.
- **Grom:** laseraanwijzer elke 14 s in plaats van 8, luchtaanval 3 × 300 → 3 × 200, bereik 7 → 6 (binnen bereik van torens). Geweer blijft (B1: niet te sterk).
- **The Oracle:**
  - een gebouw overnemen vraagt **5 s ononderbroken straal** (je ziet het, en schade aan The Oracle breekt het af);
  - **Construction Yard en superwapens zijn immuun**;
  - Psi Storm 400 → 260 schade, straal 4,5 → 3,5, cooldown 15 → 30 s.

**Klaar als:** de held-scenario's uit B1 binnen hun band vallen.

### B3 — Mind control

Voorstel:
- **Opladen voordat het lukt:** een straal van 1 s + 0,5 s per 500 credits van het doel (Rifleman ~1,2 s, Colossus ~2,7 s). Doodt of verplaatst de vijand de controller in die tijd, dan mislukt het. Er komt een zichtbare straal plus een announcer-waarschuwing.
- **Mentalist:**
  - cooldown 2 → 3 s, bereik 5 → 4,5;
  - Psi-golf 260 → 200 schade.
  - _Uitgevoerd (zie `docs/TODO.md`): hp 100 → 150, cooldown 2 → 2,5 s, bereik blijft 5, Psi-golf 260 → 200._
- **Hivemind:** 3 units, overbelasting maximaal +1 (nu +2). _Uitgevoerd, plus hp 500 → 700._
- **Immuun:** drones en robots (Leech Drone, Sonar Drone, Delirium Drone), naast helden en andere mind-controllers.
- AI: de Psi-AI moet het opladen begrijpen (niet wegrennen halverwege).
- _Uitgevoerd: zichtbare straal, waarschuwing met radarping en gesproken zin ("Warning: mind control beam"), een onderbroken straal begint opnieuw (test in `phase9.test.ts`). De AI blijft staan zolang het doel binnen bereik is._

**Klaar als:** het mind-control-scenario binnen zijn band valt en Psi in de factiemeting niet onder 27 % zakt.

### B4 — Overige uitschieters

Alleen wat B1 bevestigt. Kandidaten:
- **Leech Drone:** sterft na 600 schade (of 20 s) in het voertuig. _Uitgevoerd als: stopt na 20 s in een voertuig (geen schadegrens)._
- **Mauler:** 500 → 600 credits of minder hp.
- **Phase Trooper:** effectiviteit tegen helden en zware tanks controleren.
- **Toxin Sniper:** cooldown 2,5 → 3 s als hij infanterie te makkelijk wegvaagt.
- **Omlaag:** Longbow Launcher (vooral tegen infanterie), Lash Tank richting de andere hoofdtanks.
- **Omhoog** (uit B1): Phase Trooper, Magnetar, Blight Trooper, Shroud Tank, Sapper, Delirium Drone.
- **Luchtafweer** per factie nalopen tegen Airship, Disc, Talon en Skyjumper.

**Klaar als:** alle gevechtsunits in de duelmatrix binnen 0,8–1,25 in hun rol vallen, of een vastgelegde reden hebben waarom niet (bijvoorbeeld de Dog: goedkope one-shot tegen infanterie, waardeloos tegen al het andere).

_Stand: niet gehaald voor lucht, Lash Tank en Anvil; doorgeschoven naar Fun Pass menu BL (zie status bovenaan)._

### B5 — Factiecheck en speeltest

- De AI-tegen-AI-meting (land + zee + spiegel).
- Tooltips en beschrijvingen bijwerken naar de nieuwe cijfers.
- Een korte speeltestlijst voor jou: per held een scenario, Psi tegen elk van de andere twee, een Leech-aanval.

**Klaar als:** factiewinsten tussen 27 % en 40 %, alle tests groen, beschrijvingen kloppen, versie 1.3.0.

_Stand: land gehaald (30/24/27 van 81); zee niet (Red Bloc 6/27, Psi 12/27), doorgeschoven naar Fun Pass menu BL1. De Fun Pass meet factiebalans voortaan als winrate in niet-spiegelpotjes (40–60%); dit aandeel wordt ernaast gerapporteerd._

## 5. Risico's

- **Nieuwe mechanieken** (opladen van mind control, C4-lont, regen pas na 5 s) vragen code in combat en AI, niet alleen cijfers. Die zitten in B2/B3 en krijgen eigen tests.
- **Bestaande tests** die vaste cijfers controleren (fase 8–13) gaan mee veranderen. Die pas ik bewust aan, niet blind.
- **Duelmatrix ≠ echt spel:** open veld zonder terrein en micro. Daarom samen met de scenario's en de AI-meting, en jouw speeltest.

## Speeltestlijst (B5)

1. **Nova:** sluip met 2–3 tanks een basis in. De C4 moet 3 s tikken (genoeg om te reageren) en een Construction Yard vraagt twee ladingen.
2. **Grom:** laat hem een gebouw aanwijzen. Staat hij binnen bereik van een toren?
3. **The Oracle:** probeer een toren over te nemen terwijl die op haar schiet; dat moet mislukken. Een onverdedigd gebouw lukt na 5 s.
4. **Mind control:** stuur 3 Mentalists op een tankgroep af. Zie je de straal, en kun je wegrijden voordat hij aanslaat?
5. **Leech Drone:** laat er een in je Warden kruipen (dood) en in je Colossus (overleeft).
6. **Psi tegen elk van de andere twee**, op normal en hard: voelt Psi nog als Psi?

