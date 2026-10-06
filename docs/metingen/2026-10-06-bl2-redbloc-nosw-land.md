# Meting bl2-redbloc-nosw-land (2026-10-06)

Build 1.3.0+8fd3bc8f-dirty · AI-versie 2 · 81 potjes · maps=plains,rivers,highlands · seeds=3 vanaf 1000 · size=small · diff=hard,hard · superwapens=uit · ore=v12 (standaard) · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | – — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 9% (5%–16%), n=64 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 31% (25%–39%), n=162 |
| Dominante eenheid (gemiddeld aandeel) | 69% (62%–78%), n=162 |
| Legerconcentratie lategame | 0.48 (0.39–0.57), n=2 |
| Comeback (winnaar stond ooit ≥ 40% achter) | 15/81 (19%) |
| Patstellingen (30 min zonder winnaar) | 0/81 (0%) |
| Tijd tot eerste strategische keuze (min) | 3.13 (2.66–3.52), n=162 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 7.67 (6.74–8.97), n=81 |
| Eerste contact (min) | 5.12 (5.00–5.33), n=81 |
| TTK eerste gevecht (s) | 135.0 (115.4–154.2), n=81 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=81 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.18 (1.09–1.29), n=73 · 1.07 (1.03–1.18), n=81 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | 1.18 (1.15–4.17), n=4 · 1.79 (1.67–2.01), n=6 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | 6.85 (5.20–8.51), n=2 · 1.01 (1.00–1.01), n=2 |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | 10.17 (10.17–10.17), n=1 · 1.00 (1.00–1.00), n=1 |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 11% (9%–13%), n=162 | 12% (10%–15%), n=54 | 11% (9%–13%), n=54 | 11% (7%–12%), n=54 |
| Keuze-idle opening | 11% (8%–13%), n=162 | 12% (9%–14%), n=54 | 12% (10%–14%), n=54 | 9% (7%–11%), n=54 |
| Keuze-idle contact | 13% (9%–17%), n=162 | 18% (12%–22%), n=54 | 12% (9%–16%), n=54 | 12% (9%–14%), n=54 |
| Keuze-idle midgame | 9% (5%–16%), n=64 | 16% (12%–21%), n=14 | 11% (4%–16%), n=29 | 7% (4%–10%), n=21 |
| Keuze-idle lategame | 2% (1%–4%), n=3 | 6% (6%–6%), n=1 | 0% (0%–0%), n=1 | 2% (2%–2%), n=1 |
| Keuze-idle end | 12% (6%–16%), n=161 | 15% (10%–19%), n=53 | 9% (6%–13%), n=54 | 12% (7%–15%), n=54 |
| Keuze-idle bouwwachtrij (detail) | 13% (8%–18%), n=162 | 18% (13%–26%), n=54 | 13% (9%–18%), n=54 | 9% (6%–12%), n=54 |
| Geldgebrek | 34% (28%–40%), n=162 | 31% (24%–35%), n=54 | 33% (28%–39%), n=54 | 37% (33%–43%), n=54 |
| Arm-idle | 27% (23%–31%), n=162 | 25% (22%–29%), n=54 | 29% (24%–32%), n=54 | 28% (23%–32%), n=54 |
| Productie-uptime | 45% (35%–55%), n=162 | 48% (42%–58%), n=54 | 45% (35%–54%), n=54 | 41% (33%–46%), n=54 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 327 (265–386), n=162 | 335 (263–383), n=54 | 339 (294–408), n=54 | 302 (262–367), n=54 |
| Productieopties gebouw · inf · voertuig | 12 (9–13), n=162 · 5 (4–6), n=162 · 5 (3–7), n=162 | 12 (9–13), n=54 · 6 (4–6), n=54 · 4 (3–4), n=54 | 12 (9–12), n=54 · 6 (4–6), n=54 · 8 (5–8), n=54 | 13 (10–13), n=54 · 5 (3–5), n=54 · 5 (3–5), n=54 |
| Gebruikte breedte (defs in 2 min) | 6.0 (5.1–7.0), n=162 | 6.0 (6.0–7.0), n=54 | 6.0 (6.0–7.0), n=54 | 6.0 (5.0–6.0), n=54 |
| Langste gat zonder beslissing (s) | 78 (74–90), n=162 | 77 (74–90), n=54 | 75 (72–85), n=54 | 87 (78–99), n=54 |
| Mediaan gat (s) | 3.8 (3.0–4.0), n=162 | 3.5 (3.0–4.9), n=54 | 4.0 (3.0–4.0), n=54 | 4.0 (3.0–4.5), n=54 |
| Dominante eenheid, % tijd boven 50% | 81% (69%–94%), n=162 | 81% (63%–90%), n=54 | 92% (77%–98%), n=54 | 73% (60%–87%), n=54 |
| Planwissels per potje | 6.0 (5.0–7.0), n=162 | 6.0 (5.0–7.0), n=54 | 6.0 (6.0–8.0), n=54 | 6.0 (6.0–7.0), n=54 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | 2.45 (2.43–2.51), n=19 | 2.44 (2.43–2.45), n=6 | 2.44 (2.42–2.45), n=6 | 2.53 (2.51–2.68), n=7 |
| tech | 3.53 (3.28–3.95), n=162 | 3.58 (3.24–3.94), n=54 | 3.46 (3.22–3.87), n=54 | 3.52 (3.36–4.05), n=54 |
| ecoAttack | 5.25 (4.94–5.68), n=140 | 5.20 (5.11–5.46), n=52 | 5.26 (4.84–5.70), n=46 | 5.35 (4.86–6.15), n=42 |
| defense | 5.87 (5.36–6.28), n=76 | 5.84 (5.43–6.68), n=24 | 5.50 (5.14–5.96), n=27 | 5.95 (5.77–6.27), n=25 |
| counter | 2.97 (2.68–3.58), n=113 | 2.80 (2.55–3.38), n=27 | 2.81 (2.67–4.57), n=46 | 3.22 (2.78–3.55), n=40 |
| factionMechanic | 5.53 (5.26–6.07), n=26 | 5.69 (4.83–6.25), n=8 | 5.53 (5.19–5.87), n=10 | 5.51 (5.38–5.88), n=8 |
| strategic | 3.13 (2.66–3.52), n=162 | 3.21 (2.55–3.64), n=54 | 2.83 (2.58–3.45), n=54 | 3.24 (2.73–3.48), n=54 |
| Reactietijd verdediging (s) | 27 (14–41), n=76 | 23 (12–41), n=24 | 23 (10–36), n=27 | 32 (26–41), n=25 |

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
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 6/6 (100%) |
| Comeback | 15/81 (19%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 77/81 (95%) |
| ...waarvan na 15 min | 2/81 (2%) |
| Legerconcentratie opening | 1.00 (0.91–1.00), n=162 |
| Legerconcentratie contact | 1.00 (0.88–1.00), n=162 |
| Legerconcentratie midgame | 1.00 (0.85–1.00), n=61 |
| Legerconcentratie lategame | 0.48 (0.39–0.57), n=2 |
| Legerconcentratie end | 0.90 (0.79–1.00), n=143 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 3531 (2193–4900), n=162 | 4025 (2275–4900), n=54 | 4200 (2800–5565), n=54 | 2975 (2100–4200), n=54 |
| Inkomen minuut 6 ($/min) | 2914 (1109–4058), n=162 | 3097 (1181–3931), n=54 | 2144 (928–3708), n=54 | 2918 (1254–4283), n=54 |
| Inkomen minuut 10 ($/min) | 594 (0–1495), n=36 | 1574 (1023–2126), n=8 | 0 (0–724), n=15 | 956 (150–1198), n=13 |
| Inkomen minuut 15 ($/min) | 636 (0–1356), n=4 | 636 (318–954), n=2 | 0 (0–0), n=1 | 1608 (1608–1608), n=1 |
| Besteed minuut 3 ($/min) | 3501 (2101–4260), n=162 | 3586 (2136–4318), n=54 | 3895 (2269–4623), n=54 | 2308 (2099–3632), n=54 |
| Besteed minuut 6 ($/min) | 3088 (1714–4107), n=162 | 3255 (1732–4210), n=54 | 2846 (1267–3875), n=54 | 3014 (2108–4105), n=54 |
| Besteed minuut 10 ($/min) | 579 (2–1447), n=36 | 1526 (1021–2165), n=8 | 345 (1–834), n=15 | 555 (0–1317), n=13 |
| Besteed minuut 15 ($/min) | 757 (0–1561), n=4 | 851 (426–1277), n=2 | 0 (0–0), n=1 | 1514 (1514–1514), n=1 |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=162 | 1 (1–1), n=54 | 1 (1–1), n=54 | 1 (1–1), n=54 |
| Startveld < 25% (min) | 3.17 (2.83–4.17), n=162 | 3.17 (2.83–4.17), n=54 | 3.17 (2.83–3.96), n=54 | 3.33 (3.00–4.33), n=54 |
| Tweede CY (min) | – | – | – | – |
| Inkomen uit Fuel Rigs ($, heel potje) | 0 (0–660), n=162 | 0 (0–1031), n=54 | 0 (0–34), n=54 | 0 (0–289), n=54 |
| Harassment: kosten per raid (min inkomen) | 1.48 (1.09–1.71), n=82 | 1.36 (0.78–1.70), n=23 | 1.43 (1.21–1.72), n=30 | 1.55 (1.08–1.73), n=29 |
| Harassment netto (min inkomen, min daling aanvaller) | 0.08 (-0.18–0.63), n=82 | -0.03 (-0.22–0.54), n=23 | 0.13 (-0.14–0.65), n=30 | 0.03 (-0.22–0.57), n=29 |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 162/162 (100%) |
| Speler met een tweede CY | 0/162 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 81/162 (50%) |
| Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23) | 10/92 (11%) |
| Patstellingen | 0/81 (0%) |

## G. Gebruik en balans

Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).

| Factie | Winrate niet-spiegel | 95%-interval | Aandeel overwinningen (alle potjes) |
| --- | --- | --- | --- |
| allies | 23/36 (64%) | 48%–78% | 32/81 |
| soviets | 16/36 (44%) | 30%–60% | 25/81 |
| psi | 15/36 (42%) | 27%–58% | 24/81 |

Zetelbias (spiegelpotjes): speler 0 wint 11 van 27.

| Eenheid | Gebouwd | Kills | Kosten-efficiëntie | % overleeft ≥ 60 s |
| --- | ---: | ---: | ---: | ---: |
| Rifleman (`rifle`) | 480 | 121 | 0.52 | 92% |
| Warden Tank (`tank_allies`) | 461 | 756 | 2.08 | 79% |
| Anvil Heavy Tank (`tank_soviets`) | 328 | 664 | 2.04 | 88% |
| Lash Tank (`tank_psi`) | 326 | 649 | 1.96 | 80% |
| Lancer IFV (`ifv`) | 223 | 168 | 0.92 | 79% |
| Rocket Trooper (`rocket`) | 176 | 112 | 1.59 | 86% |
| Ore Hauler (`miner`) | 170 | 0 | 0.00 | 71% |
| Adept (`initiate`) | 156 | 58 | 1.23 | 91% |
| Mauler (`brute`) | 146 | 80 | 0.89 | 81% |
| Engineer (`engineer`) | 134 | 0 | 0.00 | 92% |
| Spinner Tank (`gatling`) | 127 | 135 | 1.12 | 80% |
| Scout Jeep (`jeep`) | 99 | 62 | 0.43 | 82% |
| Refractor Tank (`prism`) | 96 | 200 | 1.19 | 72% |
| Thrall Hauler (`thrallhauler`) | 89 | 0 | 0.00 | 66% |
| Arc Trooper (`arc`) | 51 | 52 | 1.51 | 78% |
| Colossus Tank (`heavy`) | 49 | 161 | 1.80 | 73% |
| Magnetar (`magnetar`) | 44 | 127 | 2.39 | 84% |
| Leech Drone (`leechdrone`) | 34 | 3 | 0.01 | 76% |
| Longbow Launcher (`artillery`) | 33 | 50 | 1.55 | 85% |
| Siege Rotor (`siegerotor`) | 22 | 24 | 0.60 | 77% |
| Thunderhead Airship (`airship`) | 21 | 48 | 0.71 | 81% |
| Shroud Tank (`shroudtank`) | 18 | 38 | 1.82 | 67% |
| Delirium Drone (`deliriumdrone`) | 18 | 1 | 0.00 | 83% |
| Hover Disc (`disc`) | 15 | 66 | 2.61 | 93% |
| Flak Hauler (`flakhauler`) | 13 | 4 | 0.68 | 54% |
| Flak Gunner (`flakgunner`) | 12 | 3 | 0.39 | 100% |
| Mentalist (`mentalist`) | 12 | 7 | 0.06 | 58% |
| Phase Trooper (`phasetrooper`) | 9 | 11 | 1.58 | 44% |
| Skyjumper (`skyjumper`) | 8 | 6 | 1.33 | 50% |
| Hivemind (`hivemind`) | 7 | 0 | 0.00 | 71% |
| Blight Trooper (`blight`) | 6 | 3 | 0.19 | 67% |
| Toxin Sniper (`toxin`) | 6 | 4 | 0.31 | 83% |
| Sapper (`sapper`) | 3 | 3 | 1.42 | 33% |
| Nova (`nova`) | 2 | 9 | 4.40 | 50% |
| Grom (`grom`) | 2 | 3 | 0.45 | 100% |
| The Oracle (`oracle`) | 1 | 0 | 0.00 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/81 | 0/81 |
| ES | 9/81 | 19/81 |
| PB | 39/81 | 42/81 |
| SC | 0/81 | 1/81 |
| BG | 22/81 | 49/81 |
| SW | 0/81 | 0/81 |
| OV | 0/81 | 0/81 |
| VA | 0/81 | 0/81 |
| X | 11/81 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
