# Meting bl2-redbloc-ore-v12-zee (2026-10-06)

Build 1.3.0+8fd3bc8f-dirty · AI-versie 2 · 36 potjes · maps=coast,islands · seeds=2 vanaf 1000 · size=small · diff=hard,hard · superwapens=aan · ore=v12 · stad=aan

Alle spelers in deze run zijn AI. B-metrieken (keuzedichtheid) zijn voor de AI **diagnose**: de AI denkt elke 30–60 ticks en houdt bewust een geldreserve aan (`planUnits`), wat als keuze-idle telt. Cijfers: mediaan (Q1–Q3). Er staan bewust geen grenzen in dit rapport; die komen in `docs/metingen/grenzen.md` (§2 regel 6).

Kanttekening: de AI breidt niet uit naar andere velden (alleen een Base Crawler zonder CY, `crawlers()` in `ai.ts`); uitbreidingscijfers meten dat gedrag.

## Alarmbellen

| Signaal | Waarde |
| --- | --- |
| Superwapen: bak `gelijk` → tegenstander binnen 90 s uit | – — **onbeslist** (n < 15) |
| Keuze-idle midgame (unit-wachtrijen) | 1% (0%–3%), n=40 |
| Tijd zonder beslissing ≥ 30 s (aandeel speeltijd) | 56% (46%–75%), n=72 |
| Dominante eenheid (gemiddeld aandeel) | 76% (66%–82%), n=72 |
| Legerconcentratie lategame | 0.81 (0.81–0.81), n=2 |
| Comeback (winnaar stond ooit ≥ 40% achter) | 11/36 (31%) |
| Patstellingen (30 min zonder winnaar) | 0/36 (0%) |
| Tijd tot eerste strategische keuze (min) | 3.16 (2.72–4.13), n=72 |

## A. Verloop

| Metriek | Waarde |
| --- | --- |
| Duur (min) | 8.47 (6.98–11.76), n=36 |
| Eerste contact (min) | 4.09 (2.83–4.75), n=36 |
| TTK eerste gevecht (s) | 133.6 (115.5–174.4), n=36 |
| Grootste gevecht (% legerwaarde van één kant) | 100% (100%–100%), n=36 |
| Voorsprong op 5 min (leger · inkomen, wie voor staat : de ander) | 1.43 (1.15–1.53), n=20 · 1.28 (1.09–1.48), n=35 |
| Voorsprong op 10 min (leger · inkomen, wie voor staat : de ander) | – · 8.85 (1.70–10.45), n=7 |
| Voorsprong op 15 min (leger · inkomen, wie voor staat : de ander) | – · – |
| Voorsprong op 20 min (leger · inkomen, wie voor staat : de ander) | – · – |

## B. Keuzedichtheid (AI: diagnose)

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Keuze-idle (hoofdmetriek) | 5% (2%–8%), n=72 | 5% (2%–7%), n=24 | 6% (3%–8%), n=24 | 4% (3%–8%), n=24 |
| Keuze-idle opening | 6% (3%–7%), n=72 | 5% (3%–7%), n=24 | 7% (4%–7%), n=24 | 4% (3%–7%), n=24 |
| Keuze-idle contact | 6% (2%–10%), n=72 | 6% (2%–10%), n=24 | 7% (2%–10%), n=24 | 5% (3%–9%), n=24 |
| Keuze-idle midgame | 1% (0%–3%), n=40 | 3% (1%–3%), n=12 | 1% (0%–3%), n=16 | 1% (0%–3%), n=12 |
| Keuze-idle lategame | 0% (0%–0%), n=6 | 0% (0%–0%), n=1 | 0% (0%–0%), n=2 | 0% (0%–0%), n=3 |
| Keuze-idle end | 5% (1%–10%), n=70 | 6% (2%–9%), n=23 | 4% (0%–9%), n=23 | 5% (1%–10%), n=24 |
| Keuze-idle bouwwachtrij (detail) | 5% (4%–9%), n=72 | 5% (4%–9%), n=24 | 7% (4%–9%), n=24 | 5% (3%–8%), n=24 |
| Geldgebrek | 46% (42%–50%), n=72 | 46% (43%–50%), n=24 | 44% (42%–48%), n=24 | 49% (43%–60%), n=24 |
| Arm-idle | 36% (32%–40%), n=72 | 37% (33%–41%), n=24 | 39% (35%–41%), n=24 | 32% (29%–35%), n=24 |
| Productie-uptime | 21% (12%–26%), n=72 | 21% (12%–27%), n=24 | 20% (10%–25%), n=24 | 22% (10%–25%), n=24 |
| Ongebruikt geld (gem. credits bij keuze-idle) | 278 (169–375), n=72 | 236 (169–325), n=24 | 348 (253–432), n=24 | 263 (123–331), n=24 |
| Productieopties gebouw · inf · voertuig | 9 (9–10), n=72 · 4 (3–4), n=72 · 3 (3–5), n=72 | 9 (9–10), n=24 · 4 (4–5), n=24 · 3 (3–3), n=24 | 9 (9–9), n=24 · 4 (4–4), n=24 · 5 (5–5), n=24 | 10 (10–10), n=24 · 3 (3–3), n=24 · 3 (3–3), n=24 |
| Gebruikte breedte (defs in 2 min) | 4.0 (2.0–5.0), n=72 | 4.0 (1.8–5.0), n=24 | 4.0 (2.0–5.0), n=24 | 4.0 (1.8–4.0), n=24 |
| Langste gat zonder beslissing (s) | 110 (86–166), n=72 | 108 (81–164), n=24 | 112 (93–196), n=24 | 116 (92–174), n=24 |
| Mediaan gat (s) | 3.5 (3.0–6.3), n=72 | 3.5 (2.9–5.0), n=24 | 4.0 (3.0–5.6), n=24 | 3.0 (2.0–7.3), n=24 |
| Dominante eenheid, % tijd boven 50% | 94% (78%–100%), n=72 | 88% (78%–98%), n=24 | 98% (86%–100%), n=24 | 95% (73%–100%), n=24 |
| Planwissels per potje | 4.5 (3.0–5.0), n=72 | 4.0 (3.0–5.0), n=24 | 5.0 (3.0–6.0), n=24 | 4.5 (4.0–5.3), n=24 |

## C. Tijd tot de eerste betekenisvolle beslissing (min; n = potjes waarin het voorkwam)

| Moment | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| expansion | – | – | – | – |
| tech | 5.02 (4.64–5.71), n=31 | 5.02 (4.30–5.62), n=13 | 4.92 (4.61–5.40), n=11 | 5.43 (5.15–6.08), n=7 |
| ecoAttack | 4.27 (3.02–4.93), n=72 | 4.54 (2.81–4.87), n=24 | 4.35 (2.83–4.97), n=24 | 4.09 (3.16–5.40), n=24 |
| defense | 6.17 (5.35–6.46), n=11 | 5.35 (5.35–5.76), n=3 | 6.75 (6.42–7.00), n=3 | 6.17 (4.97–6.17), n=5 |
| counter | 2.91 (2.72–4.35), n=40 | 2.78 (1.22–3.78), n=9 | 3.73 (2.71–4.04), n=19 | 2.91 (2.86–5.54), n=12 |
| factionMechanic | 5.40 (4.97–5.83), n=2 | – | 5.40 (4.97–5.83), n=2 | – |
| strategic | 3.16 (2.72–4.13), n=72 | 3.12 (2.65–4.52), n=24 | 2.82 (2.72–3.77), n=24 | 3.19 (2.87–4.53), n=24 |
| Reactietijd verdediging (s) | 29 (21–40), n=11 | 26 (21–31), n=3 | 31 (30–37), n=3 | 26 (10–57), n=5 |

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
| P(winst) bij legerwaarde ≥ 1,5× op 10 min | 14/14 (100%) |
| Comeback | 11/36 (31%) |
| Beslissend gevecht (≥ 50% van het leger, einde < 5 min) | 22/36 (61%) |
| ...waarvan na 15 min | 0/36 (0%) |
| Legerconcentratie opening | 0.76 (0.68–1.00), n=47 |
| Legerconcentratie contact | 0.89 (0.78–1.00), n=47 |
| Legerconcentratie midgame | 0.83 (0.68–1.00), n=22 |
| Legerconcentratie lategame | 0.81 (0.81–0.81), n=2 |
| Legerconcentratie end | 0.80 (0.71–0.88), n=49 |

## F. Economie en uitbreiding

| Metriek | Alle | allies | soviets | psi |
| --- | --- | --- | --- | --- |
| Inkomen minuut 3 ($/min) | 2100 (1144–3116), n=72 | 2042 (1144–3467), n=24 | 2090 (1142–3479), n=24 | 2100 (1130–2848), n=24 |
| Inkomen minuut 6 ($/min) | 664 (176–1726), n=72 | 846 (416–2277), n=24 | 576 (174–1305), n=24 | 682 (140–1758), n=24 |
| Inkomen minuut 10 ($/min) | 284 (0–507), n=30 | 296 (0–480), n=9 | 272 (0–468), n=11 | 212 (0–493), n=10 |
| Inkomen minuut 15 ($/min) | 140 (0–397), n=14 | 0 (0–0), n=2 | 210 (0–752), n=8 | 280 (210–292), n=4 |
| Besteed minuut 3 ($/min) | 2099 (1141–2995), n=72 | 2146 (1141–3324), n=24 | 2101 (1138–3469), n=24 | 2097 (1132–2786), n=24 |
| Besteed minuut 6 ($/min) | 1071 (252–2149), n=72 | 1071 (515–2340), n=24 | 910 (172–2269), n=24 | 1189 (371–1840), n=24 |
| Besteed minuut 10 ($/min) | 293 (0–508), n=30 | 296 (0–481), n=9 | 289 (0–601), n=11 | 302 (2–494), n=10 |
| Besteed minuut 15 ($/min) | 280 (0–400), n=14 | 0 (0–0), n=2 | 381 (0–754), n=8 | 280 (210–293), n=4 |
| Velden met eigen raffinaderij (ooit) | 1 (1–1), n=72 | 1 (1–1), n=24 | 1 (1–1), n=24 | 1 (1–1), n=24 |
| Startveld < 25% (min) | 2.67 (2.17–3.00), n=72 | 2.67 (2.12–2.83), n=24 | 2.67 (2.12–2.67), n=24 | 2.83 (2.42–3.17), n=24 |
| Tweede CY (min) | – | – | – | – |
| Inkomen uit Fuel Rigs ($, heel potje) | 0 (0–0), n=72 | 0 (0–0), n=24 | 0 (0–0), n=24 | 0 (0–0), n=24 |
| Harassment: kosten per raid (min inkomen) | 1.43 (0.88–1.77), n=54 | 1.67 (1.11–1.77), n=18 | 1.41 (1.01–1.83), n=19 | 1.32 (0.44–1.76), n=17 |
| Harassment netto (min inkomen, min daling aanvaller) | 0.04 (-0.20–0.95), n=54 | 0.04 (-0.30–0.63), n=18 | 0.05 (-0.08–0.94), n=19 | 0.03 (-0.20–0.96), n=17 |

| Metriek | Waarde |
| --- | --- |
| Startveld ooit < 25% | 72/72 (100%) |
| Speler met een tweede CY | 0/72 (0%) |
| Winst met tweede CY | – |
| Winst zonder tweede CY | 36/72 (50%) |
| Raids op de economie die ≥ 1 min inkomen kosten, netto (signaal fase 23) | 20/88 (23%) |
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
| Rifleman (`rifle`) | 132 | 50 | 0.78 | 100% |
| Warden Tank (`tank_allies`) | 88 | 149 | 2.49 | 89% |
| Ore Hauler (`miner`) | 80 | 0 | 0.00 | 57% |
| Lash Tank (`tank_psi`) | 77 | 180 | 3.27 | 91% |
| Anvil Heavy Tank (`tank_soviets`) | 72 | 122 | 1.99 | 79% |
| Rocket Trooper (`rocket`) | 44 | 45 | 3.96 | 95% |
| Mauler (`brute`) | 43 | 72 | 2.71 | 95% |
| Adept (`initiate`) | 41 | 18 | 1.62 | 95% |
| Spinner Tank (`gatling`) | 37 | 56 | 1.59 | 86% |
| Lancer IFV (`ifv`) | 35 | 41 | 1.66 | 80% |
| Thrall Hauler (`thrallhauler`) | 29 | 0 | 0.00 | 83% |
| Scout Jeep (`jeep`) | 23 | 31 | 1.00 | 87% |
| Leech Drone (`leechdrone`) | 6 | 0 | 0.00 | 67% |
| Flak Gunner (`flakgunner`) | 4 | 9 | 7.75 | 75% |
| Longbow Launcher (`artillery`) | 3 | 7 | 2.19 | 67% |
| Siege Rotor (`siegerotor`) | 3 | 9 | 1.62 | 100% |
| Barracuda Sub (`barracuda`) | 3 | 0 | 0.00 | 100% |
| Psi Submarine (`psisub`) | 2 | 0 | 0.00 | 100% |
| Shroud Tank (`shroudtank`) | 1 | 0 | 0.00 | 100% |
| Kraken (`kraken`) | 1 | 0 | 0.00 | 100% |
| Flak Hauler (`flakhauler`) | 1 | 0 | 0.00 | 100% |
| Colossus Tank (`heavy`) | 1 | 1 | 1.71 | 100% |
| Arc Trooper (`arc`) | 1 | 1 | 6.00 | 100% |
| Toxin Sniper (`toxin`) | 1 | 0 | 0.00 | 100% |

## Verliesoorzaken (plan/fun-pass-verliesclassificatie.md, geijkt: docs/metingen/grenzen.md §3)

| Code | Hoofdoorzaak | Geldige oorzaak |
| --- | ---: | ---: |
| EU | 0/36 | 0/36 |
| ES | 9/36 | 11/36 |
| PB | 0/36 | 0/36 |
| SC | 3/36 | 4/36 |
| BG | 14/36 | 18/36 |
| SW | 0/36 | 0/36 |
| OV | 0/36 | 0/36 |
| VA | 0/36 | 0/36 |
| X | 10/36 | – |

Kosteneffectiviteit per unit zonder micro en terrein: duelmatrix `DUELS=1 npx vitest run duels` (`docs/balans/`).
