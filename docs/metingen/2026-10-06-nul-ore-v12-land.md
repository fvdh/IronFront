# Meting nul-ore-v12-land (2026-10-06)

Build 1.3.0+2f1b3f7d · AI-versie 1 · 81 potjes · maps=plains,rivers,highlands · seeds=3 vanaf 1000 · size=small · diff=hard,hard · superwapens=aan · ore=v12 · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | 0/1 (0%) — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 8% (4%–14%), n=76 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 33% (28%–44%), n=162 |
| Dominante eenheid (gemiddeld aandeel) | 69% (62%–78%), n=162 |
| Legerconcentratie lategame | 0.80 (0.76–0.84), n=2 |
| Comeback (winnaar stond ooit ≥ 40% achter) | 14/81 (17%) |
| Patstellingen (30 min zonder winnaar) | 0/81 (0%) |
| Tijd tot eerste strategische keuze (min) | 3.13 (2.66–3.52), n=162 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 7.83 (6.74–9.92), n=81 |
| Eerste contact (min) | 5.12 (5.00–5.33), n=81 |
| TTK eerste gevecht (s) | 136.1 (118.6–154.2), n=81 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=81 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.18 (1.09–1.29), n=73 · 1.07 (1.03–1.18), n=81 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | 1.75 (1.38–3.30), n=7 · 1.27 (1.15–2.63), n=10 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | 21.17 (21.17–21.17), n=1 · 2.90 (1.46–4.40), n=4 |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | – · – |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 10% (8%–12%), n=162 | 11% (9%–13%), n=54 | 10% (8%–12%), n=54 | 9% (7%–11%), n=54 |
| Keuze-idle opening | 11% (8%–13%), n=162 | 12% (9%–14%), n=54 | 12% (10%–14%), n=54 | 9% (7%–11%), n=54 |
| Keuze-idle contact | 12% (9%–15%), n=162 | 14% (11%–19%), n=54 | 10% (9%–14%), n=54 | 11% (8%–14%), n=54 |
| Keuze-idle midgame | 8% (4%–14%), n=76 | 12% (9%–21%), n=20 | 7% (4%–14%), n=30 | 6% (3%–10%), n=26 |
| Keuze-idle lategame | 19% (16%–22%), n=2 | 13% (13%–13%), n=1 | 24% (24%–24%), n=1 | – |
| Keuze-idle end | 10% (4%–14%), n=162 | 13% (4%–17%), n=54 | 7% (4%–11%), n=54 | 10% (4%–13%), n=54 |
| Keuze-idle bouwwachtrij (detail) | 9% (6%–15%), n=162 | 15% (11%–18%), n=54 | 10% (7%–12%), n=54 | 7% (4%–9%), n=54 |
| Geldgebrek | 35% (29%–42%), n=162 | 33% (27%–39%), n=54 | 34% (29%–39%), n=54 | 39% (35%–43%), n=54 |
| Arm-idle | 29% (24%–33%), n=162 | 27% (24%–31%), n=54 | 30% (26%–33%), n=54 | 30% (24%–33%), n=54 |
| Productie-uptime | 42% (32%–52%), n=162 | 46% (38%–56%), n=54 | 44% (32%–53%), n=54 | 37% (30%–45%), n=54 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 325 (266–381), n=162 | 326 (255–382), n=54 | 337 (273–368), n=54 | 304 (268–375), n=54 |
| Productieopties gebouw · inf · voertuig | 12 (10–13), n=162 · 6 (4–6), n=162 · 5 (3–8), n=162 | 13 (9–13), n=54 · 6 (4–6), n=54 · 4 (3–4), n=54 | 12 (9–13), n=54 · 6 (4–8), n=54 · 8 (5–10), n=54 | 13 (10–13), n=54 · 5 (3–5), n=54 · 5 (3–5), n=54 |
| Gebruikte breedte (defs in 2 min) | 6.0 (5.0–6.9), n=162 | 6.0 (6.0–7.0), n=54 | 6.0 (5.6–7.0), n=54 | 6.0 (5.0–6.0), n=54 |
| Langste gat zonder beslissing (s) | 84 (75–93), n=162 | 78 (75–93), n=54 | 77 (72–93), n=54 | 87 (80–99), n=54 |
| Mediaan gat (s) | 4.0 (3.0–4.5), n=162 | 4.0 (3.0–5.0), n=54 | 3.5 (3.0–4.0), n=54 | 4.0 (3.0–4.5), n=54 |
| Dominante eenheid, % tijd boven 50% | 82% (67%–96%), n=162 | 82% (64%–89%), n=54 | 92% (76%–99%), n=54 | 77% (61%–92%), n=54 |
| Planwissels per potje | 6.0 (6.0–7.0), n=162 | 6.0 (5.0–7.0), n=54 | 6.5 (6.0–8.0), n=54 | 6.0 (6.0–7.0), n=54 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | 2.45 (2.43–2.51), n=19 | 2.44 (2.43–2.45), n=6 | 2.44 (2.42–2.45), n=6 | 2.53 (2.51–2.68), n=7 |
| tech | 3.53 (3.28–3.95), n=162 | 3.58 (3.24–3.94), n=54 | 3.46 (3.22–3.87), n=54 | 3.52 (3.36–4.05), n=54 |
| ecoAttack | 5.25 (4.94–5.68), n=140 | 5.19 (5.10–5.43), n=50 | 5.31 (4.88–5.76), n=48 | 5.35 (4.86–6.15), n=42 |
| defense | 5.85 (5.30–6.17), n=71 | 5.72 (5.29–6.43), n=19 | 5.50 (5.14–5.94), n=27 | 5.95 (5.77–6.27), n=25 |
| counter | 3.00 (2.68–3.82), n=117 | 2.95 (2.56–4.67), n=31 | 2.81 (2.67–4.57), n=46 | 3.22 (2.78–3.55), n=40 |
| factionMechanic | 5.55 (5.28–6.38), n=27 | 5.51 (4.74–5.99), n=7 | 5.58 (5.21–7.08), n=11 | 5.55 (5.40–6.65), n=9 |
| strategic | 3.13 (2.66–3.52), n=162 | 3.21 (2.55–3.64), n=54 | 2.83 (2.58–3.45), n=54 | 3.24 (2.73–3.48), n=54 |
| Reactietijd verdediging (s) | 28 (13–41), n=71 | 25 (13–41), n=19 | 23 (9–39), n=27 | 33 (27–41), n=25 |

## D. Superwapens

Eerste schot per potje: 2 van 81 potjes. Bakken op totale waarde (leger + gebouwen + credits); de indeling op legerwaarde ernaast. Een bak met n < 15 is onbeslist.

| Bak | n (leger-bak n) | Tegenstander uit < 90 s | Beslissend achter < 90 s | Winst schutter | Verlies tegenstander 90 s (mediaan $) | Waarvan superwapen |
| --- | --- | --- | --- | --- | --- | --- |
| ahead | 1 (1) onbeslist | 1/1 (100%) | 1/1 (100%) | 1/1 (100%) | 12500 | 0% |
| even | 1 (1) onbeslist | 0/1 (0%) | 0/1 (0%) | 0/1 (0%) | 4750 | 0% |
| behind | 0 (0) onbeslist | – | – | – | – | 0% |

Overwinst: draai dezelfde run met `BALANCE_NOSW=1` en geef hem mee met `BALANCE_CONTROL=<json>`.

## E. Sneeuwbal, comeback, deathball

| Metriek | Waarde |
| --- | --- |
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 16/17 (94%) |
| Comeback | 14/81 (17%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 73/81 (90%) |
| ...waarvan na 15 min | 1/81 (1%) |
| Legerconcentratie opening | 1.00 (0.91–1.00), n=162 |
| Legerconcentratie contact | 1.00 (0.88–1.00), n=162 |
| Legerconcentratie midgame | 1.00 (0.85–1.00), n=73 |
| Legerconcentratie lategame | 0.80 (0.76–0.84), n=2 |
| Legerconcentratie end | 0.91 (0.77–1.00), n=137 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 3531 (2193–4900), n=162 | 4025 (2275–4900), n=54 | 4200 (2800–5565), n=54 | 2975 (2100–4200), n=54 |
| Inkomen minuut 6 ($/min) | 2914 (1109–4058), n=162 | 3097 (1175–3931), n=54 | 2144 (928–3708), n=54 | 2918 (1288–4283), n=54 |
| Inkomen minuut 10 ($/min) | 1159 (0–2143), n=52 | 1627 (66–2656), n=14 | 552 (0–1888), n=19 | 1198 (464–1944), n=19 |
| Inkomen minuut 15 ($/min) | 553 (0–2539), n=16 | 2336 (1635–2568), n=4 | 553 (101–2185), n=6 | 0 (0–1671), n=6 |
| Besteed minuut 3 ($/min) | 3501 (2101–4260), n=162 | 3586 (2136–4318), n=54 | 3895 (2269–4623), n=54 | 2308 (2099–3632), n=54 |
| Besteed minuut 6 ($/min) | 3088 (1638–4107), n=162 | 3255 (1638–4210), n=54 | 2846 (1159–3875), n=54 | 3014 (2042–4105), n=54 |
| Besteed minuut 10 ($/min) | 1172 (0–2411), n=52 | 1877 (281–2733), n=14 | 615 (0–1888), n=19 | 1449 (791–2153), n=19 |
| Besteed minuut 15 ($/min) | 1442 (0–2824), n=16 | 2785 (2276–3685), n=4 | 638 (143–2184), n=6 | 1 (0–1740), n=6 |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=162 | 1 (1–1), n=54 | 1 (1–1), n=54 | 1 (1–1), n=54 |
| Startveld < 25% (min) | 3.17 (2.83–4.17), n=162 | 3.17 (2.83–4.17), n=54 | 3.17 (2.83–3.96), n=54 | 3.33 (3.00–4.33), n=54 |
| Tweede CY (min) | – | – | – | – |
| Inkomen uit Fuel Rigs ($, heel potje) | – | – | – | – |
| Harassment: kosten per raid (min inkomen) | 1.41 (0.92–1.70), n=90 | 1.35 (0.90–1.70), n=25 | 1.41 (1.06–1.71), n=33 | 1.47 (0.77–1.72), n=32 |
| Harassment netto (min inkomen, min daling aanvaller) | 0.14 (-0.20–0.65), n=90 | 0.38 (-0.12–0.62), n=25 | 0.14 (-0.14–0.62), n=33 | 0.03 (-0.31–0.79), n=32 |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 162/162 (100%) |
| Speler met een tweede CY | 0/162 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 81/162 (50%) |
| Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23) | 20/118 (17%) |
| Patstellingen | 0/81 (0%) |

## G. Gebruik en balans

Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).

| Factie | Winrate niet-spiegel | 95%-interval | Aandeel overwinningen (alle potjes) |
| --- | --- | --- | --- |
| allies | 22/36 (61%) | 45%–75% | 31/81 |
| soviets | 18/36 (50%) | 34%–66% | 27/81 |
| psi | 14/36 (39%) | 25%–55% | 23/81 |

Zetelbias (spiegelpotjes): speler 0 wint 11 van 27.

| Eenheid | Gebouwd | Kills | Kosten-efficiëntie | % overleeft ≥ 60 s |
| --- | ---: | ---: | ---: | ---: |
| Rifleman (`rifle`) | 470 | 120 | 0.48 | 92% |
| Warden Tank (`tank_allies`) | 436 | 773 | 2.23 | 80% |
| Anvil Heavy Tank (`tank_soviets`) | 334 | 667 | 1.96 | 88% |
| Lash Tank (`tank_psi`) | 326 | 676 | 2.08 | 82% |
| Lancer IFV (`ifv`) | 209 | 168 | 0.94 | 83% |
| Ore Hauler (`miner`) | 191 | 0 | 0.00 | 67% |
| Rocket Trooper (`rocket`) | 167 | 125 | 2.04 | 88% |
| Adept (`initiate`) | 150 | 59 | 1.07 | 91% |
| Mauler (`brute`) | 141 | 89 | 1.05 | 87% |
| Engineer (`engineer`) | 137 | 0 | 0.00 | 92% |
| Spinner Tank (`gatling`) | 128 | 125 | 0.99 | 78% |
| Thrall Hauler (`thrallhauler`) | 105 | 0 | 0.00 | 58% |
| Scout Jeep (`jeep`) | 88 | 58 | 0.36 | 77% |
| Refractor Tank (`prism`) | 82 | 169 | 1.21 | 77% |
| Colossus Tank (`heavy`) | 48 | 200 | 2.29 | 81% |
| Arc Trooper (`arc`) | 44 | 53 | 1.75 | 77% |
| Magnetar (`magnetar`) | 34 | 137 | 3.42 | 85% |
| Leech Drone (`leechdrone`) | 33 | 2 | 0.00 | 76% |
| Longbow Launcher (`artillery`) | 30 | 70 | 2.71 | 93% |
| Siege Rotor (`siegerotor`) | 23 | 26 | 0.71 | 83% |
| Shroud Tank (`shroudtank`) | 22 | 33 | 1.33 | 73% |
| Thunderhead Airship (`airship`) | 19 | 104 | 2.05 | 89% |
| Delirium Drone (`deliriumdrone`) | 16 | 0 | 0.00 | 81% |
| Flak Hauler (`flakhauler`) | 15 | 5 | 0.56 | 73% |
| Mentalist (`mentalist`) | 13 | 7 | 0.06 | 69% |
| Hover Disc (`disc`) | 13 | 63 | 2.54 | 100% |
| Skyjumper (`skyjumper`) | 8 | 5 | 0.21 | 50% |
| Flak Gunner (`flakgunner`) | 8 | 1 | 0.08 | 100% |
| Phase Trooper (`phasetrooper`) | 7 | 0 | 0.00 | 29% |
| Hivemind (`hivemind`) | 7 | 0 | 0.00 | 86% |
| Blight Trooper (`blight`) | 5 | 3 | 0.22 | 80% |
| Sapper (`sapper`) | 4 | 6 | 2.50 | 75% |
| Toxin Sniper (`toxin`) | 4 | 3 | 0.46 | 75% |
| Grom (`grom`) | 2 | 1 | 0.28 | 100% |
| Nova (`nova`) | 1 | 5 | 4.07 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/81 | 0/81 |
| ES | 13/81 | 20/81 |
| PB | 41/81 | 44/81 |
| SC | 0/81 | 3/81 |
| BG | 14/81 | 39/81 |
| SW | 0/81 | 0/81 |
| OV | 0/81 | 0/81 |
| VA | 0/81 | 0/81 |
| X | 13/81 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
