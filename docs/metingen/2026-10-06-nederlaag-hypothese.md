# Nederlaagregel: hypothese vóór de run (2026-10-06)

Interventie in de meetrij, besluit opdrachtgever. Arm A = `bl2-redbloc` (stand na BL2, PB gecorrigeerd). Branch `nederlaag`.

## Probleem
Patstellingen op Normal-medium: 2 van 27 (7%), terwijl de doelgrens ≤ 2% is. In alle drie de patstellingen uit de metingen (één in `nul`) houdt een Thunderhead een speler zonder basis in leven. De tegenstander kan hem niet raken, en de speler zelf kan niets meer bouwen.

## Interventie
`isDefeated` (`core/sim.ts`): een speler ligt eruit als hij **geen gebouwen** meer heeft (muren en veroverde tech-gebouwen tellen niet) en **geen Base Crawler**. Eenheden alleen houden je niet meer in het spel; eerst deden gewapende eenheden dat wel.

## Hypothese en metrieken
- **Hypothese:** patstellingen verdwijnen, en verder veranderen alleen de laatste minuten van potjes die al beslist waren.
- **Primaire metriek:** patstellingen op Normal-medium (nu 2/27; doel 0).
- **Bewaakt:**
  - winnaars per potje (verschuivingen alleen in potjes met een patstelling of een lang einde);
  - de mediane duur (mag dalen, niet stijgen);
  - de factiebalans binnen het 95%-interval;
  - comeback: kan dalen, want wie alleen nog eenheden had, kon niet meer terugkomen.
- **Gevolg voor mensen:** wie zijn laatste gebouw verliest, heeft verloren, ook met een leger in het veld. Dat moet in de uitleg (fase 25) en de changelog.

## Uitkomst (na de run, `tools/nulmeting.sh nederlaag`, tegen `bl2-redbloc`)
- **Primaire metriek: gehaald.** Patstellingen op Normal-medium 2/27 → **0/27**; land en zee 0.
- **Winnaars:** in geen enkel potje verandert de winnaar, behalve in de twee voormalige patstellingen (nu 8,6 en 26,6 min).
- **Duur:** alleen het einde van al beslist potjes wordt korter (land 3, zee 1, Normal-medium 16 potjes, meestal enkele tientallen seconden). Mediaan Normal-medium 9,8 → 9,4 min.
- **Factiebalans en comeback:** ongewijzigd. Scenario's en duelmatrix zijn gelijk (geen gebouwen in het spel).
- **Besluit: houden.** De doelgrens voor patstellingen (≤ 2%) wordt nu gehaald.
