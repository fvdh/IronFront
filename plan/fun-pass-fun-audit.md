# Fun-audit (concept voor `docs/playtest/fun-audit.md`)

Status: **concept** (2026-10-02). Hoort bij `plan/fun-pass-plan.md` (fase 21). Verhuist bij bevriezing naar `docs/playtest/`. Wordt bevroren vóór tester 1 van ronde 1.

**Doel:** per fase van een potje vaststellen of de speler iets te beslissen had. Niet "was het leuk?", maar "had ik een keuze, en maakte die uit?".

## De zes fases

De vensters zijn die uit 20.0 van het plan (de enige definitie). Hieronder alleen ter herinnering.

| # | Fase | Afbakening (uit telemetrie) | Vraag aan de tester | Telemetrie ernaast |
|---|---|---|---|---|
| 1 | **Opening** | 0–5 min | Had ik iets interessants te beslissen? | Tijd tot eerste betekenisvolle keuze; keuzedichtheid 0–5 min; productie-uptime |
| 2 | **Eerste contact** | C − 1 min tot C + 2 min (C = eerste contact) | Kon ik reageren of counteren? | Tijd tot eerste contact; time-to-kill en verliesverhouding van het eerste gevecht |
| 3 | **Midgame: uitbreiden** | 5 min – 15 min (eerder als het einde begint) | Had ik een reden om uit te breiden? | Tijd tot tweede CY / tweede veld; aantal velden op 10 en 15 min; inkomen per veld |
| 4 | **Midgame: territorium** | Zelfde venster als 3 | Ontstond er spanning om plekken op de kaart? | Gevechten bij uitbreidingsvelden en tech-gebouwen; overnames van tech-gebouwen; keuzedichtheid 5–15 min |
| 5 | **Lategame** | 15 min → laatste 3 min | Veranderde mijn plan nog? | Keuzedichtheid na 15 min; verschuiving in eenheden per klasse; legerconcentratie; superwapenschoten |
| 6 | **Einde** | Laatste 3 min + direct erna | Begreep ik waarom ik won of verloor? | Code uit `verliesclassificatie.md` (0/1/2) |

- Duurt een potje korter dan 18 min, dan is fase 5 **n.v.t.**, geen 0. Hetzelfde voor fase 2 als er geen contact was.
- Fase 6 heeft twee scores: het gevoel van de tester (0–2) en de objectieve code. Die staan naast elkaar, ze worden niet gemiddeld.

## Scoren

| Score | Betekenis | Herkenbaar aan |
|---|---|---|
| **0** | Geen keuze, of saai | "Ik deed gewoon wat ik altijd doe." "Ik zat te wachten." |
| **1** | Beperkte keuze | Er was één voor de hand liggende optie, of de keuze maakte weinig uit. |
| **2** | Betekenisvolle keuze | "Ik moest kiezen tussen X en Y, en dat maakte uit." |

## Afname
1. **Na elk potje**, als vraag 6 van de vragenlijst. Vraag 1–5 (begrip, agency, comeback, nog een potje) komen eerst, zodat de tijdlijn de antwoorden niet stuurt.
2. **Eerste score zonder tijdlijn.** De begeleider noemt per fase het venster in woorden ("de midgame, van minuut 5 tot 15: wat deed je toen?"). De tester geeft een score en één zin waarom.
3. **Daarna met tijdlijn.** De begeleider opent de tijdlijn van de export (inkomen en legerwaarde van beide spelers, fasegrenzen, markers voor eerste contact, tweede CY, grootste gevecht en superwapenschoten). De tester mag per fase één score corrigeren. Beide scores worden genoteerd; **de eerste telt**. Het verschil is zelf een bevinding.
4. Bij een 0 vraagt hij: "Wat gebeurde er toen?" Antwoord woordelijk noteren.
5. De begeleider stuurt niet. Hij legt de vraag uit, niet het spel.

**Begeleider-observatie.** Tijdens het potje geeft de begeleider op het observatieformulier zelf een 0/1/2 per fase. Signalen: stilte, wachten tot geld binnen is, stilstaande productie, hardop twijfelen, zichtbaar kiezen. Hij doet dit **vóór** hij de score van de tester hoort.

**Samenbrengen.** De score van de tester is leidend; het gaat om zijn ervaring. De begeleiderscore is een controle:
- Verschil 0–1: niets doen.
- Verschil 2 (tester 2, begeleider 0 of omgekeerd): apart in het rapport, met de notities van beiden. Voorbeeld: "voelde spanning, maar deed 4 minuten niets" is een bevinding, geen meetfout.
- De scores worden nooit gemiddeld.

## Rapportage
Per fase één balk met de **verdeling** (aantal 0, 1 en 2), de mediaan en n. Geen gemiddelden: die verbergen wat er per tester gebeurt.

```
                 0          1          2         mediaan  n
OPENING          █          ██         ███████   2        10
EERSTE CONTACT   █          ████       █████     2        10
MIDGAME UITBR.   ███        ███        ████      1        10
MIDGAME TERR.    █████      ████       █         0,5      10
LATEGAME         ██         ███        ██        1        7
EINDE            ██         ████       ████      1        10
```
*(voorbeeldgetallen)*

- De balken tonen de testerscores over alle potjes (n = aantal potjes waarin de fase voorkwam). Daarnaast dezelfde balken per factie, alleen als bijlage.
- Onder elke balk: de mediaan van de bijbehorende telemetrie, en de begeleiderbalk in grijs.
- **Probleemfase:** mediaan ≤ 1 **én** ≥ 3 testers met een 0 **én** de telemetrie wijst dezelfde kant op (bijv. geen tweede CY, lage keuzedichtheid).
- Verschillen kleiner dan 2 testers per 10 (in het aantal nullen of tweeën) tussen fases of rondes interpreteren we niet.
- In de bijlage: alle scores per tester per potje, met de zin "waarom" erbij.
