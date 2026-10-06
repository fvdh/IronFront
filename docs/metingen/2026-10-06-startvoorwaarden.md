# Startvoorwaarden fase 23–26 en BL: stand na de AI-meting (2026-10-06)

Toetsing van de startvoorwaarden uit `plan/fun-pass-plan.md` op de AI-data. Bron: `ref-26a` (arm A, AI-versie 2), duelmatrix `ref-26a-duels(-zee)` en scenario's `ref-26a-scenarios`. Signalen uit fase 21 (playtest-ronde 1) en fase 22 (ontwerpkern) ontbreken nog. **Dit is geen besluit** (beslissing 15 valt na fase 22); het laat zien wat er al ligt en wat nog nodig is.

## Fase 23: Economie en uitbreiding (start bij ≥ 2 signalen)

| Signaal (fase 20) | ref-26a | Telt |
|---|---|---|
| Velden zakken zelden < 25%; inkomen na 15 min ≥ 80% van de piek | Elk startveld zakt eronder (100%); inkomen zakt na minuut 4 | nee |
| Winrate met vs. zonder tweede CY < 10 pp | Geen AI bouwt een tweede CY | onbeslist |
| Harassment kost < 1 min inkomen | Netto mediaan 0,17 min (land), 0,04 (zee), 0,33 (Normal-medium); 19–23% van de raids kost ≥ 1 min | **ja** |

**Stand:** 1 signaal. Fase 21 (uitbreiden testers, saaimomenten, ongebruikt geld) of fase 22 (territorium als hoofdas) moet het tweede leveren.

## Fase 24: Superwapens en lategame

| Signaal (fase 20) | ref-26a | Telt |
|---|---|---|
| Kernsignaal > 25% (bak `gelijk`, n ≥ 15) | n = 1 | onbeslist |
| Superwapens > 15% van de vernietigde waarde, of factiebalans met/zonder > 10 pp | Aandeel ≈ 0%; verschil ≤ 1 potje | nee |
| ≥ 40% beslissend gevecht na 15 min, of concentratie na 15 min ≥ 70% | Beslissend na 15 min ≈ 0%; concentratie 0,86 maar n = 2 | nee / onbeslist |

**Stand:** geen signaal uit AI-data; AI-potjes zijn te kort. Alleen fase 21 (testers noemen superwapen of saaie lategame) of fase 22 (superwapen op de schraplijst) kan haar starten.

## Fase 25: De speler begrijpt het spel
Hangt volledig af van fase 21 (vergeten mechanieken, begrip van verlies) en fase 22 (welke regels overblijven). **Stand:** wacht op ronde 1. Bouwen mag parallel in een branch.

## Fase 26.B: AI met intenties

| Signaal | ref-26a | Telt |
|---|---|---|
| AI-potjes lopen steeds hetzelfde (lage spreiding in tijd tot eerste aanval, doelwitten, samenstelling) | Eerste contact land 5,0–5,3 min (Q1–Q3), zee 2,8–4,8; dominante eenheid 69% van het leger | **aanwijzing** (het plan geeft geen getal voor "lage spreiding") |
| Testers: AI voorspelbaar of passief (fase 21) | – | wacht |
| Economie vraagt AI-uitbreiding (fase 23) | – | wacht |

## Menu BL (start als twee lagen het probleem tonen)

| # | Lagen | Stand |
|---|---|---|
| BL1 Zeebalans Red Bloc | Zeematrix: Flak Boat 0,43 en Leviathan 0,74 onder 0,8 (Kraken 3,46 en Barracuda 3,08 juist ver erboven); AI: Red Bloc wint 25% op zee | **startbaar** (twee lagen) |
| BL2 Luchtafweer | Duelmatrix: lucht 3–4,5; scenario 7: een Thunderhead sloopt een CY tegen 8 van de 11 AA-opties van ±$2.000; AI: verliesoorzaak SC zelden (2/81 land), maar alle drie de patstellingen zijn een onneembare Thunderhead | Twee lagen zeker (duel + scenario); de derde voorwaarde "testers of AI verliezen op lucht" is alleen indirect (patstellingen, en jouw eigen potje tegen de Discs) |
| BL3 Specialisten | AI bouwt ze zelden (Nova 1×, Phase Trooper 7×, Mentalist, Toxin Sniper laag) | wacht op fase 21 (≥ 3 testers) |
| BL4 Uitschieters | Duelmatrix: Lash Tank 1,57, Anvil 1,40; AI: dominante eenheid 69% (meestal de hoofdtank) | **startbaar** (twee lagen) |
| BL5 Delirium Drone | Duelmatrix 0,79 (< 0,8) | wacht op fase 22 (blijft hij?) |

## Volgorde (voorstel voor beslissing 15, na fase 22)
Startbaar zonder mensdata: **BL1**, **BL4**, en **BL2** als je de patstellingen als AI-laag accepteert. De patstellingen liggen boven de doelgrens van 2% (Normal-medium 7%), en BL2 grijpt daar het meest direct op in. Eén interventie per iteratie, gemeten tegen `ref-26a`.
