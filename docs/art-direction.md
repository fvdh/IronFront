# Art direction — Iron Front

## Doel
Zo dicht mogelijk bij de look van klassieke isometrische RTS-games (Red Alert 2-tijdperk) komen, uitsluitend met open gelicentieerde assets. Die games renderden 3D-/voxelmodellen vooraf naar isometrische sprites; wij doen hetzelfde, maar bij het laden in de browser (`src/game/render/art.ts`).

## Projectie & schaal
- 2:1-dimetrie: orthografische camera, 30° elevatie, 45° azimut. Tile = 64×32 px bij zoom 1; 1 tile = 45,25 px per wereldeenheid horizontaal.
- Voertuigen ≈ 0,8–1,25 tile lang (tank 0,95, zware tank 1,15, Ore Hauler 1,25). Infanterie 0,56 tile hoog.
- Gebouwen vullen hun footprint (`w×h` uit `data/buildings.ts`); anker = bovenhoek van de footprint, 110 px headroom.
- Render op 2× resolutie (scherp bij zoom en hi-dpi).

## Licht & schaduw
- Zon linksboven op het scherm (warm wit), hemisferisch fill-licht (koel boven, aards onder).
- Echte schaduwen van het model op een transparant grondvlak (dekking 0,38), vallend naar rechtsonder.

## Richtingen & animatie
- Voertuigen 32 richtingen; geschuttorens apart gebakken (32 richtingen) en op hun draaipunt geplaatst, zodat de toren los van de romp draait.
- Infanterie 16 richtingen met loop-bob; verdedigingstorens met draaiende top.
- Explosies: flits → additieve vuurpuffs → opstijgende zwarte rook (Kenney-particles).

## Kleur & teams
- Teamkleur zoals in het genre: grote vlakken van het voertuig (Quaternius `Main`), uniformen, huiven, en accenten op gebouwen (oranje → teamkleur).
- Factie-identiteit op gebouwen: de lavendelkleurige Kenney-basistint wordt vervangen door de factiekleur (Allied grijsblauw, Red Bloc bruinrood, Psi violet), zie `FACTIONS[*].style`.
- Terrein: fotorealistische CC0-texturen (ambientCG), per wereldpositie geprojecteerd (naadloos), met zachte overgangen in volgorde weg < zand < gras < rots; water blijft procedureel geanimeerd.

## Referentieset (stijlanker)
Allied tank (`unit.tank.allies`), soldaat (`unit.infantry`), Construction Yard (`building.cy`), gras/zand-terrein. Nieuwe assets: low-poly, realistische proporties, gedempte militaire kleuren, geen cartoonachtige/chibi-stijl.

## Afgewezen richtingen
PixVoxel wargame sprites (CC0) en Hard Vacuum (vrij gebruik): te cartoonesk respectievelijk top-down sci-fi. Geen imitaties van beschermde C&C-ontwerpen, logo's of personages.
