# BL2, iteratie 1 (Psi): hypothese vóór de run (2026-10-06)

Werkregel van de gezamenlijke meetrij: één interventie, één primaire metriek, vastgelegd vóór de run. Arm A = `ref-26a` (AI-versie 2). Branch `bl2-psi`.

**Aanpak zonder testers** (besluit opdrachtgever 2026-10-06): verbeteringen starten op AI-data; potjes van de opdrachtgever tellen als aanwijzing, niet als bewijs. Playtest-ronde 1 volgt later als validatie.

## Probleem
- Scenario 7: een Thunderhead Airship ($2.000) sloopt een CY tegen 8 van de 11 luchtafweeropties van ±$2.000. Psi houdt hem met geen van beide opties tegen (3 Spinner Tanks, 2 Gatling Cannons).
- Oorzaak in de cijfers: de Thunderhead heeft zwaar pantser, en mobiele luchtafweer doet bijna niets tegen zwaar pantser (Gatling 0,3, Gatling Cannon 0,4, Flak 0,15–0,2). De Kestrels uit scenario 4 (licht pantser) verliezen wél van elke AA-optie.
- AI-laag: alle drie de patstellingen in de meetset zijn een onneembare Thunderhead.

## Interventie (één factie: Psi)
Nieuw wapenveld `versusAir`: een eigen vermenigvuldiger per pantsersoort, die alleen geldt tegen vliegende doelen. Het grondgevecht verandert dus niet. Voor Psi alleen:
- Spinner Tank (`gatling`): tegen zwaar luchtpantser 0,3 → **0,8**.
- Gatling Cannon (`gatlingTower`): 0,4 → **0,8**.

Dit wijkt licht af van de letterlijke tekst van BL2 ("kosten of bereik van de goedkoopste AA-optie"). Kosten of bereik veranderen helpt hier niet, want het probleem is de schade tegen zwaar pantser in de lucht. De bedoeling van BL2 blijft: een gerichte AA-investering moet winnen.

## Hypothese en metrieken
- **Hypothese:** met $2.000 aan Psi-luchtafweer blijft de CY staan tegen één Thunderhead, terwijl lucht een rol houdt.
- **Primaire metriek:** scenario 7, Psi-rijen: winnaar (nu A in 2 van 2; doel B in 2 van 2).
- **Bewaakt (mag niet verschuiven):**
  - scenario 4a–c (Kestrel tegen AA: blijft B);
  - de duelmatrix voor Spinner Tank tegen grond (Inf, Voert);
  - de winrate van Psi in `ref-26a`-land en -zee (geen sprong buiten het 95%-interval).
- **Terugdraaien als:** de primaire metriek niet verbetert, of het grondgevecht van de Spinner Tank verandert.

## Uitkomst (na de run, `tools/nulmeting.sh bl2-psi`)
- **Primaire metriek: gehaald.** Scenario 7, Psi: B in 2 van 2 (was A in 2 van 2). De Thunderhead gaat na ±36 s neer, net vóór de CY zou vallen; lucht blijft dus gevaarlijk. Alle andere scenario's zijn identiek, ook 4a–c.
- **Bewaakt:**
  - Duelmatrix Spinner Tank: Inf 1,64 en Voert 0,55 ongewijzigd; Lucht 1,40 → 1,65. Thunderhead gemiddeld 4,45 → 4,32. De rest is gelijk.
  - Winrate Psi niet-spiegel: land 39% → 42%, zee 69% → 69%, Normal-medium 58% → 58%. Alles binnen het 95%-interval; duur, comeback en patstellingen zonder verschil (`…-bl2-psi-*-vs-ref-26a-*.md`).
  - Patstellingen Normal-medium blijven 2/27: allebei Red Bloc-spiegelpotjes, waar Psi niet meespeelt. Die lossen pas op met de iteratie voor Red Bloc (of de regel voor nederlaag).
- **Besluit: houden.** Volgende BL2-iteraties: Red Bloc (Flak Gunner, Flak Hauler 0,15/0,2 tegen zwaar), dan Allies (Lancer IFV, Pillbox).
