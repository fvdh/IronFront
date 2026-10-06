# Meting nul-nosw-land (2026-10-06)

Build 1.3.0+2f1b3f7d · AI-versie 1 · 81 potjes · maps=plains,rivers,highlands · seeds=3 vanaf 1000 · size=small · diff=hard,hard · superwapens=uit · ore=v12 (standaard) · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | – — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 12% (5%–18%), n=72 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 31% (26%–40%), n=162 |
| Dominante eenheid (gemiddeld aandeel) | 69% (62%–78%), n=162 |
| Legerconcentratie lategame | – |
| Comeback (winnaar stond ooit ≥ 40% achter) | 15/81 (19%) |
| Patstellingen (30 min zonder winnaar) | 0/81 (0%) |
| Tijd tot eerste strategische keuze (min) | 3.13 (2.66–3.52), n=162 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 7.70 (6.74–9.29), n=81 |
| Eerste contact (min) | 5.12 (5.00–5.33), n=81 |
| TTK eerste gevecht (s) | 136.1 (114.2–154.2), n=81 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=81 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.18 (1.09–1.29), n=73 · 1.07 (1.03–1.18), n=81 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | 12.71 (12.71–12.71), n=1 · 2.03 (1.59–3.46), n=4 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | – · – |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | – · – |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 11% (9%–13%), n=162 | 12% (10%–15%), n=54 | 11% (9%–13%), n=54 | 10% (7%–12%), n=54 |
| Keuze-idle opening | 11% (8%–13%), n=162 | 12% (9%–14%), n=54 | 12% (10%–14%), n=54 | 9% (7%–11%), n=54 |
| Keuze-idle contact | 13% (9%–17%), n=162 | 17% (12%–21%), n=54 | 12% (9%–16%), n=54 | 12% (9%–14%), n=54 |
| Keuze-idle midgame | 12% (5%–18%), n=72 | 19% (15%–29%), n=16 | 10% (5%–15%), n=30 | 11% (4%–14%), n=26 |
| Keuze-idle lategame | – | – | – | – |
| Keuze-idle end | 12% (6%–16%), n=162 | 14% (8%–18%), n=54 | 9% (6%–13%), n=54 | 12% (4%–15%), n=54 |
| Keuze-idle bouwwachtrij (detail) | 13% (8%–18%), n=162 | 18% (13%–26%), n=54 | 13% (9%–18%), n=54 | 9% (7%–12%), n=54 |
| Geldgebrek | 34% (28%–40%), n=162 | 31% (24%–35%), n=54 | 32% (28%–38%), n=54 | 37% (34%–43%), n=54 |
| Arm-idle | 27% (23%–31%), n=162 | 24% (22%–28%), n=54 | 29% (24%–32%), n=54 | 28% (23%–32%), n=54 |
| Productie-uptime | 44% (36%–54%), n=162 | 48% (41%–58%), n=54 | 44% (34%–54%), n=54 | 41% (35%–48%), n=54 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 330 (268–385), n=162 | 335 (263–385), n=54 | 337 (308–403), n=54 | 303 (264–372), n=54 |
| Productieopties gebouw · inf · voertuig | 12 (9–13), n=162 · 5 (4–6), n=162 · 5 (3–8), n=162 | 13 (9–13), n=54 · 6 (4–6), n=54 · 4 (3–4), n=54 | 12 (9–12), n=54 · 6 (4–6), n=54 · 8 (5–8), n=54 | 13 (10–13), n=54 · 5 (3–5), n=54 · 5 (3–5), n=54 |
| Gebruikte breedte (defs in 2 min) | 6.0 (6.0–7.0), n=162 | 6.0 (6.0–7.0), n=54 | 6.0 (6.0–7.0), n=54 | 6.0 (5.0–6.4), n=54 |
| Langste gat zonder beslissing (s) | 79 (74–93), n=162 | 77 (74–92), n=54 | 76 (72–90), n=54 | 87 (78–97), n=54 |
| Mediaan gat (s) | 4.0 (3.0–4.5), n=162 | 4.0 (3.0–5.0), n=54 | 3.5 (3.0–4.0), n=54 | 4.0 (3.0–4.5), n=54 |
| Dominante eenheid, % tijd boven 50% | 82% (68%–94%), n=162 | 81% (65%–90%), n=54 | 92% (75%–98%), n=54 | 77% (62%–87%), n=54 |
| Planwissels per potje | 6.0 (5.3–7.0), n=162 | 6.0 (5.0–6.8), n=54 | 6.0 (6.0–7.0), n=54 | 6.0 (6.0–7.0), n=54 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | 2.45 (2.43–2.51), n=19 | 2.44 (2.43–2.45), n=6 | 2.44 (2.42–2.45), n=6 | 2.53 (2.51–2.68), n=7 |
| tech | 3.53 (3.28–3.95), n=162 | 3.58 (3.24–3.94), n=54 | 3.46 (3.22–3.87), n=54 | 3.52 (3.36–4.05), n=54 |
| ecoAttack | 5.25 (4.97–5.75), n=142 | 5.20 (5.11–5.46), n=52 | 5.31 (4.88–5.76), n=48 | 5.35 (4.86–6.15), n=42 |
| defense | 5.87 (5.36–6.25), n=74 | 5.75 (5.45–6.68), n=21 | 5.58 (5.15–5.96), n=28 | 5.95 (5.77–6.27), n=25 |
| counter | 2.97 (2.68–3.71), n=114 | 2.83 (2.55–3.54), n=28 | 2.81 (2.67–4.57), n=46 | 3.22 (2.78–3.55), n=40 |
| factionMechanic | 5.56 (5.29–6.52), n=28 | 5.86 (4.91–6.65), n=9 | 5.53 (5.19–5.87), n=10 | 5.55 (5.40–6.65), n=9 |
| strategic | 3.13 (2.66–3.52), n=162 | 3.21 (2.55–3.64), n=54 | 2.83 (2.58–3.45), n=54 | 3.24 (2.73–3.48), n=54 |
| Reactietijd verdediging (s) | 27 (13–41), n=74 | 22 (12–41), n=21 | 24 (10–37), n=28 | 32 (26–41), n=25 |

## D. Superwapens

Eerste schot per potje: 0 van 81 potjes. Bakken op totale waarde (leger + gebouwen + credits); de indeling op legerwaarde ernaast. Een bak met n < 15 is onbeslist.

| Bak | n (leger-bak n) | Tegenstander uit < 90 s | Beslissend achter < 90 s | Winst schutter | Verlies tegenstander 90 s (mediaan $) | Waarvan superwapen |
| --- | --- | --- | --- | --- | --- | --- |
| ahead | 0 (0) onbeslist | – | – | – | – | 0% |
| even | 0 (0) onbeslist | – | – | – | – | 0% |
| behind | 0 (0) onbeslist | – | – | – | – | 0% |

Overwinst: draai dezelfde run met `BALANCE_NOSW=1` en geef hem mee met `BALANCE_CONTROL=<json>`.

## E. Sneeuwbal, comeback, deathball

| Metriek | Waarde |
| --- | --- |
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 10/10 (100%) |
| Comeback | 15/81 (19%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 77/81 (95%) |
| ...waarvan na 15 min | 0/81 (0%) |
| Legerconcentratie opening | 1.00 (0.91–1.00), n=162 |
| Legerconcentratie contact | 1.00 (0.88–1.00), n=162 |
| Legerconcentratie midgame | 1.00 (0.89–1.00), n=69 |
| Legerconcentratie lategame | – |
| Legerconcentratie end | 0.90 (0.76–1.00), n=144 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 3531 (2193–4900), n=162 | 4025 (2275–4900), n=54 | 4200 (2800–5565), n=54 | 2975 (2100–4200), n=54 |
| Inkomen minuut 6 ($/min) | 2914 (1109–4058), n=162 | 3097 (1175–3931), n=54 | 2144 (928–3708), n=54 | 2918 (1288–4283), n=54 |
| Inkomen minuut 10 ($/min) | 430 (0–1371), n=42 | 478 (0–1555), n=10 | 40 (0–1284), n=17 | 700 (150–1159), n=15 |
| Inkomen minuut 15 ($/min) | – | – | – | – |
| Besteed minuut 3 ($/min) | 3501 (2101–4260), n=162 | 3586 (2136–4318), n=54 | 3895 (2269–4623), n=54 | 2308 (2099–3632), n=54 |
| Besteed minuut 6 ($/min) | 3088 (1638–4107), n=162 | 3255 (1638–4210), n=54 | 2846 (1159–3875), n=54 | 3014 (2042–4105), n=54 |
| Besteed minuut 10 ($/min) | 702 (88–1454), n=42 | 463 (104–2185), n=10 | 264 (0–1239), n=17 | 1108 (594–1470), n=15 |
| Besteed minuut 15 ($/min) | – | – | – | – |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=162 | 1 (1–1), n=54 | 1 (1–1), n=54 | 1 (1–1), n=54 |
| Startveld < 25% (min) | 3.17 (2.83–4.17), n=162 | 3.17 (2.83–4.17), n=54 | 3.17 (2.83–3.96), n=54 | 3.33 (3.00–4.33), n=54 |
| Tweede CY (min) | – | – | – | – |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 162/162 (100%) |
| Speler met een tweede CY | 0/162 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 81/162 (50%) |
| Patstellingen | 0/81 (0%) |

## G. Gebruik en balans

Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).

| Factie | Winrate niet-spiegel | 95%-interval | Aandeel overwinningen (alle potjes) |
| --- | --- | --- | --- |
| allies | 23/36 (64%) | 48%–78% | 32/81 |
| soviets | 17/36 (47%) | 32%–63% | 26/81 |
| psi | 14/36 (39%) | 25%–55% | 23/81 |

Zetelbias (spiegelpotjes): speler 0 wint 13 van 27.

| Eenheid | Gebouwd | Kills | Kosten-efficiëntie | % overleeft ≥ 60 s |
| --- | ---: | ---: | ---: | ---: |
| Rifleman (`rifle`) | 488 | 122 | 0.53 | 91% |
| Warden Tank (`tank_allies`) | 457 | 766 | 2.09 | 80% |
| Anvil Heavy Tank (`tank_soviets`) | 334 | 652 | 1.94 | 88% |
| Lash Tank (`tank_psi`) | 322 | 665 | 2.10 | 81% |
| Lancer IFV (`ifv`) | 215 | 164 | 0.98 | 85% |
| Rocket Trooper (`rocket`) | 175 | 114 | 1.79 | 87% |
| Ore Hauler (`miner`) | 172 | 0 | 0.00 | 69% |
| Adept (`initiate`) | 161 | 62 | 1.27 | 88% |
| Mauler (`brute`) | 149 | 88 | 0.96 | 82% |
| Engineer (`engineer`) | 138 | 0 | 0.00 | 92% |
| Spinner Tank (`gatling`) | 134 | 124 | 1.01 | 78% |
| Scout Jeep (`jeep`) | 97 | 64 | 0.44 | 81% |
| Thrall Hauler (`thrallhauler`) | 92 | 0 | 0.00 | 62% |
| Refractor Tank (`prism`) | 89 | 182 | 1.09 | 72% |
| Colossus Tank (`heavy`) | 52 | 172 | 1.87 | 75% |
| Arc Trooper (`arc`) | 49 | 61 | 1.88 | 78% |
| Magnetar (`magnetar`) | 39 | 103 | 2.16 | 85% |
| Longbow Launcher (`artillery`) | 35 | 51 | 1.56 | 86% |
| Leech Drone (`leechdrone`) | 34 | 3 | 0.01 | 76% |
| Siege Rotor (`siegerotor`) | 22 | 26 | 0.73 | 82% |
| Delirium Drone (`deliriumdrone`) | 22 | 1 | 0.00 | 82% |
| Thunderhead Airship (`airship`) | 19 | 95 | 1.71 | 89% |
| Shroud Tank (`shroudtank`) | 17 | 35 | 1.60 | 65% |
| Flak Hauler (`flakhauler`) | 12 | 6 | 0.90 | 67% |
| Mentalist (`mentalist`) | 12 | 7 | 0.06 | 75% |
| Hover Disc (`disc`) | 12 | 33 | 1.48 | 100% |
| Flak Gunner (`flakgunner`) | 11 | 2 | 0.24 | 100% |
| Phase Trooper (`phasetrooper`) | 9 | 11 | 1.58 | 44% |
| Toxin Sniper (`toxin`) | 8 | 4 | 0.23 | 88% |
| Skyjumper (`skyjumper`) | 7 | 5 | 0.24 | 43% |
| Hivemind (`hivemind`) | 7 | 0 | 0.00 | 86% |
| Blight Trooper (`blight`) | 5 | 4 | 0.22 | 80% |
| Sapper (`sapper`) | 3 | 0 | 0.00 | 67% |
| Nova (`nova`) | 2 | 3 | 1.10 | 100% |
| Grom (`grom`) | 2 | 1 | 0.00 | 100% |
| Amphibious Transport (`amphib`) | 1 | 0 | 0.00 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, nog niet geijkt)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/81 | 0/81 |
| ES | 0/81 | 81/81 |
| PB | 81/81 | 81/81 |
| SC | 0/81 | 2/81 |
| BG | 0/81 | 52/81 |
| SW | 0/81 | 0/81 |
| OV | 0/81 | 0/81 |
| VA | 0/81 | 0/81 |
| X | 0/81 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
