# BL1 (zeebalans Red Bloc) en PB op zee: onderzoek (2026-10-06)

Data: `bl2-redbloc` (stand na BL2), zee 36 potjes en land 81 potjes, ruwe telemetrie.

## 1. BL1 start niet: de hypothese past niet bij de data
- De startvoorwaarde is formeel gehaald: Flak Boat 0,43 en Leviathan 0,74 in de zeematrix, en Red Bloc wint 25% op zee.
- Maar de AI bouwt op zeekaarten vrijwel **geen schepen**: in 24 niet-spiegelpotjes in totaal 1 Barracuda en 2 Psi-onderzeeërs.
- Red Bloc verliest zijn waarde aan Warden Tanks, Lash Tanks, Rocket Troopers en Maulers: het zijn landgevechten.
- Scheepscijfers aanpassen verandert die 25% dus niet. Bovendien is n = 16, met een interval van 10–49%.
- **Besluit (voorstel): BL1 vervalt** zolang de AI geen vloot bouwt. De zeematrix blijft input voor wanneer schepen wel een rol krijgen (bijv. via fase 23/26).

## 2. Op zeekaarten heeft iedereen geldgebrek
Aandeel van de tijd per wachtrij (alle facties gelijk):

| | Voertuigen: draait | Voertuigen: wacht op geld |
|---|---|---|
| Land | 31–39% | 44–51% |
| Zee | 12–13% | 70–73% |

Op Coast en Islands verdienen alle AI's veel minder. Dat is een economie-signaal (fase 23), geen factieprobleem.

## 3. PB ("geld niet besteed") meet het tegendeel op zee
- PB telt de productie-uptime: het aandeel seconden waarin een wachtrij **draait** (`L`). Elke andere status telt als stilstand, ook `G` ("wacht op geld") en `A` ("te arm voor iets").
- Een speler zonder geld krijgt dus een lage uptime, en PB slaat aan, terwijl de categorie juist "had geld en deed er niets mee" bedoelt. Op zee, waar iedereen blut is, geeft dat 36 van de 36.
- Dit is de overgevoeligheid die `grenzen.md` §3 vroeg te onderzoeken. Het is een **fout in de definitie**, geen drempel.
- **Voorstel (besluit opdrachtgever, want de classificatie is bevroren):** bij PB telt alleen stilstand mét geld (`K`, keuze-idle), en seconden met `G` of `A` tellen niet mee. Het getal 30% blijft. Daarna opnieuw berekenen uit de ruwe telemetrie.
