# Nulmeting 1.3.0: samenvatting (2026-10-06)

Fun Pass fase 20.6 (`plan/fun-pass-plan.md`). Build **`1.3.0+2f1b3f7d`**, AI-versie 1. Gedraaid met `tools/nulmeting.sh nul` in ±7 min. Gearchiveerde build: `docs/playtest/builds/1.3.0+2f1b3f7d/`.

## Wat er gedraaid is

| Run | Potjes | Rapport |
|---|---:|---|
| `nul-land` | 81 (9 factieparen × plains/rivers/highlands × 3 seeds, small, Hard–Hard) | `2026-10-06-nul-land.md` |
| `nul-zee` | 36 (9 × coast/islands × 2) | `2026-10-06-nul-zee.md` |
| `nul-normal-medium` | 27 (9 × 3 landkaarten × 1, medium, Normal–Normal) | `2026-10-06-nul-normal-medium.md` |
| `nul-nosw-land`, `nul-nosw-zee` | 81 + 36, zonder superwapens | `…-nul-nosw-*.md` |
| `nul-ore-v12-land/-zee` | 117, `oreRules = v12` | `…-vs-nul-*.md`: **identiek** |
| `nul-scenarios` | 27 regressiescenario's | `2026-10-06-nul-scenarios.md` |
| `nul-duels`, `nul-duels-zee` | 630 + 36 duels | `docs/balans/nul-duels*.md` |

Bij elke run staan de metrieken per potje (`.json`) en de ruwe telemetrie (`.raw.json`), zodat metrieken opnieuw berekend kunnen worden zonder te simuleren.

**Betrouwbaarheid:**
- Het ore-harnas is neutraal: `nul-ore-v12` is per potje identiek aan `nul-land` en `nul-zee`.
- De run is deterministisch: een tweede run (na het stabiliseren van het buildlabel) gaf exact dezelfde uitkomsten. De eerste run staat apart in `eerste-run-label-onstabiel/` en mag weg.
- De duelmatrix is gelijk aan `duels-b4`, behalve Mentalist tegen Colossus en Mentalist tegen Spinner Tank. Dat komt door de herstelde wegrij-fout bij mind control (na B4).

## Belangrijkste uitkomsten

**1. AI-potjes zijn kort; lategame en superwapens komen bijna niet voor.**
- Mediane duur: land 7,8 min, zee 8,6 min, Normal op medium 9,7 min.
- Langer dan 18 min (de lategame): 1 van 81 op land, 3 van 36 op zee, 2 van 27 op Normal-medium.
- Er werden 34 superwapens gebouwd (land), maar er is maar 2 keer geschoten. Hun aandeel in de vernietigde waarde is 0% (land, zee) en 0,4% (Normal-medium).
- **Gevolg:**
  - Het kernsignaal van fase 24 en de overwinst zijn **onbeslist** (n = 1–2, er zijn 15 schoten per bak nodig).
  - Ook alles van de lategame (concentratie na 15 min, beslissend gevecht na 15 min) is onbeslist.
  - De AI-meting kan fase 24 dus niet aansturen. Dat moet uit fase 21 komen (mensen), of uit een meetset met langere potjes.

**2. Beslissende gevechten en sneeuwbal.**
- 90% van de potjes op land eindigt binnen 5 min na één gevecht dat de verliezer ≥ 50% van zijn leger kost; op zee 64%, op Normal-medium 100%. Bijna allemaal vóór minuut 15.
- Wie op 10 min ≥ 1,5× leger heeft, wint: 16 van 17 (land), 14 van 14 (zee).
- Comeback (winnaar stond ooit ≥ 40% achter): 17% land, 31% zee, 31% Normal-medium.

**3. Factiebalans** (winrate niet-spiegel, beslissing 21: 40–60%):

| | Allies | Red Bloc | Psi |
|---|---|---|---|
| Land (36 per factie) | 22/36 = **61%** | 18/36 = 50% | 14/36 = **39%** |
| Zee (16 per factie) | 9/16 = 56% | 4/16 = **25%** | 11/16 = **69%** |
| Normal-medium (12) | 6/12 = 50% | 5/12 = 42% | 7/12 = 58% |
| Land zonder superwapens | 23/36 | 17/36 | 14/36 |

- Op land liggen Allies en Psi net buiten de band. Het 95%-interval is breed (45–75% en 25–55%).
- Op zee ligt Red Bloc duidelijk onder de band; dat was al bekend (BL1).
- Met of zonder superwapens maakt hooguit 1 potje verschil.
- Zetelbias in de spiegelpotjes: speler 0 wint 11 van 27 (land) en 6 van 12 (zee).

**4. Economie en uitbreiding.**
- Het startveld zakt in **elk** potje onder 25%, gemiddeld na ±3,2 min (small) of ±4 min (medium). Velden raken dus snel leeg.
- Geen enkele AI bouwt een tweede CY. Winrate met of zonder tweede CY is daardoor niet te meten.
- Inkomen piekt rond minuut 3–4 ($3.500–4.200/min) en zakt daarna: minuut 6 ±$2.900, minuut 10 ±$1.150.

**5. Keuzedichtheid (AI, alleen diagnose).**
- Keuze-idle 10%, geldgebrek 35%, arm-idle 29%, productie-uptime 42%.
- Eén eenheid is gemiddeld 69% van het leger, en meer dan 80% van de tijd boven de 50% (vooral de hoofdtank).

**6. Gebruik per eenheid.**
- Hoofdtanks zijn veruit het meest gebouwd en het meest effectief (kosten-efficiëntie ±2).
- Specialisten worden zelden gebouwd door de AI: Mentalist 13×, Hivemind 7×, Phase Trooper 7×, Nova 1×, Grom 2× in 81 potjes.
- Mind control telt niet als kill. De kosten-efficiëntie van Mentalist en Hivemind is daarom te laag weergegeven.

**7. Regressiescenario's en zeematrix:**
- Een Thunderhead Airship sloopt een CY tegen de meeste $2.000-opties luchtafweer. Alleen Rocket Troopers, Skyguard SAM en Flak Battery houden hem tegen.
- Op zee winnen onderzeeërs van schepen zonder sonar; de Bastion Cruiser zakt naar 0,16.

## Startvoorwaarden: wat fase 20 levert (het deel uit fase 21 volgt na de playtest)

| Fase | Signaal (fase 20) | Uitkomst |
|---|---|---|
| 23 | Velden zakken zelden < 25% | **Nee**: elk startveld zakt eronder, na ±3 min |
| 23 | Inkomen na 15 min ≥ 80% van de piek zonder tweede veld | **Nee**: inkomen zakt; bovendien bereiken weinig potjes 15 min |
| 23 | Winrate met en zonder tweede CY verschilt < 10 pp | **Onbeslist**: geen enkele AI breidt uit |
| 23 | Harassment kost < 1 min inkomen | **Niet gemeten**: deze metriek ontbreekt nog in 20.2-F (zie open punten) |
| 24 | Kernsignaal > 25% | **Onbeslist** (n = 1) |
| 24 | Superwapens > 15% van de vernietigde waarde, of factiebalans met/zonder > 10 pp | **Nee**: 0–0,4%, en ≤ 1 potje verschil |
| 24 | ≥ 40% beslissend gevecht na 15 min, of concentratie na 15 min ≥ 70% | **Nee** voor het gevecht (1%); concentratie 0,80 maar n = 2 (onbeslist) |

## Verliesclassificatie: ijking (voorstel, nog niet bevroren)

Op `nul-normal-medium` (26 verloren AI-potjes) slaan **PB** (26/26) en **ES** (26/26) altijd aan. ES slaat ook aan bij elke waarde van het hoofdgetal: aan het eind valt de basis, en daarmee de raffinaderij. Voorstel in `grenzen.md`. Met dat voorstel:

| | EU | ES | PB | SC | BG | SW | OV | VA | X (geen oorzaak) |
|---|---|---|---|---|---|---|---|---|---|
| Geldig | 0 | 7 | 14 | 2 | 15 | 0 | 0 | 0 | – |
| Hoofdoorzaak | 0 | 3 | 10 | 0 | 10 | 0 | 0 | 0 | 3 (12%) |

EU, SW, OV en VA komen in AI-tegen-AI niet voor, bij geen enkele waarde. Dat is een bevinding over de AI, geen reden om hun drempels op te rekken.

## Open punten en beperkingen

1. **Definitie "eerste uitbreiding"** (20.2-C). Op eilandkaarten en kleine kaarten ligt de basis tussen twee velden, en telt de eerste raffinaderij al als uitbreiding (0,5 min op Islands). Voorstel in `grenzen.md`.
2. **Harassment-kosten** (signaal fase 23) is nog geen metriek. Voorstel: inkomen van het slachtoffer in de 2 min na een aanval op zijn Haulers of raffinaderij, vergeleken met de 2 min ervoor.
3. **Gratis Haulers** bij een raffinaderij tellen niet als "gebouwd", en **mind control** telt niet als kill (alleen statistiek per eenheid).
4. **AI-potjes zijn te kort voor fase 24.** Wil je het kernsignaal toch uit AI-potjes halen, dan is een extra meetset nodig met langere potjes (bijv. medium/large, Normal). Dat is een besluit, geen bevinding.
