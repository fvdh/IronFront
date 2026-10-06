# Concept: herziene fase 21 + succescriteria fase 27

Status: **concept** (2026-10-02). Vervangt fase 21 en de tabel "Succescriteria voor 1.3" in 27.2 van `plan/fun-pass-plan.md`.
Hoort bij: `plan/drafts/fun-audit.md` en `plan/drafts/verliesclassificatie.md`.

---

## Fase 21: Playtest-ronde 1 (mensen)

**Doel:** antwoord op de vraag die geen test kan beantwoorden: *is het leuk, en waar niet?*
Daarvoor leggen we eerst vast wat "leuk" betekent. Dat gebeurt **vóór** de eerste tester speelt.

### 21.0 Wat we met "leuk" bedoelen
"Leuk" is geen enkele score. We splitsen het in vijf dimensies. Elke dimensie heeft één vaste meting.

| Dimensie | Vraag of meting | Schaal | Wanneer |
|---|---|---|---|
| **Retentie** (intentie) | "Wil je nog een potje spelen?" | 1–5 | Na elk potje |
| **Retentie** (gedrag) | Na potje 3: "Je mag nog een vierde potje spelen, of stoppen." | speelt / stopt | Eén keer |
| **Agency** | "Had je het gevoel dat je keuzes ertoe deden?" | 1–5 | Na elk potje |
| **Begrip** | "Kun je uitleggen waarom je won of verloor?" + open antwoord | ja/nee + tekst, gecodeerd volgens `verliesclassificatie.md` | Na elk potje |
| **Comeback-gevoel** | "Was er een moment waarop je dacht: dit kan ik nog omdraaien?" (bij winst: "…dit kan nog misgaan?") | ja/nee + minuut | Na elk potje |
| **Keuzes per fase** | Fun-audit: zes fases, elk 0–2 | 0/1/2 | Na elk potje |

- **Begrip meten we objectief.** Het open antwoord wordt blind gecodeerd tegen een oorzaak die uit de telemetrie volgt. Het ja/nee is het zelfbeeld. Het verschil tussen die twee is zelf een bevinding.
- **Retentie meten we twee keer.** De 1–5-score is wat testers zeggen. Het vierde potje is wat ze doen.
- Deze tabel en de drempels in de twee bijlagen worden bevroren vóór tester 1. Daarna veranderen ze niet meer voor ronde 1 of ronde 2.

### Opzet
- **10 testers:** ~5 genrekenners (RA2/C&C-ervaring) en ~5 RTS-spelers zonder die achtergrond. Geen ontwikkelaars.
- **Elk 3 potjes:** één met elke factie, in wisselende volgorde (vast schema in `protocol.md`). Tegen één AI op **Normal**, medium-kaart, standaardinstellingen. De eerste keer mag de tutorial gespeeld worden.
- **Geen uitleg vooraf** behalve de besturing. De begeleider zegt niets tijdens het spelen.
- **Begeleider noteert** op het observatieformulier: tijdstempels van verwarring ("waar is…?", "waarom…?"), stilte of verveling, vergeten mechanieken en de eerste keer dat een tester uitbreidt. Hij geeft ook zelf een fun-audit-score per fase (zie `fun-audit.md`), zonder de score van de tester te zien.
- **Data:** telemetrie-export van elk potje, plus scherm-opname als de tester dat goed vindt.

### Vragen na elk potje (~6 min)
De volgorde is vast. Begrip komt eerst, vóór de tester iets van de telemetrie ziet. Anders leest hij het antwoord van de grafiek af.

1. Wat was je doel?
2. Kun je uitleggen waarom je won of verloor? (ja/nee) Zo ja: waarom? *(woordelijk noteren)*
3. Had je het gevoel dat je keuzes ertoe deden? (1–5)
4. Was er een moment waarop je dacht: dit kan ik nog omdraaien? (ja/nee, en wanneer)
5. Wil je nog een potje spelen? (1–5)
6. **Fun-audit** met de tijdlijn ernaast: zes fases, elk 0/1/2. Bij elke 0: "Wat gebeurde er toen?" *(dit vervangt de oude vraag "Op welk moment werd het saai?")*
7. Welke mechaniek vergat je of begreep je niet?

### Na alle drie de potjes
- Aanbod vierde potje (gedragsmeting; de begeleider noteert alleen ja/nee, en of het potje wordt uitgespeeld).
- "Welke eenheid vond je het leukst, per factie?" *(was vraag 3 per potje; één keer aan het eind is genoeg)*
- "Welke factie zou je opnieuw kiezen, en waarom?"
- "Wat zou je eruit halen?"
- "Maakte het menu je nieuwsgierig?" (beslissing 7)

### Benodigd uit fase 20
- Telemetrie-export (20.4) met de snapshots, gevechten, superwapenschoten, overnames, keuzedichtheid, tijd tot eerste betekenisvolle keuze en legerconcentratie.
- **Tijdlijnweergave** van een export: inkomen en legerwaarde van beide spelers over tijd, met markers voor eerste contact, tweede CY, superwapenschoten, grootste gevecht en de zes fasegrenzen. Een statische pagina of print is genoeg. Toevoegen aan "Klaar als" van fase 20.
- **Classificatiescript:** leest een export en geeft de geldige verliesoorzaken plus de hoofdoorzaak (`verliesclassificatie.md`). Dezelfde regels voeden later de samenvatting van de nabespreking (25.2).

### Materiaal (in `docs/playtest/`)
| Bestand | Inhoud |
|---|---|
| `protocol.md` | Script voor de begeleider, instellingen, factievolgorde per tester, volgorde van de vragen |
| `observatie.md` | Formulier met tijdstempelkolommen en de fun-audit-score van de begeleider |
| `vragenlijst.md` | De vragen hierboven, per potje en na afloop |
| `fun-audit.md` | Fases, ankers voor 0/1/2, afname en rapportage |
| `verliesclassificatie.md` | Oorzaakcategorieën, criteria en codeerprocedure |
| `codeerblad.md` | Geanonimiseerde antwoorden op vraag 2, voor de twee beoordelaars |
| `rapport-ronde-1.md` | De uitkomst |

### Analyse
1. **Per tester één rij.** Alle scores, per potje, met genrekenner ja/nee en factie. Deze tabel staat volledig in het rapport. Hij is de basis; alles daarna is samenvatting.
2. **Per dimensie:** mediaan, spreiding (laagste–hoogste) en de verdeling van de scores. Bij 1–5: hoeveel testers op elk getal. Geen gemiddelden met twee decimalen.
3. **Begrip:** per potje de hoofdoorzaak (script), de code van beide beoordelaars en de uitkomst (0/1/2). Verloren en gewonnen potjes apart.
4. **Fun-audit:** balk per fase met verdeling, naast de bijbehorende telemetrie (zie `fun-audit.md`). Waar tester en begeleider ≥ 2 punten verschillen, staat dat apart.
5. **Telemetrie van mensen naast die van de AI:** speelduur, superwapen-impact, uitbreiding, ongebruikt geld, keuzedichtheid.
6. **Vergeten of onbegrepen mechanieken**, met hoe vaak (x van n testers). Belangrijkste input voor de schrapronde.
7. **Momenten met score 0**, met tijdstempel en context uit observatie en telemetrie.

### Rapporteren met 8–10 testers
Tien testers zijn genoeg om problemen te vinden. Ze zijn niet genoeg om kleine verschillen te meten. Daarom:

- Altijd **"x van n"**, nooit een los percentage. "7 van 10 testers", niet "70%".
- Altijd de **spreiding** naast de mediaan. Een mediaan van 3 met alle scores tussen 1 en 5 is iets anders dan een mediaan van 3 met alleen drieën.
- **Individuele antwoorden** staan in een bijlage, letterlijk. Citaten in de tekst zijn illustratie, geen bewijs.
- Een conclusie telt pas als **twee bronnen** het eens zijn: antwoorden, observatie of telemetrie (zie §5, risico 2).

| Deze conclusies mogen wel | Deze conclusies mogen niet |
|---|---|
| "6 van 10 vergaten de Repair Depot" → kandidaat voor uitleg of schrappen | "Agency steeg van 3,4 naar 3,7, dus het is beter" |
| "In de midgame gaven 5 van 10 een 0, en de telemetrie toont geen tweede CY" → probleemfase | "Psi is minder leuk dan Red Bloc" op basis van één punt verschil |
| "Niemand noemde superwapens als verliesoorzaak, en het script ook niet" | Uitspraken over genrekenners vs. niet-kenners (5 vs. 5), tenzij het verschil groot is én in elke tester terugkomt |
| Een patroon dat bij ≥ 3 testers terugkomt, als hypothese voor fase 22–26 | Een patroon bij 1 tester als besluit |

### Klaar als
- [ ] 21.0, `fun-audit.md` en `verliesclassificatie.md` zijn bevroren (datum in het bestand) vóór tester 1.
- [ ] De classificatieregels zijn één keer gedraaid op de AI-nulmeting; de verdeling over categorieën staat in het rapport.
- [ ] Minstens 8 testers × 3 potjes afgerond, met export van elk potje.
- [ ] Vraag 2 is door twee beoordelaars blind gecodeerd; de overeenstemming staat in het rapport.
- [ ] `rapport-ronde-1.md` bevat: de tabel per tester, per dimensie mediaan + spreiding + verdeling, de fun-audit-balken, begrip volgens de classificatie, de top 5 problemen (x van n) en de lijst van vergeten mechanieken.
- [ ] De streefwaarden voor fase 27 (hieronder) zijn ingevuld met de waarden uit ronde 1 en bevroren vóór fase 23 begint.

**Risico:** testers werven kost tijd. Terugvaloptie: 5 testers, en het plan gaat door met de kanttekening dat de conclusies minder zeker zijn. Met 5 testers rapporteren we alleen individuele antwoorden en patronen, geen medianen per subgroep. De AI-metingen uit 20.2 wegen dan zwaarder.

---

## Fase 27.2: Succescriteria voor 1.3 (vervangt de huidige tabel)

**Eerlijk vooraf:** de streefwaarden hieronder zijn **voorlopig**. Zonder ronde 1 weten we niet waar we staan. Waar het kan, zijn ze relatief ten opzichte van ronde 1 (R1). Na ronde 1 vullen we de kolom "R1" in en zetten we de doelen vast. Daarna passen we ze niet meer aan, ook niet als ronde 2 tegenvalt.

**Vergelijkingsgroep.** Ronde 2 heeft minstens de helft nieuwe testers. De criteria hieronder gelden voor de **nieuwe testers**, want alleen die zijn vergelijkbaar met R1. Herhalers rapporteren we apart, per persoon (R1 → R2). Zij kennen het spel al, dus hun begrip en agency stijgen sowieso.

**Volgorde in ronde 2.** De nabespreking (25.2) toont straks zelf een verliesoorzaak. Vraag 2 wordt daarom gesteld **vóór** de tester het scorescherm ziet. Anders meten we of hij kan lezen, niet of hij het begreep.

| Dimensie | Meting | R1 | Doel ronde 2 (voorlopig) |
|---|---|---|---|
| Retentie (intentie) | "Nog een potje?" na potje 3, 1–5 | *invullen* | Mediaan ≥ R1 + 1, én ≥ 2 testers per 10 meer met een 4 of 5 |
| Retentie (gedrag) | Testers die het vierde potje spelen | *invullen* | Meer dan in R1 (x van n) |
| Agency | "Keuzes deden ertoe", 1–5, alle potjes | *invullen* | Mediaan ≥ 4, of ≥ R1 + 1 |
| Begrip | Verloren potjes met code 1 of 2 (`verliesclassificatie.md`) | *invullen* | ≥ 7 van 10, én ≥ R1 + 2 per 10 |
| Begrip (hoofdoorzaak) | Verloren potjes met code 2 | *invullen* | Stijgt |
| Begrip (zelfbeeld) | "Ja" op vraag 2 vs. correct gecodeerd | *invullen* | Geen doel; de kloof rapporteren |
| Fun-audit | Per fase: mediaan en aantal nullen | *invullen* | Geen fase met mediaan 0. Beide midgame-fases: gemiddelde ≥ R1 + 0,5 en ≤ 2 testers per 10 met een 0. Geen fase daalt meer dan 0,3 |
| Comeback-gevoel | Potjes met "ja" op vraag 4 | *invullen* | Stijgt, en in ≥ 1 op 3 potjes |
| Comeback (AI) | % potjes gewonnen na ≥ 40% achterstand (20.2) | nulmeting | ≥ 15% |
| Vergeten/onbegrepen mechanieken | Per tester | *invullen* | Halveert |
| Superwapen-metrieken | 24.1 | nulmeting | Alle vier onder de grens |
| Factiebalans (AI) | 20.2 | nulmeting | 40–60% per factie, land en zee |
| Tests | tsc, vitest, soak, e2e | — | Groen in 3 browsers |

**Hoe we "gehaald" lezen:**
- Een doel is gehaald als het getal het haalt **én** de verdeling geen nieuwe groep ontevreden testers laat zien (bijvoorbeeld meer enen en tweeën, ook als de mediaan stijgt).
- Valt een doel net onder of net boven de grens (binnen 1 tester), dan noemen we het **onbeslist**. We zeggen dan niet dat 1.3 het wel of niet verbeterd heeft.
- De drie zwaarste criteria zijn **begrip**, **fun-audit midgame** en **retentie (gedrag)**. Die toetsen precies waar 1.3 over gaat: uitbreiden in de midgame en snappen waarom je verloor.
