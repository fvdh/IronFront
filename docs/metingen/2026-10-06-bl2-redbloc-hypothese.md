# BL2, iteratie 2 (Red Bloc): hypothese vóór de AI-run (2026-10-06)

Werkregel: één interventie, vastgelegd vóór de run. Arm A = `ref-26a` + iteratie 1 (Psi), dus `bl2-psi`. Branch `bl2-redbloc`.

## Probleem
Scenario 7: Red Bloc houdt een Thunderhead alleen met 2 Flak Batteries tegen. Met 7 Flak Gunners, 3 Flak Haulers, 4 Scout Jeeps of 3 Sentry Guns valt de CY. Oorzaak: dezelfde als bij Psi. Flak Gunner (0,15) en Flak Hauler (0,2) doen bijna niets tegen zwaar pantser in de lucht. De Flak Battery doet al 1,0.

## Interventie (één factie: Red Bloc)
Alleen de twee mobiele luchtafweereenheden, met `versusAir` (alleen tegen vliegende doelen):
- Flak Gunner (`flakRifle`): 0,15 → **0,6**;
- Flak Hauler (`flakGun`): 0,2 → **1,0**, gelijk aan de Flak Battery.

Scout Jeep en Sentry Gun blijven ongewijzigd: dat zijn geen luchtafweer-eenheden.

**Let op, afgesteld:** de waarden zijn gekozen met scenario 7. Proefwaarden: 0,4 en 0,5 houden niets tegen; bij 0,6 houdt de Flak Gunner het, en de Flak Hauler pas bij 1,0. De primaire metriek is daardoor per definitie gehaald. **De echte toets is de AI-meting hieronder.**

## Hypothese en metrieken
- **Hypothese:** met $2.000 aan mobiele Red Bloc-luchtafweer blijft de CY staan tegen één Thunderhead, en verder verandert er niets aan het spel buiten luchtgevechten.
- **Primaire metriek:** scenario 7, Red Bloc-rijen Flak Gunner en Flak Hauler: winnaar B (was A).
- **Bewaakt (mag niet verschuiven):**
  - scenario 4a–c en alle andere scenario's;
  - de duelmatrix voor Flak Gunner en Flak Hauler tegen grond (Inf, Voert);
  - de winrate van Red Bloc op land en zee (binnen het 95%-interval);
  - de patstellingen op Normal-medium (2/27, beide Red Bloc-spiegelpotjes met een Thunderhead): mogen niet stijgen.
- **Terugdraaien als:** een bewaakte metriek buiten het interval verschuift.

## Uitkomst (na de run, `tools/nulmeting.sh bl2-redbloc`, tegen `bl2-psi`)
- **Primaire metriek:** gehaald (afgesteld). Scenario 7: Flak Gunner en Flak Hauler houden stand; de Thunderhead sneuvelt na ±37 s. De andere scenario's zijn gelijk.
- **Duelmatrix:**
  - Flak Gunner en Flak Hauler tegen grond ongewijzigd (Inf 1,44/1,85, Voert 0,63/0,54).
  - Tegen lucht: Flak Gunner 1,52 → 1,91, Flak Hauler 1,54 → 1,99.
  - Thunderhead gemiddeld 4,32 → 3,98.
- **AI-meting:** land, zee en Normal-medium zijn praktisch identiek aan `bl2-psi`: geen enkele duur, winrate of comeback verschuift. De AI bouwt de Thunderhead zelden tegen een Red Bloc-leger met flak.
- **Patstellingen:** onveranderd 2/27. Die worden **niet** door luchtafweer opgelost. In beide potjes heeft de overgebleven speler geen basis en geen luchtafweer meer; hij heeft geld maar kan niets bouwen. Dat vraagt een andere interventie (regel voor nederlaag of AI-gedrag), geen BL2.
- **Besluit: houden.**

## BL2 voor Allies: geen iteratie nodig
In scenario 7 houden Allies de Thunderhead al tegen met Rocket Troopers en met Skyguard SAM (2 van 4 opties). De hypothese van BL2 ("een gerichte AA-investering wint") geldt voor Allies dus al. De Lancer IFV en de Pillbox zijn geen gerichte luchtafweer. **BL2 is daarmee afgerond.**
