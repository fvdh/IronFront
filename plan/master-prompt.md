# MASTER PROMPT — Browser RTS geïnspireerd op Red Alert 2: Yuri’s Revenge

## 1. Rol en verantwoordelijkheid

Je bent een senior game developer, RTS-game designer en technisch architect. Je ontwikkelt zelfstandig een complete, speelbare browsergebaseerde real-time strategy-game geïnspireerd op de strategische gameplay, leesbaarheid en retro-isometrische sfeer van Command & Conquer: Red Alert 2 – Yuri’s Revenge.

Je bent verantwoordelijk voor ontwerp, architectuur, implementatie, testen, debugging, performance, UI, AI, audio en documentatie. Denk proactief, maak redelijke keuzes zonder onnodige vragen en wees eerlijk over wat wel en niet werkt.

Het doel is geen statische mock-up of proof of concept, maar een game die een speler in de browser kan openen, starten, spelen, winnen of verliezen en opnieuw beginnen.

**Lees eerst `assets.md` in de projectmap en volg het assetbeleid strikt.** Dit document bepaalt waar assets vandaan mogen komen, hoe ze worden geregistreerd en welke beperkingen gelden. Gebruik geen assets met onduidelijke rechten. Gebruik eigen of correct gelicentieerde assets; behandel OpenRA uitsluitend als technische referentie tenzij de licentie van een specifiek onderdeel aantoonbaar hergebruik toestaat.

## 2. Kernvisie

Maak een klassieke RTS met:
- Isometrische battlefield en scroll-/zoomcamera.
- Base building en bouwvereisten.
- Ore verzamelen en credits beheren.
- Energieproductie en stroomverbruik.
- Infanterie, voertuigen, lucht- en zeemachten.
- Unitselectie, groepscommando’s, formatiebeweging en attack-move.
- Pathfinding en lokale botsingsvermijding.
- Combat, projectielen, explosies en schadefeedback.
- Fog of war en minimap.
- Vijandelijke AI die een economie opbouwt, units produceert, verdedigt en aanvalt.
- Skirmish, sandbox, tutorial, pauzeren, winnen, verliezen en opnieuw starten.
- Save/load en instelbare game speed.
- Een eigen visuele identiteit die geïnspireerd is op het genre, maar geen beschermde personages, logo’s, exacte sprites, muziek of andere EA-assets kopieert.

Gameplay en betrouwbaarheid gaan vóór visuele pracht. Een kleine, goed werkende game is waardevoller dan een grote verzameling half werkende systemen.

## 3. Technische uitgangspunten

Gebruik een moderne, onderhoudbare webstack:
- TypeScript.
- Vite.
- React voor menu’s en HUD.
- HTML Canvas voor battlefield-rendering; kies PixiJS/WebGL alleen wanneer dit de implementatie aantoonbaar verbetert.
- Een vaste simulation timestep, los van de renderframerate.
- Gescheiden game-engine en React-UI.
- Vitest voor unit tests.
- Een lichte state-managementoplossing alleen waar nodig.

Render honderden entiteiten efficiënt. Vermijd één DOM-element per unit en voorkom React-rerenders op iedere game-tick. Houd rendering, input, simulatie, UI en data gescheiden.

Start met het bestaande project en behoud bruikbare code. Als er nog geen project bestaat, initialiseer het, installeer dependencies en maak de development server werkend.

## 4. Eerste oplevering: een complete kleine skirmish

Begin niet met honderden units. Bouw eerst een volledige, speelbare vertical slice met:
- Een menu om een skirmish te starten.
- Een isometrische map en camera.
- Eén menselijke speler en één AI-tegenstander.
- Selecteerbare en bestuurbare units.
- Construction Yard, Power Plant, Ore Refinery, War Factory en een verdedigingsgebouw.
- Een miner die automatisch ore verzamelt, naar de refinery terugkeert en credits oplevert.
- Een tank die geproduceerd, geselecteerd, verplaatst en ingezet kan worden.
- Werkende bouwkosten, bouwtijden, productie en combat.
- Een AI die een basis bouwt, grondstoffen verzamelt, tanks produceert en aanvalt.
- Duidelijke win- en verliescondities.
- Pauzeren en opnieuw beginnen.

Aan het einde moet een speler daadwerkelijk kunnen bouwen, oogsten, produceren, aanvallen en de vijandelijke basis vernietigen. Houd de game uitvoerbaar na iedere ontwikkelfase.

## 5. Factions en inhoud

Ontwerp de data en systemen vanaf het begin zodat drie facties kunnen worden ondersteund:
1. Allies: veelzijdigheid, geavanceerde technologie en mobiele tactische opties.
2. Soviets: zware bepantsering, brute kracht en artillerie.
3. Yuri: mind control, psychologische oorlogsvoering en onconventionele technologie.

Gebruik eigen namen, ontwerpen en assets waar nodig om een zelfstandige identiteit te creëren. De volgende voorbeelden zijn gameplayrollen, geen verplichting om beschermde designs te kopiëren:
- Infanterie, antitankeenheden, engineers, scouts en gespecialiseerde elites.
- Lichte en zware tanks, artillerie, luchtafweer, transport en miners.
- Verkenningsvliegtuigen, aanvalsvliegtuigen en luchtschepen.
- Schepen en onderzeese eenheden.
- Basisgebouwen, productiegebouwen, energie, radar, technologie en verdediging.
- Speciale vaardigheden zoals teleportatie, tijdelijke bescherming, mind control of sabotage, met eigen implementatie en visuele uitwerking.

Voeg content gefaseerd toe. Maak geen lege knoppen of units die alleen in een menu bestaan.

## 6. Battlefield, map en camera

Gebruik een tile-based isometrische wereld met gras, zand, water, rotsen, wegen, bomen, ore/gem-velden, bruggen, obstakels en bouwzones.

Implementeer:
- Vooraf gedefinieerde maps en seeded random generation.
- Meerdere mapgroottes en resourceverdelingen.
- Geldige startposities met voldoende uitbreidingsruimte.
- Camera bewegen met WASD/pijltjestoetsen, schermrand en drag.
- Scrollwielzoom met grenzen.
- Camerabegrenzing binnen de map.
- Correcte omzetting tussen schermcoördinaten en wereld-/tilecoördinaten.
- Z-ordering zodat units, gebouwen, effecten en terrein correct worden getekend.

## 7. Economie en energie

Miners moeten autonoom resourcevelden zoeken, verzamelen, terugkeren naar een refinery en credits afleveren. Voorzie capaciteit, verzameltempo, gezondheid, routegedrag en herstel bij geblokkeerde routes.

Credits worden gebruikt voor gebouwen, eenheden, reparaties en vaardigheden. Productie wacht wanneer de speler onvoldoende credits heeft; geld mag niet negatief worden door een ongeldige aankoop.

Power Plants produceren energie. Gebouwen verbruiken energie. Toon de energiebalans duidelijk en laat een tekort merkbare, begrijpelijke gevolgen hebben. Maak alle economische waarden data-driven configureerbaar.

## 8. Bouwen en productie

Gebouwen hebben footprint, kosten, bouwtijd, gezondheid, terreinvereisten en eventuele technologievereisten.

Bij plaatsing:
- Toon een ghost preview onder de cursor.
- Markeer geldige en ongeldige posities.
- Voorkom overlap met gebouwen en onbegaanbaar terrein.
- Annuleer met rechtsklik of Escape.
- Trek kosten op een consistente, testbare manier af.
- Toon constructievoortgang.

Productiegebouwen hebben queues met voortgang, resterende tijd, annuleren en correcte afhandeling bij vernietiging. Units verschijnen op een geldige uitgangspositie en mogen niet in obstakels of andere entiteiten vast komen te zitten.

## 9. Selectie, opdrachten en beweging

Ondersteun:
- Klikselectie en drag-selectie.
- Shift om selectie toe te voegen.
- Dubbelklik om vergelijkbare zichtbare units te selecteren.
- Duidelijke selectie-indicatoren en unitinformatie.
- Rechtsklik voor bewegen of aanvallen afhankelijk van het doel.
- Stop, Guard en Attack Move.
- Groepsbeweging met verspreide bestemmingen of eenvoudige formaties.

Gebruik A* op een grid als basis voor pathfinding, met terrein-, gebouw- en bewegingsbeperkingen. Voeg lokale avoidance toe waar nodig. Bereken routes niet iedere frame opnieuw. Units moeten vastlopen detecteren, een route opnieuw proberen en opdrachten netjes afbreken als een bestemming onbereikbaar is. Voorkom dat eenheden door gebouwen bewegen of elkaar permanent blokkeren.

## 10. Combat

Entiteiten hebben health, armor, wapens, range, cooldown, snelheid en team. Ondersteun verschillende wapentypes en data-driven damage-modifiers.

Implementeer:
- Doelselectie en aanvalsbereik.
- Projectielen of directe aanvallen afhankelijk van het wapen.
- Botsings-/impactdetectie en schade.
- Explosies, rook en vernietigingsfeedback.
- Health bars bij selectie of hover.
- Correcte opruiming van vernietigde entiteiten.
- Optioneel veterancy als latere uitbreiding.

Combat moet betrouwbaar blijven bij veel gelijktijdige gevechten.

## 11. Fog of war en minimap

Units en gebouwen hebben zichtbereik. De speler ziet vijandelijke eenheden alleen wanneer ze zichtbaar zijn; eerder verkende terreinen kunnen als geheugen op de minimap blijven staan. De AI moet dezelfde informatiebeperkingen respecteren en mag geen verborgen spelerunits volgen.

De minimap toont terrein, eigen entiteiten, zichtbare vijanden, bekende resources en de huidige cameraweergave. Klikken op de minimap verplaatst de camera.

## 12. AI

De AI moet zelfstandig kunnen spelen, niet slechts willekeurig units spawnen.

De AI:
- Beheert credits en resources.
- Bouwt een functionele basis.
- Houdt rekening met power en vereisten.
- Produceert een gevarieerd leger.
- Verdedigt belangrijke gebouwen.
- Vormt aanvalsgroepen.
- Verkent en valt aan op basis van legitieme zichtinformatie.
- Reageert op bedreigingen.
- Herstelt van verlies van gebouwen of miners.

Voorzie Easy, Normal en Hard. Maak moeilijkheid vooral anders via besluitvorming, reactietijd, economie en aanvalsgrootte. Geef de AI geen verborgen informatie over de speler.

## 13. UI en bediening

Maak een duidelijke klassieke RTS-HUD met:
- Credits en powerstatus.
- Minimap.
- Bouwmenu met kosten, tijd, vereisten en beschikbaarheid.
- Productiequeues.
- Geselecteerde unit-/gebouwinformatie.
- Game timer, pauze en snelheid.
- Tooltips en zichtbare feedback bij ongeldige acties.

Hoofdmenu: New Game, Skirmish, Sandbox, Settings en Credits. Voorzie schermen voor pauze, overwinning en nederlaag. Alle zichtbare knoppen moeten werken.

## 14. Audio en visuele assets

Volg `assets.md` strikt. Gebruik een centrale AssetManager en stabiele asset-ID’s. Registreer bron, licentie, attributie en status in een assetregister.

Maak eerst een kleine, consistente referentieset en leg de art direction vast in `docs/art-direction.md`. Gebruik placeholders wanneer nodig, maar zorg dat ze later zonder wijzigingen aan gameplaycode vervangbaar zijn. Gebruik geen emoji als definitieve art.

Voorzie eigen of correct gelicentieerde UI-geluiden, selectie-, bewegings-, aanval-, explosie-, constructie-, productie-, waarschuwing-, overwinning- en nederlaaggeluiden. Bied aparte volumeregelaars en een mute-optie. Geen originele C&C-muziek, stemmen of geluiden zonder passende rechten.

## 15. Save/load en instellingen

Sla map, game time, spelers, entiteiten, health, credits, productiequeues, AI-state en fog of war op. Gebruik versiebeheer in het saveformaat en valideer data bij laden. Toon begrijpelijke foutmeldingen bij corrupte of incompatibele saves.

Instellingen omvatten minimaal volume, scrollsnelheid, zoom en game speed. Zorg dat pauzeren de simulatie stopt, maar de UI bruikbaar blijft.

## 16. Architectuur en onderhoudbaarheid

Gebruik modulaire systemen voor:
- Game loop en state.
- Rendering, camera en projectie.
- Map, tiles en resources.
- Entiteiten en data-definities.
- Movement en pathfinding.
- Combat en effecten.
- Economie, constructie en productie.
- Fog of war en selectie.
- AI.
- Input en command handling.
- Audio en assets.
- React UI.

Vermijd een monolithisch bestand. Houd balanswaarden centraal in data/configuratiebestanden. Gebruik duidelijke types, foutafhandeling en documenteer belangrijke architectuurkeuzes.

## 17. Ontwikkelfases

### Fase 1 — Playable foundation
Map, camera, selectie, movement, pathfinding, basiseconomie, basisbouwen, miner, tank, productie, combat, eenvoudige AI en win/loss.

### Fase 2 — Core RTS
Barracks, infanterie, meer gebouwen/voertuigen, queues, prerequisites, power, fog of war, minimap, attack-move, guard en verbeterde AI.

### Fase 3 — Factions
Voeg Allies, Soviets en Yuri als onderscheiden speelbare facties toe met eigen eenheden, gebouwen, technologie en visuele identiteit.

### Fase 4 — Advanced gameplay
Lucht- en zeemachten, speciale vaardigheden, engineers, mind control, garrisoning, bruggen, reparaties en geavanceerde AI.

### Fase 5 — Polish
Definitieve eigen assets, animaties, audio, UI, tutorial, balancing, performance en save/load.

### Fase 6 — Release candidate
Voer volledige regressietests uit, los gameplayproblemen op, controleer licenties en attributies en test in actuele desktopbrowsers.

## 18. Tests en kwaliteitscriteria

Schrijf tests voor resource gathering, build placement, productie, pathfinding, beweging, combat, vernietiging, win/loss en save/load.

Test daarnaast end-to-end:
1. Start skirmish.
2. Bouw power en refinery.
3. Laat miner resources verzamelen.
4. Bouw war factory en produceer tank.
5. Beweeg en selecteer units.
6. Val een vijand aan.
7. Controleer dat de AI bouwt, oogst, produceert en aanvalt.
8. Win en verlies een game.
9. Pauzeer, hervat en herstart.
10. Sla op en laad opnieuw.

Controleer consolefouten, vastlopende units, ongeldige plaatsingen, foutieve kosten, kapotte queues, onbereikbare routes, AI-cheats, memory leaks en performance.

Een feature is pas klaar wanneer deze daadwerkelijk is getest. Rapporteer duidelijk wat volledig, gedeeltelijk of niet geïmplementeerd is.

## 19. Werkwijze

1. Inspecteer eerst de projectmap en lees `assets.md`.
2. Geef een beknopte technische analyse en een concreet plan voor fase 1.
3. Begin daarna direct met implementeren; blijf niet hangen in plannen.
4. Start de app en verifieer dat de eerste versie in de browser werkt.
5. Werk in kleine, controleerbare stappen.
6. Test na iedere belangrijke wijziging.
7. Los regressies op voordat je verder uitbreidt.
8. Houd een actuele TODO-lijst en korte voortgangsnotities bij.
9. Vraag alleen om input wanneer een beslissing echt niet verantwoord zelf kan worden genomen.
10. Claim nooit dat iets werkt zonder het te hebben geverifieerd.

## 20. Definitie van klaar

Een speler kan de website openen, een factie en map kiezen, een skirmish tegen AI starten, een basis bouwen, ore verzamelen, credits beheren, eenheden produceren, een leger selecteren en aansturen, de vijand bestrijden en een overwinning of nederlaag bereiken. De speler kan daarna opnieuw spelen.

**Start nu:** inspecteer de projectmap, lees `assets.md`, stel de architectuur voor fase 1 vast en implementeer vervolgens de eerste complete speelbare skirmish. Schrijf niet alleen op wat je gaat doen: voer het daadwerkelijk uit.
