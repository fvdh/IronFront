# Meting nul-normal-medium (2026-10-06)

Build 1.3.0+2f1b3f7d · AI-versie 1 · 27 potjes · maps=plains,rivers,highlands · seeds=1 vanaf 1000 · size=medium · diff=normal,normal · superwapens=aan · ore=v12 (standaard) · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | – — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 7% (6%–10%), n=46 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 45% (36%–55%), n=54 |
| Dominante eenheid (gemiddeld aandeel) | 68% (63%–76%), n=54 |
| Legerconcentratie lategame | 0.80 (0.66–0.90), n=3 |
| Comeback (winnaar stond ooit ≥ 40% achter) | 8/26 (31%) |
| Patstellingen (30 min zonder winnaar) | 1/27 (4%) |
| Tijd tot eerste strategische keuze (min) | 2.93 (2.75–3.15), n=54 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 9.68 (8.69–10.32), n=27 |
| Eerste contact (min) | 5.05 (4.21–5.52), n=27 |
| TTK eerste gevecht (s) | 116.4 (98.5–156.9), n=27 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=27 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.15 (1.07–1.28), n=24 · 1.06 (1.04–1.11), n=27 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | 5.00 (3.04–6.80), n=3 · 2.16 (1.61–3.27), n=7 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | 3.65 (3.65–3.65), n=1 · 2.34 (2.24–2.45), n=2 |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | 1.19 (1.19–1.19), n=1 · 1.40 (1.40–1.40), n=1 |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 8% (7%–9%), n=54 | 8% (7%–10%), n=18 | 8% (7%–9%), n=18 | 7% (6%–8%), n=18 |
| Keuze-idle opening | 9% (7%–11%), n=54 | 9% (8%–11%), n=18 | 11% (9%–12%), n=18 | 7% (6%–8%), n=18 |
| Keuze-idle contact | 8% (6%–12%), n=54 | 11% (6%–14%), n=18 | 9% (7%–12%), n=18 | 7% (6%–9%), n=18 |
| Keuze-idle midgame | 7% (6%–10%), n=46 | 8% (7%–14%), n=15 | 7% (5%–10%), n=16 | 6% (4%–8%), n=15 |
| Keuze-idle lategame | 5% (3%–7%), n=4 | 2% (1%–3%), n=2 | 8% (7%–8%), n=2 | – |
| Keuze-idle end | 7% (4%–8%), n=53 | 7% (4%–9%), n=18 | 5% (3%–8%), n=17 | 7% (4%–8%), n=18 |
| Keuze-idle bouwwachtrij (detail) | 5% (3%–7%), n=54 | 5% (3%–9%), n=18 | 6% (4%–7%), n=18 | 4% (2%–5%), n=18 |
| Geldgebrek | 40% (37%–43%), n=54 | 38% (34%–41%), n=18 | 39% (38%–42%), n=18 | 41% (39%–46%), n=18 |
| Arm-idle | 32% (27%–34%), n=54 | 31% (28%–34%), n=18 | 33% (29%–36%), n=18 | 30% (27%–35%), n=18 |
| Productie-uptime | 32% (28%–35%), n=54 | 34% (30%–40%), n=18 | 33% (30%–35%), n=18 | 30% (28%–33%), n=18 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 292 (247–372), n=54 | 278 (257–393), n=18 | 313 (257–367), n=18 | 273 (188–336), n=18 |
| Productieopties gebouw · inf · voertuig | 13 (10–13), n=54 · 6 (5–6), n=54 · 5 (4–8), n=54 | 13 (13–13), n=18 · 6 (6–6), n=18 · 4 (4–4), n=18 | 13 (10–13), n=18 · 6 (6–8), n=18 · 8 (6–10), n=18 | 13 (10–13), n=18 · 5 (5–5), n=18 · 5 (3–5), n=18 |
| Gebruikte breedte (defs in 2 min) | 5.0 (4.0–6.0), n=54 | 4.5 (4.0–6.0), n=18 | 5.0 (5.0–6.0), n=18 | 5.0 (5.0–5.9), n=18 |
| Langste gat zonder beslissing (s) | 82 (79–92), n=54 | 81 (73–82), n=18 | 82 (79–102), n=18 | 88 (83–93), n=18 |
| Mediaan gat (s) | 5.0 (4.0–7.0), n=54 | 6.0 (5.0–8.6), n=18 | 5.3 (4.0–7.0), n=18 | 4.8 (4.0–5.9), n=18 |
| Dominante eenheid, % tijd boven 50% | 84% (73%–93%), n=54 | 93% (84%–96%), n=18 | 87% (78%–94%), n=18 | 77% (72%–82%), n=18 |
| Planwissels per potje | 8.0 (7.0–8.0), n=54 | 8.0 (7.0–8.8), n=18 | 7.5 (7.0–8.0), n=18 | 8.0 (7.0–8.0), n=18 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | – | – | – | – |
| tech | 4.00 (3.55–4.34), n=54 | 3.64 (3.50–4.33), n=18 | 3.95 (3.49–4.29), n=18 | 4.04 (3.87–4.69), n=18 |
| ecoAttack | 5.35 (4.68–5.84), n=45 | 5.34 (4.90–5.64), n=16 | 5.12 (4.82–5.82), n=13 | 5.47 (4.65–5.93), n=16 |
| defense | 5.67 (5.47–6.11), n=14 | 5.43 (5.23–5.67), n=5 | 6.33 (6.25–6.65), n=5 | 5.65 (5.62–5.67), n=4 |
| counter | 2.93 (2.75–3.13), n=53 | 2.76 (1.07–3.17), n=18 | 2.83 (2.75–3.07), n=17 | 3.00 (2.86–3.11), n=18 |
| factionMechanic | 5.75 (4.94–6.02), n=11 | – | 5.73 (4.82–5.82), n=9 | 8.91 (7.33–10.49), n=2 |
| strategic | 2.93 (2.75–3.15), n=54 | 2.76 (1.07–3.17), n=18 | 2.84 (2.75–3.15), n=18 | 3.00 (2.86–3.11), n=18 |
| Reactietijd verdediging (s) | 19 (7–29), n=14 | 6 (5–12), n=5 | 31 (24–35), n=5 | 21 (15–31), n=4 |

## D. Superwapens

Eerste schot per potje: 1 van 27 potjes. Bakken op totale waarde (leger + gebouwen + credits); de indeling op legerwaarde ernaast. Een bak met n < 15 is onbeslist.

| Bak | n (leger-bak n) | Tegenstander uit < 90 s | Beslissend achter < 90 s | Winst schutter | Verlies tegenstander 90 s (mediaan $) | Waarvan superwapen |
| --- | --- | --- | --- | --- | --- | --- |
| ahead | 1 (1) onbeslist | 0/1 (0%) | 0/1 (0%) | 0/1 (0%) | 4400 | 86% |
| even | 0 (0) onbeslist | – | – | – | – | 0% |
| behind | 0 (0) onbeslist | – | – | – | – | 0% |

Overwinst: draai dezelfde run met `BALANCE_NOSW=1` en geef hem mee met `BALANCE_CONTROL=<json>`.

## E. Sneeuwbal, comeback, deathball

| Metriek | Waarde |
| --- | --- |
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 8/9 (89%) |
| Comeback | 8/26 (31%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 26/26 (100%) |
| ...waarvan na 15 min | 1/26 (4%) |
| Legerconcentratie opening | 0.85 (0.67–1.00), n=54 |
| Legerconcentratie contact | 0.83 (0.70–0.99), n=54 |
| Legerconcentratie midgame | 0.86 (0.73–1.00), n=42 |
| Legerconcentratie lategame | 0.80 (0.66–0.90), n=3 |
| Legerconcentratie end | 0.74 (0.63–0.84), n=39 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 3500 (2800–4200), n=54 | 3710 (3080–4200), n=18 | 3850 (2800–4725), n=18 | 3255 (2275–3500), n=18 |
| Inkomen minuut 6 ($/min) | 2388 (1834–2884), n=54 | 2336 (1947–3138), n=18 | 2440 (1656–2657), n=18 | 2384 (1742–2884), n=18 |
| Inkomen minuut 10 ($/min) | 356 (0–1428), n=34 | 296 (19–2044), n=10 | 496 (0–1080), n=13 | 224 (0–1032), n=11 |
| Inkomen minuut 15 ($/min) | 844 (560–1184), n=4 | 432 (304–560), n=2 | 1368 (1184–1552), n=2 | – |
| Besteed minuut 3 ($/min) | 3230 (2205–3707), n=54 | 3546 (2188–3807), n=18 | 3523 (2183–3796), n=18 | 2801 (2294–3284), n=18 |
| Besteed minuut 6 ($/min) | 2441 (1895–3034), n=54 | 2558 (1997–3011), n=18 | 2441 (2016–2950), n=18 | 2384 (1792–3122), n=18 |
| Besteed minuut 10 ($/min) | 712 (109–1585), n=34 | 1121 (26–1780), n=10 | 699 (216–1201), n=13 | 700 (232–1284), n=11 |
| Besteed minuut 15 ($/min) | 1573 (921–2328), n=4 | 1781 (1235–2326), n=2 | 1573 (1285–1860), n=2 | – |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=54 | 1 (1–1), n=18 | 1 (1–1), n=18 | 1 (1–1), n=18 |
| Startveld < 25% (min) | 3.17 (3.00–3.17), n=54 | 3.17 (3.00–3.17), n=18 | 3.08 (3.00–3.17), n=18 | 3.17 (3.17–3.33), n=18 |
| Tweede CY (min) | – | – | – | – |
| Inkomen uit Fuel Rigs ($, heel potje) | – | – | – | – |
| Harassment: kosten per raid (min inkomen) | 1.03 (0.74–1.47), n=39 | 0.99 (0.85–1.31), n=14 | 1.20 (0.88–1.59), n=12 | 0.91 (0.67–1.48), n=13 |
| Harassment netto (min inkomen, min daling aanvaller) | 0.34 (-0.08–0.90), n=39 | 0.29 (-0.08–0.70), n=14 | 0.64 (0.25–1.08), n=12 | 0.03 (-0.31–0.93), n=13 |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 54/54 (100%) |
| Speler met een tweede CY | 0/54 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 26/52 (50%) |
| Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23) | 14/56 (25%) |
| Patstellingen | 1/27 (4%) |

## G. Gebruik en balans

Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).

| Factie | Winrate niet-spiegel | 95%-interval | Aandeel overwinningen (alle potjes) |
| --- | --- | --- | --- |
| allies | 6/12 (50%) | 25%–75% | 9/26 |
| soviets | 5/12 (42%) | 19%–68% | 7/26 |
| psi | 7/12 (58%) | 32%–81% | 10/26 |

Zetelbias (spiegelpotjes): speler 0 wint 4 van 8.

| Eenheid | Gebouwd | Kills | Kosten-efficiëntie | % overleeft ≥ 60 s |
| --- | ---: | ---: | ---: | ---: |
| Warden Tank (`tank_allies`) | 139 | 300 | 2.66 | 84% |
| Rifleman (`rifle`) | 132 | 23 | 0.33 | 93% |
| Anvil Heavy Tank (`tank_soviets`) | 94 | 198 | 2.11 | 77% |
| Lash Tank (`tank_psi`) | 87 | 228 | 2.98 | 80% |
| Ore Hauler (`miner`) | 56 | 0 | 0.00 | 77% |
| Adept (`initiate`) | 54 | 10 | 0.83 | 93% |
| Rocket Trooper (`rocket`) | 53 | 25 | 1.22 | 94% |
| Mauler (`brute`) | 46 | 90 | 3.03 | 89% |
| Lancer IFV (`ifv`) | 41 | 41 | 1.17 | 90% |
| Spinner Tank (`gatling`) | 34 | 18 | 0.32 | 76% |
| Scout Jeep (`jeep`) | 33 | 12 | 0.06 | 73% |
| Thrall Hauler (`thrallhauler`) | 31 | 0 | 0.00 | 71% |
| Engineer (`engineer`) | 29 | 0 | 0.00 | 83% |
| Longbow Launcher (`artillery`) | 20 | 58 | 2.57 | 90% |
| Refractor Tank (`prism`) | 19 | 28 | 0.85 | 89% |
| Leech Drone (`leechdrone`) | 13 | 0 | 0.00 | 92% |
| Flak Gunner (`flakgunner`) | 13 | 6 | 0.10 | 100% |
| Arc Trooper (`arc`) | 12 | 6 | 1.33 | 75% |
| Colossus Tank (`heavy`) | 8 | 39 | 3.30 | 100% |
| Thunderhead Airship (`airship`) | 5 | 39 | 2.87 | 100% |
| Delirium Drone (`deliriumdrone`) | 5 | 0 | 0.00 | 20% |
| Siege Rotor (`siegerotor`) | 3 | 9 | 2.05 | 100% |
| Magnetar (`magnetar`) | 3 | 12 | 4.00 | 100% |
| Flak Hauler (`flakhauler`) | 2 | 0 | 0.00 | 100% |
| Toxin Sniper (`toxin`) | 2 | 0 | 0.00 | 100% |
| Mentalist (`mentalist`) | 1 | 0 | 0.00 | 100% |
| Sapper (`sapper`) | 1 | 0 | 0.00 | 100% |
| Hover Disc (`disc`) | 1 | 1 | 0.13 | 100% |
| The Oracle (`oracle`) | 1 | 0 | 0.00 | 100% |
| Hivemind (`hivemind`) | 1 | 0 | 0.00 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/26 | 0/26 |
| ES | 5/26 | 7/26 |
| PB | 0/26 | 0/26 |
| SC | 0/26 | 2/26 |
| BG | 15/26 | 15/26 |
| SW | 0/26 | 0/26 |
| OV | 0/26 | 0/26 |
| VA | 0/26 | 0/26 |
| X | 6/26 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
