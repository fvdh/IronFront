# Grenzen voor de Fun Pass (§2 regel 6)

Status: **BEVROREN** (2026-10-06, akkoord opdrachtgever), vóór fase 22. In 1.4 wijzigt hier niets meer; een afwijking is een bevinding.
Basis: nulmeting `1.3.0+2f1b3f7d` (`2026-10-06-nulmeting-samenvatting.md`).

**Twee soorten grenzen.**
- Een **doelgrens** bepaalt of een probleem opgelost is. Wie een gameplaywijziging voorstelt, toont aan dat een doelgrens geschonden is en daarna wordt gehaald.
- Een **alarmgrens** signaleert alleen een afwijking van de nulmeting. Een alarm betekent "onderzoek waarom", niet "fix dit".

> **Alarmgrenzen signaleren afwijkingen; doelgrenzen bepalen of een probleem opgelost is. Een alarm op zichzelf is geen reden voor een gameplaywijziging.**

## 1. Doelgrenzen (wanneer een probleem opgelost is)

| Onderwerp | Metriek | Grens | Type | Basiswaarde 1.3.0 | Bron |
|---|---|---|---|---|---|
| Factiebalans | Winrate niet-spiegel, puntschatting, land en zee | 40–60% | Doelgrens | Land 61 / 50 / 39%; zee 56 / 25 / 69% | Beslissing 21 |
| Kosteneffectiviteit | Gemiddelde in eigen rol (duelmatrix) | 0,8–1,25, of een vastgelegde reden | Doelgrens | `nul-duels` | Balansplan, uitgangspunt 2 |
| Comeback (AI) | % potjes gewonnen na ≥ 40% achterstand | ≥ 15% | Doelgrens | 17% land, 31% zee | Fase 27 |
| Superwapen, kernsignaal | Bak `gelijk` (zie hieronder), n ≥ 15 | ≤ 10% | Doelgrens | onbeslist (n = 1) | Fase 24 |
| Superwapen, aandeel | In vernietigde/overgenomen waarde | ≤ 10% | Doelgrens | 0–0,4% | Fase 24 |
| Superwapen, overwinst | Per bak | ≤ 10 pp | Doelgrens | onbeslist | Fase 24 |
| Factiebalans met/zonder superwapens | Verschil in winrate | ≤ 5 pp | Doelgrens | ≤ 3 pp (land), 0 (zee) | Fase 24 |
| Beslissend gevecht na 15 min | % potjes | ≤ 25% | Doelgrens | 1% land, 0% zee | Fase 24 |
| Legerconcentratie na 15 min | Mediaan | ≤ 60% | Doelgrens | 80%, **n = 2: onvoldoende basis**, geen alarmgrens | Fase 24 |
| Patstellingen | % potjes in de meetset | ≤ 2% | Doelgrens | 0% land/zee, 4% Normal-medium | Fase 23 (E1) |
| Niveaus | Hard wint van Normal, Normal van Easy | ≥ 60% | Doelgrens | nog niet gemeten | Fase 26 |

**Superwapen-kernsignaal, exacte definitie** (al vastgelegd in `plan/fun-pass-plan.md`, superwapen-meting; hier herhaald zodat er geen discussie over is):
- Per potje telt alleen het **eerste schot**.
- De bak hangt af van de **voorsprong vóór het schot**: totale waarde (leger + gebouwen + credits) van de schutter gedeeld door die van de tegenstander, op het moment van schieten. `voor` > 1,25×, **`gelijk` 0,8–1,25×**, `achter` < 0,8×. De indeling op legerwaarde staat er als controle naast.
- Kernsignaal: het percentage schoten in bak `gelijk` waarna de tegenstander **binnen 90 s is uitgeschakeld**.
- De grens geldt pas vanaf n ≥ 15 schoten in de bak; daaronder is de uitkomst **onbeslist**.
- `voor` → schot → winst is normaal en telt niet mee. Of de schutter "toch al gewonnen had", meet de overwinst: de winrate van de schutters per bak, min die van spelers met dezelfde voorsprong op dezelfde minuut in de run zonder superwapens.

**Legerconcentratie.** De doelgrens van 60% blijft staan. Een mediaan van twee waarnemingen is geen baseline; er is dus nog geen alarmgrens. Er komt pas een alarmgrens als er ≥ 15 potjes zijn die 15 min halen (fase 21 met mensen, of een meetset met langere potjes).

## 2. Alarmgrenzen (bovenaan elk rapport, alleen diagnostisch)

Een alarmbel gaat af als een metriek **buiten de interkwartielafstand (Q1–Q3) van de nulmeting** valt, aan de slechte kant. Dat is een grens uit de data zelf, niet verzonnen. Een alarm is een **onderzoeksopdracht**, geen acceptatiecriterium. Geldt er ook een doelgrens, dan beslist alleen die.

| Signaal | Slechte kant | Type | Nulmeting land: mediaan (Q1–Q3) |
|---|---|---|---|
| Keuze-idle midgame (unit-wachtrijen) | hoger | Alarm | 8% (4–14%) |
| Tijd zonder beslissing ≥ 30 s | hoger | Alarm | 33% (28–44%) |
| Dominante eenheid | hoger | Alarm | 69% (62–78%) |
| Tijd tot eerste strategische keuze | later | Alarm | 3,1 min (2,7–3,5) |
| Comeback | lager | Doelgrens | 17% → doelgrens 15% |
| Patstellingen | hoger | Doelgrens | 0% → doelgrens 2% |

Voor mensen (fase 21) gelden geen AI-alarmgrenzen. Daar zijn de streefwaarden van fase 27 de maat; die worden na ronde 1 ingevuld.

## 3. Ijking verliesclassificatie (op `nul-normal-medium`)

**Doel:** elke classificatie is onderscheidend genoeg om als diagnose te dienen. Geen enkele classificatie mag structureel vrijwel alle verliezen claimen.
- **Richtwaarde:** slaat een oorzaak aan in > 60% van de verloren potjes, dan wordt die onderzocht op overgevoeligheid.
- Een lage of nul-score is **geen** reden om een drempel op te rekken. Komt een oorzaak niet voor, dan is dat een bevinding over het spel of de AI.
- Er is geen gewenste verdeling. Als 70% van de verliezen echt door productieproblemen komt, moet het rapport dat laten zien.

| Code | Hoofdgetal | Oud | Bevroren | Aanslaan op 26 verloren potjes | Opmerking |
|---|---|---|---|---|---|
| PB | productie-uptime | < 50% | **< 30%** | 26 → 14 (54%) | Bij 50% slaat PB altijd aan (overgevoelig). 30% is de kleinste stap omlaag die dat oplost; 25% geeft 7 (27%) |
| BG | verlies in één gevecht | ≥ 50% | **≥ 90%** | 16 → 15 (58%) | 90% geeft in de nulmeting de meest bruikbare spreiding, zonder dat BG de classificatie kunstmatig domineert. Bevinding ernaast: beslissende gevechten wissen bijna altijd het hele leger uit |
| ES | inkomensdaling | ≥ 40% | 40% (blijft) | 26 → 7 (27%) | **Regelwijziging, geen getal:** alleen verliezen tot het kantelpunt K tellen. Anders slaat ES altijd aan, omdat de basis aan het eind valt. Verder ongevoelig voor het getal |
| EU, SW, OV, VA | – | – | blijven | 0 (OV 1, VA 0) | Komen in AI-potjes niet voor bij geen enkele waarde (de AI breidt niet uit en haalt geen superwapen af). Bevinding; niet oprekken |
| SC | aandeel één klasse | ≥ 60% | blijft | 2 (8%) | Laag, maar ongevoelig voor het getal. Bevinding; niet oprekken |

Resultaat: X (geen oorzaak) in 3 van 26 potjes (12%), dus onder de grens van 1 op 4.

**Ingevoerd** in `src/game/tests/verlies.ts` (`VERLIES`). Alle rapporten van de nulmeting zijn herberekend uit de ruwe telemetrie (`RECOMPUTE=…raw.json npx vitest run balance`). Uitkomst in de andere runs:

| Run | PB geldig | BG geldig | ES geldig | X |
|---|---|---|---|---|
| `nul-normal-medium` (ijkset) | 14/26 (54%) | 15/26 (58%) | 7/26 (27%) | 3/26 (12%) |
| `nul-land` | 44/81 (54%) | 39/81 (48%) | 20/81 (25%) | 13/81 (16%) |
| `nul-zee` | **36/36 (100%)** | 18/36 (50%) | 11/36 (31%) | 0/36 |

**Bevinding (richtwaarde > 60% geraakt):** op zee slaat PB in elk verloren potje aan, ook bij 30%. Volgens §3 is dat een onderzoeksopdracht naar overgevoeligheid, geen reden om de drempel aan te passen. Te onderzoeken: staan scheepswachtrijen bij de AI echt stil, of telt een wachtrij zonder bouwbare optie (geen Naval Yard bereikbaar) als stilstand?

## 4. Definitie "eerste uitbreiding" (20.2-C)

**Probleem:** het startveld is nu één veld: het veld waarvan het midden het dichtst bij de start ligt. Ligt de basis tussen twee velden (Islands, soms small), dan telt de eerste raffinaderij als uitbreiding (0,5 min).

**Definitie** (geometrisch en deterministisch; ingevoerd als `startFields` in `src/game/tests/meting.ts`):
1. **Startvelden** = alle ertsvelden waarvan het midden binnen **10 tegels** van de startpositie ligt, vastgelegd bij de start van het potje. De bouwradius rond een CY is ±8–12 tegels, dus binnen 10 tegels is "in de basis".
2. Elk gebouw hoort bij **het ertsveld waarvan het midden het dichtst bij het gebouw ligt**.
3. **Een uitbreiding is de eerste raffinaderij of CY die af is (geplaatst of uitgeklapt) en bij een veld hoort dat geen startveld is.** Het moment is de tick van plaatsen of uitklappen.
4. Bij twee kandidaten telt de vroegste tick. Een gebouw in aanbouw of een CY die nog niet is uitgeklapt telt niet.

**Effect op de nulmeting:** de nep-uitbreidingen na 0,5 min op Islands zijn weg; geen enkele AI breidt uit, op land en op zee. Daardoor schuift de tijd tot de eerste strategische keuze op zee van 2,8 naar 3,2 min (mediaan).
