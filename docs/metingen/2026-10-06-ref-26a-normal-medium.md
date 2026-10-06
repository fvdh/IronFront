# Meting ref-26a-normal-medium (2026-10-06)

Build 1.3.0+b573c461-dirty · AI-versie 2 · 27 potjes · maps=plains,rivers,highlands · seeds=1 vanaf 1000 · size=medium · diff=normal,normal · superwapens=aan · ore=v12 (standaard) · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | – — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 7% (5%–11%), n=46 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 41% (33%–56%), n=54 |
| Dominante eenheid (gemiddeld aandeel) | 71% (65%–77%), n=54 |
| Legerconcentratie lategame | 0.73 (0.64–0.95), n=6 |
| Comeback (winnaar stond ooit ≥ 40% achter) | 10/25 (40%) |
| Patstellingen (30 min zonder winnaar) | 2/27 (7%) |
| Tijd tot eerste strategische keuze (min) | 2.93 (2.75–3.15), n=54 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 9.80 (8.69–12.35), n=27 |
| Eerste contact (min) | 5.05 (4.21–5.52), n=27 |
| TTK eerste gevecht (s) | 116.4 (98.5–158.1), n=27 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=27 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.15 (1.07–1.28), n=24 · 1.06 (1.04–1.11), n=27 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | 2.32 (1.30–4.47), n=7 · 2.16 (1.38–4.40), n=11 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | 2.10 (1.82–2.87), n=3 · 2.13 (1.83–2.34), n=3 |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | 2.01 (1.78–2.23), n=2 · 1.20 (1.10–1.30), n=2 |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 8% (7%–9%), n=54 | 8% (7%–10%), n=18 | 8% (7%–10%), n=18 | 7% (5%–8%), n=18 |
| Keuze-idle opening | 9% (7%–11%), n=54 | 9% (8%–11%), n=18 | 11% (9%–12%), n=18 | 7% (6%–8%), n=18 |
| Keuze-idle contact | 8% (7%–11%), n=54 | 11% (6%–14%), n=18 | 9% (7%–12%), n=18 | 7% (6%–9%), n=18 |
| Keuze-idle midgame | 7% (5%–11%), n=46 | 8% (6%–13%), n=15 | 7% (5%–9%), n=16 | 6% (4%–9%), n=15 |
| Keuze-idle lategame | 5% (4%–7%), n=7 | 2% (1%–2%), n=2 | 7% (6%–9%), n=4 | 5% (5%–5%), n=1 |
| Keuze-idle end | 7% (4%–9%), n=47 | 8% (4%–9%), n=15 | 7% (4%–9%), n=14 | 7% (2%–8%), n=18 |
| Keuze-idle bouwwachtrij (detail) | 4% (3%–7%), n=54 | 6% (3%–9%), n=18 | 5% (3%–8%), n=18 | 3% (2%–5%), n=18 |
| Geldgebrek | 40% (37%–43%), n=54 | 38% (35%–40%), n=18 | 39% (36%–41%), n=18 | 43% (39%–46%), n=18 |
| Arm-idle | 32% (27%–35%), n=54 | 31% (28%–34%), n=18 | 33% (31%–36%), n=18 | 29% (26%–35%), n=18 |
| Productie-uptime | 32% (28%–36%), n=54 | 32% (28%–40%), n=18 | 33% (29%–36%), n=18 | 31% (27%–33%), n=18 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 296 (245–396), n=54 | 271 (257–363), n=18 | 328 (247–438), n=18 | 310 (231–380), n=18 |
| Productieopties gebouw · inf · voertuig | 13 (10–13), n=54 · 6 (5–6), n=54 · 5 (4–6), n=54 | 13 (13–13), n=18 · 6 (6–6), n=18 · 4 (4–4), n=18 | 13 (9–13), n=18 · 6 (5–8), n=18 · 8 (5–10), n=18 | 13 (10–13), n=18 · 5 (5–5), n=18 · 5 (3–5), n=18 |
| Gebruikte breedte (defs in 2 min) | 5.0 (4.0–6.0), n=54 | 4.0 (4.0–6.0), n=18 | 5.0 (3.3–5.0), n=18 | 5.0 (4.0–6.0), n=18 |
| Langste gat zonder beslissing (s) | 82 (75–88), n=54 | 80 (73–82), n=18 | 80 (72–83), n=18 | 88 (83–93), n=18 |
| Mediaan gat (s) | 5.3 (4.0–6.9), n=54 | 6.0 (4.3–8.3), n=18 | 5.3 (4.3–6.4), n=18 | 4.5 (3.3–6.4), n=18 |
| Dominante eenheid, % tijd boven 50% | 84% (76%–93%), n=54 | 92% (81%–96%), n=18 | 88% (80%–95%), n=18 | 79% (73%–87%), n=18 |
| Planwissels per potje | 8.0 (7.0–9.0), n=54 | 8.0 (7.0–8.8), n=18 | 8.0 (7.0–9.8), n=18 | 8.0 (6.3–8.8), n=18 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | – | – | – | – |
| tech | 4.00 (3.55–4.34), n=54 | 3.64 (3.50–4.33), n=18 | 3.95 (3.49–4.29), n=18 | 4.04 (3.87–4.69), n=18 |
| ecoAttack | 5.34 (4.68–5.83), n=44 | 5.33 (4.82–5.56), n=15 | 5.30 (4.83–5.94), n=14 | 5.43 (4.62–5.85), n=15 |
| defense | 5.67 (5.47–5.67), n=14 | 5.43 (5.23–5.67), n=5 | 6.77 (6.19–7.04), n=4 | 5.67 (5.63–5.67), n=5 |
| counter | 2.91 (2.75–3.12), n=52 | 2.75 (1.00–3.05), n=16 | 2.84 (2.75–3.15), n=18 | 3.00 (2.86–3.11), n=18 |
| factionMechanic | 5.78 (4.99–7.04), n=12 | – | 5.73 (4.82–5.82), n=9 | 9.48 (7.62–14.30), n=3 |
| strategic | 2.93 (2.75–3.15), n=54 | 2.76 (1.07–3.17), n=18 | 2.84 (2.75–3.15), n=18 | 3.00 (2.86–3.11), n=18 |
| Reactietijd verdediging (s) | 19 (7–32), n=14 | 6 (5–12), n=5 | 35 (31–37), n=4 | 19 (11–22), n=5 |

## D. Superwapens

Eerste schot per potje: 1 van 27 potjes. Bakken op totale waarde (leger + gebouwen + credits); de indeling op legerwaarde ernaast. Een bak met n < 15 is onbeslist.

| Bak | n (leger-bak n) | Tegenstander uit < 90 s | Beslissend achter < 90 s | Winst schutter | Verlies tegenstander 90 s (mediaan $) | Waarvan superwapen |
| --- | --- | --- | --- | --- | --- | --- |
| ahead | 1 (0) onbeslist | 0/1 (0%) | 0/1 (0%) | 0/1 (0%) | 6100 | 85% |
| even | 0 (0) onbeslist | – | – | – | – | 0% |
| behind | 0 (1) onbeslist | – | – | – | – | 0% |

Overwinst: draai dezelfde run met `BALANCE_NOSW=1` en geef hem mee met `BALANCE_CONTROL=<json>`.

## E. Sneeuwbal, comeback, deathball

| Metriek | Waarde |
| --- | --- |
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 9/11 (82%) |
| Comeback | 10/25 (40%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 24/25 (96%) |
| ...waarvan na 15 min | 1/25 (4%) |
| Legerconcentratie opening | 0.85 (0.67–1.00), n=54 |
| Legerconcentratie contact | 0.83 (0.68–0.97), n=54 |
| Legerconcentratie midgame | 0.83 (0.68–0.95), n=44 |
| Legerconcentratie lategame | 0.73 (0.64–0.95), n=6 |
| Legerconcentratie end | 0.73 (0.58–0.83), n=38 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 3500 (2800–4200), n=54 | 3710 (3080–4200), n=18 | 3850 (2800–4725), n=18 | 3255 (2275–3500), n=18 |
| Inkomen minuut 6 ($/min) | 2388 (1834–2809), n=54 | 2336 (1947–3138), n=18 | 2440 (1656–2657), n=18 | 2384 (1742–2809), n=18 |
| Inkomen minuut 10 ($/min) | 370 (0–1361), n=36 | 284 (0–1124), n=11 | 648 (0–1348), n=13 | 68 (0–1278), n=12 |
| Inkomen minuut 15 ($/min) | 1200 (560–1753), n=8 | 432 (304–560), n=2 | 1736 (1000–1804), n=5 | 1400 (1400–1400), n=1 |
| Besteed minuut 3 ($/min) | 3230 (2205–3707), n=54 | 3546 (2188–3807), n=18 | 3523 (2183–3796), n=18 | 2801 (2294–3284), n=18 |
| Besteed minuut 6 ($/min) | 2441 (1895–3034), n=54 | 2558 (1997–3011), n=18 | 2441 (2016–2950), n=18 | 2384 (1792–3097), n=18 |
| Besteed minuut 10 ($/min) | 711 (3–1299), n=36 | 903 (53–1192), n=11 | 699 (259–1489), n=13 | 455 (2–1278), n=12 |
| Besteed minuut 15 ($/min) | 1382 (921–2152), n=8 | 1781 (1235–2326), n=2 | 1364 (998–2147), n=5 | 1400 (1400–1400), n=1 |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=54 | 1 (1–1), n=18 | 1 (1–1), n=18 | 1 (1–1), n=18 |
| Startveld < 25% (min) | 3.17 (3.00–3.17), n=54 | 3.17 (3.00–3.17), n=18 | 3.08 (3.00–3.17), n=18 | 3.17 (3.17–3.33), n=18 |
| Tweede CY (min) | – | – | – | – |
| Inkomen uit Fuel Rigs ($, heel potje) | 0 (0–0), n=54 | 0 (0–0), n=18 | 0 (0–0), n=18 | 0 (0–0), n=18 |
| Harassment: kosten per raid (min inkomen) | 0.92 (0.62–1.26), n=40 | 0.92 (0.84–1.10), n=14 | 0.86 (0.50–1.41), n=13 | 1.03 (0.69–1.32), n=13 |
| Harassment netto (min inkomen, min daling aanvaller) | 0.33 (-0.06–0.82), n=40 | 0.29 (-0.03–0.53), n=14 | 0.53 (0.16–0.94), n=13 | 0.14 (-0.06–0.93), n=13 |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 54/54 (100%) |
| Speler met een tweede CY | 0/54 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 25/50 (50%) |
| Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23) | 16/69 (23%) |
| Patstellingen | 2/27 (7%) |

## G. Gebruik en balans

Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).

| Factie | Winrate niet-spiegel | 95%-interval | Aandeel overwinningen (alle potjes) |
| --- | --- | --- | --- |
| allies | 7/12 (58%) | 32%–81% | 10/25 |
| soviets | 4/12 (33%) | 14%–61% | 5/25 |
| psi | 7/12 (58%) | 32%–81% | 10/25 |

Zetelbias (spiegelpotjes): speler 0 wint 3 van 7.

| Eenheid | Gebouwd | Kills | Kosten-efficiëntie | % overleeft ≥ 60 s |
| --- | ---: | ---: | ---: | ---: |
| Warden Tank (`tank_allies`) | 143 | 327 | 2.82 | 85% |
| Rifleman (`rifle`) | 139 | 22 | 0.30 | 91% |
| Anvil Heavy Tank (`tank_soviets`) | 97 | 185 | 1.92 | 75% |
| Lash Tank (`tank_psi`) | 92 | 234 | 2.91 | 79% |
| Ore Hauler (`miner`) | 56 | 0 | 0.00 | 75% |
| Adept (`initiate`) | 54 | 9 | 0.52 | 93% |
| Rocket Trooper (`rocket`) | 51 | 25 | 1.19 | 98% |
| Mauler (`brute`) | 46 | 81 | 2.83 | 91% |
| Lancer IFV (`ifv`) | 40 | 41 | 1.39 | 90% |
| Spinner Tank (`gatling`) | 39 | 16 | 0.25 | 74% |
| Scout Jeep (`jeep`) | 37 | 28 | 0.35 | 76% |
| Engineer (`engineer`) | 32 | 0 | 0.00 | 84% |
| Thrall Hauler (`thrallhauler`) | 30 | 0 | 0.00 | 80% |
| Refractor Tank (`prism`) | 20 | 26 | 0.86 | 90% |
| Longbow Launcher (`artillery`) | 19 | 54 | 3.08 | 84% |
| Arc Trooper (`arc`) | 16 | 4 | 0.31 | 63% |
| Leech Drone (`leechdrone`) | 13 | 0 | 0.00 | 92% |
| Flak Gunner (`flakgunner`) | 13 | 7 | 0.15 | 100% |
| Colossus Tank (`heavy`) | 9 | 48 | 2.39 | 89% |
| Thunderhead Airship (`airship`) | 9 | 92 | 5.76 | 100% |
| Toxin Sniper (`toxin`) | 4 | 0 | 0.00 | 100% |
| Delirium Drone (`deliriumdrone`) | 4 | 0 | 0.00 | 50% |
| Siege Rotor (`siegerotor`) | 3 | 6 | 0.97 | 100% |
| Magnetar (`magnetar`) | 3 | 18 | 5.58 | 100% |
| Flak Hauler (`flakhauler`) | 3 | 0 | 0.00 | 33% |
| Mentalist (`mentalist`) | 2 | 0 | 0.00 | 50% |
| Hivemind (`hivemind`) | 2 | 0 | 0.00 | 100% |
| Grom (`grom`) | 1 | 0 | 0.00 | 0% |
| Sapper (`sapper`) | 1 | 0 | 0.00 | 100% |
| Skyjumper (`skyjumper`) | 1 | 3 | 3.75 | 100% |
| Hover Disc (`disc`) | 1 | 24 | 18.53 | 100% |
| The Oracle (`oracle`) | 1 | 0 | 0.00 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/25 | 0/25 |
| ES | 3/25 | 6/25 |
| PB | 11/25 | 14/25 |
| SC | 0/25 | 1/25 |
| BG | 7/25 | 13/25 |
| SW | 0/25 | 0/25 |
| OV | 0/25 | 0/25 |
| VA | 0/25 | 0/25 |
| X | 4/25 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
