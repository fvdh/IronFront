# Meting nul-nosw-zee (2026-10-06)

Build 1.3.0+2f1b3f7d · AI-versie 1 · 36 potjes · maps=coast,islands · seeds=2 vanaf 1000 · size=small · diff=hard,hard · superwapens=uit · ore=v12 (standaard) · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | – — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 2% (0%–3%), n=40 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 57% (46%–77%), n=72 |
| Dominante eenheid (gemiddeld aandeel) | 75% (66%–82%), n=72 |
| Legerconcentratie lategame | 0.81 (0.75–0.81), n=3 |
| Comeback (winnaar stond ooit ≥ 40% achter) | 11/36 (31%) |
| Patstellingen (30 min zonder winnaar) | 0/36 (0%) |
| Tijd tot eerste strategische keuze (min) | 3.16 (2.72–4.21), n=72 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 8.33 (7.00–11.24), n=36 |
| Eerste contact (min) | 4.09 (2.83–4.75), n=36 |
| TTK eerste gevecht (s) | 133.7 (115.5–174.4), n=36 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=36 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.48 (1.15–1.90), n=22 · 1.28 (1.09–1.48), n=35 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | – · 1.59 (1.37–1.75), n=6 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | – · – |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | – · – |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 5% (2%–8%), n=72 | 5% (3%–8%), n=24 | 7% (3%–9%), n=24 | 4% (2%–8%), n=24 |
| Keuze-idle opening | 6% (3%–7%), n=72 | 5% (3%–7%), n=24 | 7% (4%–7%), n=24 | 4% (3%–7%), n=24 |
| Keuze-idle contact | 6% (2%–11%), n=72 | 6% (2%–11%), n=24 | 7% (2%–10%), n=24 | 5% (3%–10%), n=24 |
| Keuze-idle midgame | 2% (0%–3%), n=40 | 3% (2%–4%), n=12 | 1% (0%–2%), n=16 | 1% (0%–2%), n=12 |
| Keuze-idle lategame | 0% (0%–1%), n=6 | 0% (0%–0%), n=1 | 0% (0%–0%), n=2 | 1% (1%–3%), n=3 |
| Keuze-idle end | 5% (2%–10%), n=70 | 8% (3%–11%), n=23 | 4% (1%–10%), n=23 | 4% (2%–11%), n=24 |
| Keuze-idle bouwwachtrij (detail) | 6% (4%–10%), n=72 | 6% (5%–10%), n=24 | 7% (4%–10%), n=24 | 4% (3%–8%), n=24 |
| Geldgebrek | 46% (42%–51%), n=72 | 46% (42%–49%), n=24 | 44% (41%–48%), n=24 | 49% (43%–60%), n=24 |
| Arm-idle | 35% (31%–40%), n=72 | 35% (32%–40%), n=24 | 37% (34%–41%), n=24 | 32% (28%–35%), n=24 |
| Productie-uptime | 22% (11%–26%), n=72 | 22% (12%–28%), n=24 | 22% (10%–27%), n=24 | 22% (9%–25%), n=24 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 270 (176–374), n=72 | 230 (169–325), n=24 | 334 (246–420), n=24 | 247 (123–310), n=24 |
| Productieopties gebouw · inf · voertuig | 9 (9–10), n=72 · 4 (3–4), n=72 · 3 (3–5), n=72 | 9 (9–10), n=24 · 4 (4–5), n=24 · 3 (3–3), n=24 | 9 (9–9), n=24 · 4 (4–4), n=24 · 5 (5–5), n=24 | 10 (10–10), n=24 · 3 (3–3), n=24 · 3 (3–3), n=24 |
| Gebruikte breedte (defs in 2 min) | 4.0 (1.4–5.0), n=72 | 4.0 (1.8–5.0), n=24 | 4.5 (1.8–5.0), n=24 | 4.0 (1.4–4.0), n=24 |
| Langste gat zonder beslissing (s) | 113 (85–164), n=72 | 115 (81–159), n=24 | 109 (79–197), n=24 | 113 (86–303), n=24 |
| Mediaan gat (s) | 4.5 (3.0–7.6), n=72 | 4.0 (3.0–5.1), n=24 | 4.0 (3.0–6.0), n=24 | 6.0 (3.0–8.0), n=24 |
| Dominante eenheid, % tijd boven 50% | 94% (79%–100%), n=72 | 88% (78%–98%), n=24 | 98% (86%–100%), n=24 | 95% (76%–100%), n=24 |
| Planwissels per potje | 4.0 (3.0–5.0), n=72 | 4.5 (3.0–5.0), n=24 | 5.0 (3.8–5.3), n=24 | 4.0 (3.0–5.3), n=24 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | – | – | – | – |
| tech | 5.06 (4.71–5.84), n=32 | 5.02 (4.30–5.62), n=13 | 4.92 (4.61–5.40), n=11 | 5.61 (5.22–6.44), n=8 |
| ecoAttack | 4.42 (3.02–4.93), n=72 | 4.54 (2.81–4.87), n=24 | 4.35 (2.83–4.97), n=24 | 4.25 (3.16–5.40), n=24 |
| defense | 6.17 (5.72–6.56), n=7 | 5.35 (5.35–5.76), n=3 | 6.69 (6.39–6.99), n=2 | 6.56 (6.37–6.75), n=2 |
| counter | 2.92 (2.72–4.52), n=41 | 2.78 (1.22–3.78), n=9 | 3.73 (2.72–4.29), n=20 | 2.91 (2.86–5.54), n=12 |
| factionMechanic | 5.40 (4.97–5.83), n=2 | – | 5.40 (4.97–5.83), n=2 | – |
| strategic | 3.16 (2.72–4.21), n=72 | 3.12 (2.65–4.52), n=24 | 2.82 (2.72–3.77), n=24 | 3.19 (2.87–4.74), n=24 |
| Reactietijd verdediging (s) | 26 (21–33), n=7 | 26 (21–31), n=3 | 37 (33–41), n=2 | 17 (13–22), n=2 |

## D. Superwapens

Eerste schot per potje: 0 van 36 potjes. Bakken op totale waarde (leger + gebouwen + credits); de indeling op legerwaarde ernaast. Een bak met n < 15 is onbeslist.

| Bak | n (leger-bak n) | Tegenstander uit < 90 s | Beslissend achter < 90 s | Winst schutter | Verlies tegenstander 90 s (mediaan $) | Waarvan superwapen |
| --- | --- | --- | --- | --- | --- | --- |
| ahead | 0 (0) onbeslist | – | – | – | – | 0% |
| even | 0 (0) onbeslist | – | – | – | – | 0% |
| behind | 0 (0) onbeslist | – | – | – | – | 0% |

Overwinst: draai dezelfde run met `BALANCE_NOSW=1` en geef hem mee met `BALANCE_CONTROL=<json>`.

## E. Sneeuwbal, comeback, deathball

| Metriek | Waarde |
| --- | --- |
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 13/13 (100%) |
| Comeback | 11/36 (31%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 24/36 (67%) |
| ...waarvan na 15 min | 0/36 (0%) |
| Legerconcentratie opening | 0.76 (0.68–1.00), n=47 |
| Legerconcentratie contact | 0.89 (0.78–1.00), n=47 |
| Legerconcentratie midgame | 0.82 (0.71–1.00), n=22 |
| Legerconcentratie lategame | 0.81 (0.75–0.81), n=3 |
| Legerconcentratie end | 0.81 (0.73–0.90), n=49 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 2100 (1144–3116), n=72 | 2042 (1144–3467), n=24 | 2090 (1142–3479), n=24 | 2100 (1130–2848), n=24 |
| Inkomen minuut 6 ($/min) | 720 (188–1726), n=72 | 932 (416–2277), n=24 | 576 (176–1305), n=24 | 710 (78–1758), n=24 |
| Inkomen minuut 10 ($/min) | 296 (0–507), n=30 | 296 (272–480), n=9 | 336 (136–532), n=11 | 52 (0–413), n=10 |
| Inkomen minuut 15 ($/min) | 0 (0–632), n=14 | 0 (0–0), n=2 | 0 (0–564), n=6 | 440 (62–632), n=6 |
| Besteed minuut 3 ($/min) | 2099 (1141–2995), n=72 | 2146 (1141–3324), n=24 | 2101 (1138–3469), n=24 | 2097 (1132–2786), n=24 |
| Besteed minuut 6 ($/min) | 1071 (390–2149), n=72 | 1071 (716–2340), n=24 | 910 (173–2269), n=24 | 1176 (371–1840), n=24 |
| Besteed minuut 10 ($/min) | 296 (1–572), n=30 | 296 (272–481), n=9 | 335 (167–645), n=11 | 53 (0–414), n=10 |
| Besteed minuut 15 ($/min) | 124 (0–684), n=14 | 0 (0–0), n=2 | 0 (0–566), n=6 | 633 (331–684), n=6 |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=72 | 1 (1–1), n=24 | 1 (1–1), n=24 | 1 (1–1), n=24 |
| Startveld < 25% (min) | 2.67 (2.17–3.00), n=72 | 2.67 (2.12–2.83), n=24 | 2.67 (2.12–2.67), n=24 | 2.83 (2.42–3.17), n=24 |
| Tweede CY (min) | – | – | – | – |
| Inkomen uit Fuel Rigs ($, heel potje) | – | – | – | – |
| Harassment: kosten per raid (min inkomen) | 1.46 (0.92–1.78), n=54 | 1.60 (1.14–1.74), n=18 | 1.41 (1.01–1.81), n=19 | 1.46 (0.42–1.87), n=17 |
| Harassment netto (min inkomen, min daling aanvaller) | 0.10 (-0.22–0.85), n=54 | 0.04 (-0.28–0.35), n=18 | 0.05 (-0.04–0.90), n=19 | 0.22 (-0.20–1.02), n=17 |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 72/72 (100%) |
| Speler met een tweede CY | 0/72 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 36/72 (50%) |
| Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23) | 13/81 (16%) |
| Patstellingen | 0/36 (0%) |

## G. Gebruik en balans

Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).

| Factie | Winrate niet-spiegel | 95%-interval | Aandeel overwinningen (alle potjes) |
| --- | --- | --- | --- |
| allies | 9/16 (56%) | 33%–77% | 13/36 |
| soviets | 4/16 (25%) | 10%–49% | 8/36 |
| psi | 11/16 (69%) | 44%–86% | 15/36 |

Zetelbias (spiegelpotjes): speler 0 wint 6 van 12.

| Eenheid | Gebouwd | Kills | Kosten-efficiëntie | % overleeft ≥ 60 s |
| --- | ---: | ---: | ---: | ---: |
| Rifleman (`rifle`) | 134 | 48 | 0.69 | 99% |
| Warden Tank (`tank_allies`) | 91 | 147 | 2.35 | 89% |
| Ore Hauler (`miner`) | 82 | 0 | 0.00 | 57% |
| Lash Tank (`tank_psi`) | 82 | 188 | 3.35 | 91% |
| Anvil Heavy Tank (`tank_soviets`) | 71 | 129 | 2.29 | 80% |
| Rocket Trooper (`rocket`) | 46 | 48 | 4.18 | 93% |
| Mauler (`brute`) | 42 | 71 | 2.43 | 95% |
| Adept (`initiate`) | 40 | 15 | 1.16 | 98% |
| Spinner Tank (`gatling`) | 35 | 54 | 1.35 | 86% |
| Lancer IFV (`ifv`) | 34 | 41 | 1.71 | 79% |
| Thrall Hauler (`thrallhauler`) | 29 | 0 | 0.00 | 79% |
| Scout Jeep (`jeep`) | 23 | 29 | 0.56 | 87% |
| Leech Drone (`leechdrone`) | 5 | 0 | 0.00 | 60% |
| Flak Gunner (`flakgunner`) | 4 | 9 | 7.75 | 75% |
| Longbow Launcher (`artillery`) | 3 | 5 | 1.04 | 67% |
| Siege Rotor (`siegerotor`) | 3 | 8 | 1.36 | 100% |
| Shroud Tank (`shroudtank`) | 2 | 2 | 0.89 | 100% |
| Kraken (`kraken`) | 2 | 0 | 0.00 | 100% |
| Arc Trooper (`arc`) | 2 | 0 | 0.00 | 100% |
| Psi Submarine (`psisub`) | 2 | 0 | 0.00 | 100% |
| Leviathan (`leviathan`) | 1 | 0 | 0.00 | 100% |
| Flak Boat (`flakboat`) | 1 | 1 | 0.33 | 100% |
| Barracuda Sub (`barracuda`) | 1 | 0 | 0.00 | 100% |
| Toxin Sniper (`toxin`) | 1 | 0 | 0.00 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/36 | 0/36 |
| ES | 1/36 | 11/36 |
| PB | 30/36 | 36/36 |
| SC | 3/36 | 6/36 |
| BG | 2/36 | 20/36 |
| SW | 0/36 | 0/36 |
| OV | 0/36 | 0/36 |
| VA | 0/36 | 0/36 |
| X | 0/36 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
