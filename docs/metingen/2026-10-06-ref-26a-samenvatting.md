# Referentiemeting ref-26a: samenvatting (2026-10-06)

Fun Pass 26.A (`plan/fun-pass-plan.md`, fase 26). Branch `fase-26a`, AI-versie **2**. Gedraaid met `tools/nulmeting.sh ref-26a`. Buildlabel `1.3.0+b573c461-dirty`: de AI-wijziging was nog niet gecommit; de bron is de branch `fase-26a` op het moment van de run.

Dit is vanaf nu **arm A** voor alle vergelijkingen in fase 23–27 (beslissing 14).

## Wat 26.A aan de AI verandert (`src/game/systems/ai.ts`)
- **Geheugen** (`ai.memory`): vijandelijke gebouwen met plek en tijdstip van laatst gezien. Ziet de AI de plek weer en is het gebouw weg, dan valt het weg; anders blijft het een **aanname** met een leeftijd. Ook laatst geziene legers (3 min) en plekken waar de AI zelf geraakt werd (2 min).
- **Doelkeuze:** gebouwen die de AI nu ziet (dichtst bij huis), anders de jongste aanname; dan zichtbare eenheden; dan onverkende starthoeken; dan zoeken.
- **Zoeken** in vaste volgorde: recente gevechten → ertsmijnen (openbaar) → tech- en burgergebouwen → laatst bekende posities → nooit verkende kaart → de rest; binnen elke groep van dichtbij naar ver, alleen over land dat bereikbaar is. Een bekeken plek wordt 2 min overgeslagen.
- **Verkennen:** een gebouw dat al 60 s niet gezien is, laat één eenheid gaan kijken. Weet de AI niets meer, dan zoeken tot drie eenheden buiten de golf. **Geen openingsverkenner** (besluit opdrachtgever): de opening blijft gelijk aan 1.3.0.

## Tests
- **Exploit-test** (`src/game/tests/ai-intent.test.ts`): 8 potjes (plains, rivers, highlands, coast). Nadat de AI de oude basis gezien heeft, zet de speler een nieuwe basis in een vrije hoek die de AI op dat moment niet ziet, verkoopt de oude en zet geen leger neer.
  - AI-versie 2 vindt de nieuwe basis in 8 van 8, na 0,3–1,1 min.
  - AI-versie 1 (1.3.0) vindt hem in 2 van 8 binnen 3 min.
- **Eerlijkheid:** een test dat de AI een gebouw pas kent als ze het zag, het als aanname houdt als het buiten zicht verdwijnt, en het pas laat vallen als ze weer kijkt. Soak-invariant: elk onthouden gebouw ligt in grond die de AI verkend heeft, op de echte plek. Soak met 12 potjes: geen schendingen.

## Uitkomst tegen de nulmeting
De opening is identiek (eerste contact, tijd tot eerste strategische keuze, keuze-idle). Verschillen ontstaan pas als een AI een basis kwijt is, en blijven klein.

| | nul | ref-26a |
|---|---|---|
| Land: duur (mediaan) | 7,8 min | 7,8 min |
| Land: winrate Allies / Red Bloc / Psi | 61 / 50 / 39% | 58 / 53 / 39% |
| Zee: winrate | 56 / 25 / 69% | 56 / 25 / 69% |
| Normal-medium: duur (mediaan) | 9,7 min | 9,8 min |
| Normal-medium: winrate | 50 / 42 / 58% | 58 / 33 / 58% |
| Normal-medium: comeback | 31% | 40% |
| Normal-medium: patstellingen | 1/27 (4%) | **2/27 (7%)** |

Alle verschillen vallen binnen het 95%-interval (`…-ref-26a-*-vs-nul-*.md`). Het ore-harnas blijft neutraal en duelmatrix en scenario's zijn gelijk (geen AI).

**Patstellingen (doelgrens ≤ 2%).** Alle drie de patstellingen (één in `nul`, twee in `ref-26a`) zijn hetzelfde geval: Red Bloc tegen Red Bloc, één kant heeft alleen nog een **Thunderhead Airship**, de ander heeft geen basis meer of geen luchtafweer in het leger. Niemand kan het luchtschip neerhalen. Dat is geen fout in het geheugen: 26.A verandert alleen welk potje in dat gat valt. Het hoort bij **BL2** (luchtafweer) en de regel voor nederlaag; het ligt boven de doelgrens van 2%, en moet in fase 23–26 opgelost worden.
