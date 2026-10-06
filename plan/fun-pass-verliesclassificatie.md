# Verliesclassificatie: "Waarom verloor ik?" (concept)

Status: **concept** (2026-10-02). Hoort bij `plan/fun-pass-plan.md` (fase 21). Verhuist bij bevriezing naar `docs/playtest/`. Wordt bevroren vóór tester 1 van ronde 1.

**Doel:** vooraf vastleggen wat een *correct* antwoord is op "waarom verloor je?". De oorzaak volgt uit de telemetrie, niet uit het oordeel van de ontwikkelaar achteraf.

**Twee toepassingen, één regelset:**
1. Coderen van vraag 2 in playtest-ronde 1 en 2.
2. De samenvatting op het nabesprekingsscherm (25.2). De regels daar zijn deze categorieën, in gewone taal, met de hoofdoorzaak bovenaan. Eén implementatie voor beide; een wijziging in de ene is een wijziging in de andere.

## Begrippen
- **Kantelpunt (K):** de laatste snapshot waarin de verliezer nog ≥ 0,8× de legerwaarde van de winnaar had. Had hij dat nooit, dan is K het eerste contact.
- **Beslisvenster:** van K − 5 min tot het einde. Oorzaken moeten in dit venster aanslaan, tenzij de categorie anders zegt.
- **~Gelijk:** verhouding tussen 0,8 en 1,25 (zelfde grenzen als 20.2-D van het plan).
- **Moment van aanslaan:** het tijdstip waarop het criterium voor het eerst volledig waar is. Bij een duur-eis (bijv. ≥ 4 min) is dat het **einde** van die duur. Bij een gebeurtenis (gevecht, schot, verlies van een raffinaderij) is het het tijdstip van die gebeurtenis. Bij VA is het de eerste vijandelijke aanval in de basis.
- **Fases van een potje, productie-uptime, counterrol:** definities in 20.0 en 20.2 van het plan.
- **IJking.** De drempels worden één keer geijkt op `nul-normal-medium` (20.6), vóór tester 1, en daarna bevroren. Methode: per categorie wordt alleen het hoofdgetal (bijv. 1,5× bij EU) zo gezet dat de categorie aanslaat in 10–60% van de verloren AI-potjes. Ligt de waarde hieronder al in die band, dan blijft ze staan. Elke aanpassing staat met oude en nieuwe waarde in dit bestand.

## Categorieën

| Code | Oorzaak | Telemetrie-criterium | Correct (voorbeeld) | Onjuist (voorbeeld) |
|---|---|---|---|---|
| **EU** | Economie: niet uitgebreid | Inkomen tegenstander ≥ 1,5× gedurende ≥ 4 min vóór K; verliezer 0 extra velden en 0 extra CY; legerwaarde aan het begin van die 4 min ~gelijk | "Hij had meer geld omdat ik niet uitbreidde." "Mijn veld was leeg." | "Hij had betere tanks." "Hij was sneller." |
| **ES** | Economie: verstoord | Verliezer verliest ≥ 50% van zijn Haulers of een raffinaderij, en zijn inkomen daalt ≥ 40% binnen 2 min | "Ze schoten mijn harvesters kapot." "Mijn raffinaderij ging neer." | "Ik had te weinig geld" (zonder oorzaak: symptoom) |
| **PB** | Geld niet besteed | Productie-uptime (20.2-B) < 50% of ongebruikt geld > 3.000 gedurende ≥ 3 min; inkomen ~gelijk | "Ik bouwde te weinig." "Ik had geld over en deed er niks mee." | "Hij had meer geld." |
| **SC** | Verkeerde samenstelling | ≥ 60% van de verloren waarde door één klasse (bijv. lucht), terwijl de verliezer < 10% legerwaarde had met de counterrol van die klasse (20.2) | "Ik had geen luchtafweer." "Zijn tanks waren te sterk voor mijn infanterie." | "Hij had gewoon meer." |
| **BG** | Beslissend gevecht | Eén gevecht kost de verliezer ≥ 50% van zijn legerwaarde, legerwaarde vooraf ~gelijk, einde binnen 5 min | "Ik verloor alles in dat ene gevecht bij de brug." "Ik viel aan op een slechte plek." | "Hij had betere tanks" (alleen correct als ook SC aanslaat) |
| **SW** | Superwapen | Superwapens ≥ 20% van de verloren waarde, of een CY/fabriek vernietigd door een schot binnen 3 min vóór K | "Zijn nuke haalde mijn fabriek weg." | "Hij was gewoon sterker." |
| **OV** | Overname | Mind control, engineers, Dominion of Mutagen (event `mutated`) ≥ 20% van de verloren waarde | "Hij nam mijn tanks over." | "Mijn tanks gingen dood." |
| **VA** | Vroege druk | Eerste vijandelijke aanval in de basis vóór 6 min; legerwaarde verliezer < 0,5× bij eerste contact; einde vóór 12 min | "Hij viel aan voor ik iets had." | "Ik verloor de lategame." |
| **X** | Geen duidelijke oorzaak | Geen enkele categorie slaat aan | — | — |

**Symptoomantwoorden** zijn op zichzelf nooit correct: "hij had meer eenheden", "hij was sterker", "ik had te weinig geld", "ik verloor". Ze tellen pas als de tester er een oorzaak bij noemt.

## Meerdere oorzaken
- Het script geeft **alle** categorieën die aanslaan. Dat zijn de *geldige* oorzaken.
- De **hoofdoorzaak** is de geldige categorie die het **vroegst** aanslaat. Een oorzaak leidt meestal tot de volgende (geen uitbreiding → kleiner leger → beslissend gevecht verloren).
- Gelijk moment: volgorde EU, ES, PB, VA, SC, OV, SW, BG. Structurele oorzaken gaan voor het moment waarop ze zichtbaar werden.

**Score per antwoord:**

| Score | Betekenis |
|---|---|
| **2** | Het antwoord noemt de hoofdoorzaak |
| **1** | Het antwoord noemt een andere geldige oorzaak, niet de hoofdoorzaak |
| **0** | Alleen symptomen, of alleen oorzaken die niet aanslaan |

"Correct begrepen" in de succescriteria = score 1 of 2. Score 2 rapporteren we apart.

**Categorie X:** het potje telt niet mee in de noemer voor begrip. Zit meer dan 1 op 4 potjes in X, dan zijn de criteria te streng of mist er een categorie. Dat staat dan als **bevinding** in het rapport. De regels wijzigen **niet** in 1.4; een aangepaste regelset geldt pas voor 1.5. Zo blijven ronde 1 en ronde 2 vergelijkbaar.

**Gewonnen potjes:** dezelfde regels, gedraaid op de AI als verliezer. Het correcte antwoord is de spiegel ("ik breidde uit en hij niet" bij EU). Winst en verlies worden apart gerapporteerd; de succescriteria gaan over verlies.

## Codeerprocedure (blind)
1. **Script:** bepaalt per potje de geldige oorzaken en de hoofdoorzaak. Dit gebeurt automatisch en wordt niet met de hand aangepast.
2. **Codeerblad:** per potje alleen het letterlijke antwoord op vraag 2, met een willekeurig nummer. Geen naam, factie, ronde, uitslag van het script of telemetrie.
3. **Twee beoordelaars**, die het spel kennen maar niet de begeleider zijn, en van wie hooguit één ontwikkelaar. Elk koppelt elk antwoord los van de ander aan nul of meer codes (EU…VA), of "symptoom", of "onduidelijk".
4. **Vergelijken:** de score (0/1/2) volgt mechanisch uit de codes van de beoordelaar en de uitkomst van het script. Niemand kiest de score met de hand.
5. **Onenigheid:** waar de beoordelaars tot een andere score komen, codeert een **derde beoordelaar** blind dat ene antwoord. De meerderheid telt. Er wordt niet onderhandeld.
6. **Overeenstemming:** het rapport noemt in hoeveel antwoorden de eerste twee het eens waren (x van n). Lager dan 8 op 10: de codeerregels zijn te vaag. Dan worden de voorbeelden aangevuld en codeert iedereen alles opnieuw, nog steeds blind.

## Klaar als
- [ ] Drempels geijkt op `nul-normal-medium`; verdeling over categorieën gerapporteerd (geen categorie > 60% of 0%).
- [ ] Unit-test per categorie: een opgebouwde telemetrie waarin hij aanslaat en één waarin hij níet aanslaat (deelt de tests met 25.2).
- [ ] Bestand bevroren met datum, vóór tester 1.
