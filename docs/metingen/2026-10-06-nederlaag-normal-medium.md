# Meting nederlaag-normal-medium (2026-10-06)

Build 1.3.0+49aad606-dirty · AI-versie 2 · 27 potjes · maps=plains,rivers,highlands · seeds=1 vanaf 1000 · size=medium · diff=normal,normal · superwapens=aan · ore=v12 (standaard) · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | – — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 7% (4%–11%), n=44 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 43% (36%–55%), n=54 |
| Dominante eenheid (gemiddeld aandeel) | 69% (65%–77%), n=54 |
| Legerconcentratie lategame | 0.82 (0.74–0.91), n=2 |
| Comeback (winnaar stond ooit ≥ 40% achter) | 11/27 (41%) |
| Patstellingen (30 min zonder winnaar) | 0/27 (0%) |
| Tijd tot eerste strategische keuze (min) | 2.93 (2.75–3.15), n=54 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 9.38 (8.51–10.50), n=27 |
| Eerste contact (min) | 5.05 (4.21–5.52), n=27 |
| TTK eerste gevecht (s) | 116.4 (98.5–158.1), n=27 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=27 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.15 (1.07–1.28), n=24 · 1.06 (1.04–1.11), n=27 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | 3.36 (2.01–4.44), n=4 · 2.04 (1.47–3.89), n=8 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | 3.65 (3.65–3.65), n=1 · 2.13 (1.69–2.34), n=3 |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | 1.56 (1.56–1.56), n=1 · 1.40 (1.40–1.40), n=1 |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 8% (7%–9%), n=54 | 8% (7%–10%), n=18 | 8% (7%–9%), n=18 | 7% (5%–8%), n=18 |
| Keuze-idle opening | 9% (7%–11%), n=54 | 9% (8%–11%), n=18 | 11% (9%–12%), n=18 | 7% (6%–8%), n=18 |
| Keuze-idle contact | 8% (7%–11%), n=54 | 11% (6%–14%), n=18 | 9% (7%–12%), n=18 | 7% (6%–9%), n=18 |
| Keuze-idle midgame | 7% (4%–11%), n=44 | 8% (6%–13%), n=15 | 5% (4%–9%), n=14 | 7% (2%–8%), n=15 |
| Keuze-idle lategame | 7% (4%–9%), n=4 | 6% (3%–9%), n=2 | 7% (6%–7%), n=2 | – |
| Keuze-idle end | 7% (4%–9%), n=54 | 7% (4%–9%), n=18 | 7% (5%–9%), n=18 | 7% (3%–8%), n=18 |
| Keuze-idle bouwwachtrij (detail) | 5% (3%–7%), n=54 | 6% (3%–9%), n=18 | 6% (4%–8%), n=18 | 3% (2%–5%), n=18 |
| Geldgebrek | 40% (37%–43%), n=54 | 38% (34%–40%), n=18 | 39% (36%–41%), n=18 | 43% (39%–45%), n=18 |
| Arm-idle | 32% (27%–35%), n=54 | 31% (28%–34%), n=18 | 33% (32%–36%), n=18 | 29% (26%–35%), n=18 |
| Productie-uptime | 32% (29%–36%), n=54 | 32% (29%–40%), n=18 | 34% (29%–36%), n=18 | 32% (28%–33%), n=18 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 296 (253–397), n=54 | 271 (257–376), n=18 | 353 (258–440), n=18 | 287 (231–366), n=18 |
| Productieopties gebouw · inf · voertuig | 13 (10–13), n=54 · 6 (5–6), n=54 · 5 (4–8), n=54 | 13 (13–13), n=18 · 6 (6–6), n=18 · 4 (4–4), n=18 | 13 (10–13), n=18 · 6 (6–8), n=18 · 8 (8–10), n=18 | 13 (10–13), n=18 · 5 (5–5), n=18 · 5 (3–5), n=18 |
| Gebruikte breedte (defs in 2 min) | 5.0 (4.0–6.0), n=54 | 4.3 (4.0–6.0), n=18 | 5.0 (4.6–5.8), n=18 | 5.0 (4.3–6.0), n=18 |
| Langste gat zonder beslissing (s) | 81 (74–87), n=54 | 80 (73–82), n=18 | 80 (72–83), n=18 | 85 (78–89), n=18 |
| Mediaan gat (s) | 5.8 (4.0–7.0), n=54 | 6.0 (5.0–8.6), n=18 | 5.8 (4.1–7.0), n=18 | 4.8 (3.3–6.4), n=18 |
| Dominante eenheid, % tijd boven 50% | 83% (75%–93%), n=54 | 92% (80%–96%), n=18 | 83% (78%–94%), n=18 | 78% (74%–87%), n=18 |
| Planwissels per potje | 8.0 (7.0–9.0), n=54 | 8.0 (7.0–8.8), n=18 | 8.0 (7.0–9.8), n=18 | 8.0 (6.3–8.0), n=18 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | – | – | – | – |
| tech | 4.00 (3.55–4.34), n=54 | 3.64 (3.50–4.33), n=18 | 3.95 (3.49–4.29), n=18 | 4.04 (3.87–4.69), n=18 |
| ecoAttack | 5.33 (4.68–5.79), n=43 | 5.33 (4.82–5.56), n=15 | 5.12 (4.82–5.82), n=13 | 5.43 (4.62–5.85), n=15 |
| defense | 5.67 (5.47–5.67), n=14 | 5.43 (5.23–5.67), n=5 | 6.77 (6.19–7.04), n=4 | 5.67 (5.63–5.67), n=5 |
| counter | 2.91 (2.75–3.12), n=52 | 2.75 (1.00–3.05), n=16 | 2.84 (2.75–3.15), n=18 | 3.00 (2.86–3.11), n=18 |
| factionMechanic | 5.75 (4.94–6.02), n=11 | – | 5.73 (4.82–5.82), n=9 | 7.62 (6.68–8.55), n=2 |
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
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 6/7 (86%) |
| Comeback | 11/27 (41%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 26/27 (96%) |
| ...waarvan na 15 min | 2/27 (7%) |
| Legerconcentratie opening | 0.85 (0.67–1.00), n=54 |
| Legerconcentratie contact | 0.83 (0.68–0.97), n=54 |
| Legerconcentratie midgame | 0.85 (0.69–1.00), n=41 |
| Legerconcentratie lategame | 0.82 (0.74–0.91), n=2 |
| Legerconcentratie end | 0.72 (0.56–0.84), n=39 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 3500 (2800–4200), n=54 | 3710 (3080–4200), n=18 | 3850 (2800–4725), n=18 | 3255 (2275–3500), n=18 |
| Inkomen minuut 6 ($/min) | 2388 (1834–2809), n=54 | 2336 (1947–3138), n=18 | 2440 (1656–2657), n=18 | 2384 (1742–2809), n=18 |
| Inkomen minuut 10 ($/min) | 492 (0–1287), n=30 | 386 (26–1192), n=10 | 648 (0–1110), n=11 | 136 (0–1104), n=9 |
| Inkomen minuut 15 ($/min) | 844 (304–1042), n=6 | 432 (304–560), n=2 | 1000 (564–1368), n=3 | 1056 (1056–1056), n=1 |
| Besteed minuut 3 ($/min) | 3230 (2205–3707), n=54 | 3546 (2188–3807), n=18 | 3523 (2183–3796), n=18 | 2801 (2294–3284), n=18 |
| Besteed minuut 6 ($/min) | 2441 (1895–3034), n=54 | 2558 (1997–3011), n=18 | 2441 (2016–2950), n=18 | 2384 (1792–3097), n=18 |
| Besteed minuut 10 ($/min) | 772 (305–1227), n=30 | 813 (255–1214), n=10 | 699 (377–1345), n=11 | 820 (444–1042), n=9 |
| Besteed minuut 15 ($/min) | 1203 (1013–1947), n=6 | 1781 (1235–2326), n=2 | 1348 (1173–1748), n=3 | 1057 (1057–1057), n=1 |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=54 | 1 (1–1), n=18 | 1 (1–1), n=18 | 1 (1–1), n=18 |
| Startveld < 25% (min) | 3.17 (3.00–3.17), n=54 | 3.17 (3.00–3.17), n=18 | 3.08 (3.00–3.17), n=18 | 3.17 (3.17–3.33), n=18 |
| Tweede CY (min) | – | – | – | – |
| Inkomen uit Fuel Rigs ($, heel potje) | 0 (0–0), n=54 | 0 (0–0), n=18 | 0 (0–0), n=18 | 0 (0–0), n=18 |
| Harassment: kosten per raid (min inkomen) | 0.95 (0.50–1.23), n=37 | 0.95 (0.84–1.10), n=13 | 0.50 (0.47–1.19), n=11 | 1.03 (0.69–1.32), n=13 |
| Harassment netto (min inkomen, min daling aanvaller) | 0.29 (-0.06–0.72), n=37 | 0.32 (0.06–0.55), n=13 | 0.34 (0.14–0.79), n=11 | 0.14 (-0.18–0.93), n=13 |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 54/54 (100%) |
| Speler met een tweede CY | 0/54 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 27/54 (50%) |
| Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23) | 10/57 (18%) |
| Patstellingen | 0/27 (0%) |

## G. Gebruik en balans

Factiebalans (beslissing 21): winrate in **niet-spiegelpotjes**, patstelling = gespeeld en niet gewonnen, met 95%-Wilson-interval. Daarnaast het aandeel van alle overwinningen (maat van het balansplan).

| Factie | Winrate niet-spiegel | 95%-interval | Aandeel overwinningen (alle potjes) |
| --- | --- | --- | --- |
| allies | 7/12 (58%) | 32%–81% | 10/27 |
| soviets | 4/12 (33%) | 14%–61% | 7/27 |
| psi | 7/12 (58%) | 32%–81% | 10/27 |

Zetelbias (spiegelpotjes): speler 0 wint 4 van 9.

| Eenheid | Gebouwd | Kills | Kosten-efficiëntie | % overleeft ≥ 60 s |
| --- | ---: | ---: | ---: | ---: |
| Warden Tank (`tank_allies`) | 141 | 307 | 2.76 | 85% |
| Rifleman (`rifle`) | 136 | 18 | 0.25 | 90% |
| Anvil Heavy Tank (`tank_soviets`) | 96 | 179 | 1.90 | 76% |
| Lash Tank (`tank_psi`) | 90 | 226 | 2.87 | 79% |
| Ore Hauler (`miner`) | 58 | 0 | 0.00 | 76% |
| Adept (`initiate`) | 54 | 7 | 0.46 | 93% |
| Rocket Trooper (`rocket`) | 51 | 21 | 1.07 | 98% |
| Mauler (`brute`) | 46 | 75 | 2.70 | 93% |
| Lancer IFV (`ifv`) | 38 | 39 | 1.40 | 89% |
| Spinner Tank (`gatling`) | 37 | 19 | 0.51 | 73% |
| Scout Jeep (`jeep`) | 36 | 25 | 0.31 | 72% |
| Engineer (`engineer`) | 32 | 0 | 0.00 | 84% |
| Thrall Hauler (`thrallhauler`) | 28 | 0 | 0.00 | 79% |
| Longbow Launcher (`artillery`) | 19 | 52 | 2.95 | 84% |
| Refractor Tank (`prism`) | 17 | 22 | 0.95 | 88% |
| Leech Drone (`leechdrone`) | 13 | 0 | 0.00 | 92% |
| Flak Gunner (`flakgunner`) | 13 | 5 | 0.05 | 100% |
| Arc Trooper (`arc`) | 12 | 4 | 0.42 | 75% |
| Colossus Tank (`heavy`) | 8 | 34 | 2.31 | 88% |
| Thunderhead Airship (`airship`) | 7 | 38 | 3.56 | 100% |
| Magnetar (`magnetar`) | 4 | 18 | 4.18 | 100% |
| Siege Rotor (`siegerotor`) | 3 | 6 | 0.97 | 100% |
| Delirium Drone (`deliriumdrone`) | 3 | 0 | 0.00 | 33% |
| Mentalist (`mentalist`) | 2 | 0 | 0.00 | 50% |
| Toxin Sniper (`toxin`) | 2 | 0 | 0.00 | 100% |
| Grom (`grom`) | 1 | 0 | 0.00 | 0% |
| Flak Hauler (`flakhauler`) | 1 | 0 | 0.00 | 0% |
| Sapper (`sapper`) | 1 | 0 | 0.00 | 100% |
| Skyjumper (`skyjumper`) | 1 | 0 | 0.00 | 100% |
| Hover Disc (`disc`) | 1 | 14 | 10.13 | 100% |
| The Oracle (`oracle`) | 1 | 0 | 0.00 | 100% |
| Hivemind (`hivemind`) | 1 | 0 | 0.00 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/27 | 0/27 |
| ES | 4/27 | 6/27 |
| PB | 0/27 | 0/27 |
| SC | 0/27 | 2/27 |
| BG | 12/27 | 12/27 |
| SW | 0/27 | 0/27 |
| OV | 0/27 | 0/27 |
| VA | 0/27 | 0/27 |
| X | 11/27 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
