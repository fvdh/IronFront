# PROJECT: COMMAND & CONQUER – YURI'S REVENGE WEB REMAKE

## 1. JOUW ROL

Je bent een senior game developer, gespecialiseerd in real-time strategy (RTS) games, game engines, AI, pathfinding, rendering en browsergebaseerde applicaties.

Je hebt ruime ervaring met het ontwikkelen van games die geïnspireerd zijn op klassieke RTS-games zoals Command & Conquer: Red Alert 2 – Yuri's Revenge.

Je bent verantwoordelijk voor het volledige ontwikkelproces van deze game:

* Game design en gameplaymechanieken.
* Technische architectuur.
* Rendering en animaties.
* Unit movement en pathfinding.
* Gebouwen en bouwsystemen.
* Economie en grondstoffen.
* Combat en damage-systemen.
* Vijandelijke AI.
* UI/UX.
* Audio.
* Balancing.
* Performance-optimalisatie.
* Testing en debugging.

Je bent niet alleen een codegenerator, maar neemt de rol aan van een zelfstandige gamestudio.

Denk proactief na over ontbrekende functionaliteit, technische beperkingen en gameplayproblemen. Maak zelf onderbouwde ontwerpkeuzes waar nodig, zonder voortdurend om toestemming te vragen.

Het uiteindelijke resultaat moet een daadwerkelijk speelbare game zijn, geen prototype, statische mock-up of verzameling losse systemen.

---

# 2. HET DOEL

Ontwikkel een complete browsergebaseerde RTS-game geïnspireerd op:

**Command & Conquer: Red Alert 2 – Yuri's Revenge.**

De game moet de klassieke gameplay van Yuri's Revenge zo goed mogelijk benaderen:

* Isometrische battlefield.
* Real-time gameplay.
* Base building.
* Resource gathering.
* Unit production.
* Factions met verschillende eigenschappen.
* Land-, lucht- en zeemachten.
* Strategische gevechten.
* Vijandelijke AI.
* Fog of war.
* Commanderen van individuele units en groepen.
* Een herkenbare klassieke RTS-interface.

De game moet volledig speelbaar zijn in een moderne desktopbrowser.

De speler moet de game kunnen openen en direct een skirmish kunnen starten zonder installatie, account of externe software.

De gameplay moet centraal staan. Een eenvoudige maar goed werkende game is beter dan een visueel indrukwekkende game waarvan de onderliggende systemen niet functioneren.

## Belangrijke ontwerpfilosofie

1. Gameplay boven graphics.
2. Functionaliteit boven visuele perfectie.
3. Een stabiele game-loop boven complexe architectuur.
4. Elk geïmplementeerd systeem moet daadwerkelijk functioneren.
5. Geen nepknoppen of decoratieve UI-elementen die niets doen.
6. Geen placeholderfunctionaliteit die als afgerond wordt gepresenteerd.
7. Bouw iteratief, waarbij de game na iedere fase speelbaar blijft.
8. Alle systemen moeten met elkaar samenwerken.

---

# 3. TECHNISCHE STACK

Gebruik een moderne webstack die geschikt is voor een complexe real-time game.

Voorkeursstack:

* TypeScript.
* React voor de gebruikersinterface.
* Vite als buildtool.
* HTML5 Canvas voor de battlefield-rendering.
* WebGL of PixiJS wanneer dit aantoonbaar voordelen biedt voor performance.
* CSS voor menu's, HUD en interface-elementen.
* Web Audio API voor geluid.
* Zustand of een vergelijkbare lichte state-managementoplossing voor UI-state.
* Vitest voor unit tests.

Gebruik geen zware game-engine wanneer die de ontwikkeling onnodig complex maakt.

De battlefield moet niet als een grote verzameling DOM-elementen worden gerenderd. Gebruik een efficiënte rendertechniek die geschikt is voor honderden bewegende objecten.

Houd de rendering en de game-logica gescheiden.

Gebruik een vaste simulation timestep, onafhankelijk van de renderframerate.

De game moet op een normale desktopcomputer soepel draaien met tientallen tot honderden units op het scherm.

Streef naar 60 FPS, met een robuuste fallback wanneer de hardware dit niet haalt.

---

# 4. GAMESTRUCTUUR

De game bestaat uit de volgende hoofdonderdelen:

1. Main Menu.
2. Skirmish Setup.
3. Battlefield.
4. In-game HUD.
5. Pause Menu.
6. Victory Screen.
7. Defeat Screen.
8. Settings.
9. Tutorial.
10. Game-over- en herstartfunctionaliteit.

De speler moet vanuit het hoofdmenu een nieuwe skirmish kunnen starten.

Bij het starten van een game wordt een map gegenereerd of geselecteerd en worden de spelers en hun startbases geïnitialiseerd.

De game moet een duidelijke overgang hebben tussen menu, loading en gameplay.

---

# 5. FACTIONS

Implementeer de drie hoofdfracties uit het bronspel als afzonderlijke gameplay-identiteiten.

## 5.1 Allies

De Allies zijn gericht op flexibiliteit, geavanceerde technologie en veelzijdige legers.

Kenmerkende eenheden:

* GI.
* Attack Dog.
* Engineer.
* Rocketeer.
* Spy.
* Tanya.
* Chrono Legionnaire.
* Guardian GI.
* SEAL.

Voertuigen:

* Grizzly Battle Tank.
* IFV.
* Prism Tank.
* Mirage Tank.
* MCV.
* Harrier.
* Black Eagle.
* Dolphin.
* Aircraft Carrier.
* Destroyer.
* Aegis Cruiser.

Gebouwen:

* Construction Yard.
* Power Plant.
* Ore Refinery.
* Barracks.
* War Factory.
* Radar Tower.
* Air Force Command.
* Naval Shipyard.
* Battle Lab.
* Prism Tower.
* Pillbox.
* Patriot Missile System.

## 5.2 Soviets

De Soviets zijn gericht op brute kracht, zware bepantsering en krachtige artillerie.

Kenmerkende eenheden:

* Conscript.
* Attack Dog.
* Engineer.
* Tesla Trooper.
* Flak Trooper.
* Crazy Ivan.
* Boris.
* Yuri.
* Chrono Ivan.

Voertuigen:

* Rhino Heavy Tank.
* Flak Track.
* Apocalypse Tank.
* V3 Rocket Launcher.
* Kirov Airship.
* Terror Drone.
* Siege Chopper.
* Sea Scorpion.
* Typhoon Attack Sub.
* Dreadnought.
* Giant Squid.
* MCV.

Gebouwen:

* Construction Yard.
* Tesla Reactor.
* Ore Refinery.
* Soviet Barracks.
* War Factory.
* Radar Tower.
* Naval Shipyard.
* Battle Lab.
* Tesla Coil.
* Flak Cannon.
* Sentry Gun.

## 5.3 Yuri

Yuri is gespecialiseerd in mind control, psychologische oorlogsvoering en onconventionele eenheden.

Kenmerkende eenheden:

* Initiate.
* Brute.
* Virus.
* Yuri Clone.
* Yuri Prime.
* Mastermind.
* Lasher Tank.
* Gatling Tank.
* Chaos Drone.
* Magnetron.
* Floating Disc.
* Slave Miner.

Gebouwen:

* Yuri Construction Yard.
* Bio Reactor.
* Slave Miner.
* Yuri Barracks.
* War Factory.
* Psychic Radar.
* Battle Lab.
* Psychic Tower.
* Gatling Cannon.
* Grinder.
* Cloning Vats.

Alle fracties moeten een eigen visuele identiteit hebben.

Belangrijk: dit is de volledige gewenste inhoudelijke richting, maar implementeer de eenheden gefaseerd. Begin met de eenheden die nodig zijn voor een complete speelbare skirmish en breid daarna uit.

Gebruik voor de eerste versie eigen, herkenbare placeholder-art die later vervangen kan worden door definitieve assets.

---

# 6. DE GAME MAP

De battlefield is een isometrische kaart.

## 6.1 Map rendering

Implementeer:

* Isometrische tile rendering.
* Gras.
* Zand.
* Water.
* Rotsen.
* Wegen.
* Bomen.
* Gebouwen.
* Bruggen.
* Rivieren.
* Ore fields.
* Gems.
* Obstakels.
* Decoratieve elementen.

De kaart moet visueel diepte hebben en duidelijk onderscheid maken tussen begaanbaar en onbegaanbaar terrein.

## 6.2 Camera

De speler moet de camera kunnen bedienen met:

* WASD.
* Pijltjestoetsen.
* Muis aan de schermrand.
* Middle mouse drag.
* Zoom met scrollwiel.

De camera moet soepel bewegen.

De battlefield mag groter zijn dan het zichtbare scherm.

De camera mag niet buiten de mapgrenzen bewegen.

## 6.3 Map generation

Ondersteun:

* Vooraf gedefinieerde maps.
* Willekeurig gegenereerde maps.
* Verschillende mapgroottes.
* Verschillende hoeveelheden grondstoffen.
* Water en land.
* Verschillende startposities.

Zorg dat startbases op geldige locaties worden geplaatst.

Genereer geen onmogelijke situaties waarbij een speler geen ruimte heeft om uit te breiden.

---

# 7. GRONDSTOFFEN EN ECONOMIE

De economie is een essentieel onderdeel van de gameplay.

Implementeer een werkend Ore-systeem.

## 7.1 Ore

Ore wordt verzameld door miners.

De miner moet:

1. Een resource field kunnen vinden.
2. Naar het resource field rijden.
3. Ore verzamelen.
4. Terugkeren naar een refinery.
5. Zijn lading afleveren.
6. Opnieuw grondstoffen verzamelen.

De speler ontvangt credits bij het afleveren.

## 7.2 Miners

Elke miner heeft:

* Capaciteit.
* Bewegingssnelheid.
* Verzameltempo.
* Health.
* Automatische resource-seeking.
* Terugkeerlogica.
* Mogelijkheid om vernietigd te worden.

Miners moeten zelfstandig blijven werken zonder voortdurende input van de speler.

## 7.3 Credits

Credits worden gebruikt voor:

* Gebouwen.
* Infanterie.
* Voertuigen.
* Reparaties.
* Speciale vaardigheden.

De HUD toont het huidige aantal credits.

Wanneer de speler onvoldoende credits heeft, moet de productie wachten totdat er genoeg geld beschikbaar is.

## 7.4 Power

Gebouwen verbruiken energie.

Power Plants produceren energie.

Wanneer het energieverbruik hoger wordt dan de productie:

* Wordt de energiestatus negatief.
* Kunnen bepaalde gebouwen minder efficiënt functioneren.
* Wordt de speler gewaarschuwd.
* Verandert de visuele status van de power-indicator.

---

# 8. BASE BUILDING

De speler moet een basis kunnen bouwen zoals in een klassieke RTS.

## 8.1 Construction Yard

De Construction Yard is het centrale gebouw.

Vanuit dit gebouw kan de speler nieuwe structuren bouwen.

## 8.2 Building placement

Wanneer een gebouw wordt geselecteerd in het bouwmenu:

* Verschijnt een transparante preview.
* De preview volgt de muis.
* Geldige locaties worden groen weergegeven.
* Ongeldige locaties worden rood weergegeven.
* De speler kan het gebouw met een muisklik plaatsen.
* Rechtsklikken annuleert de plaatsing.

Gebouwen mogen niet overlappen.

Gebouwen mogen niet op ongeschikt terrein worden geplaatst.

Houd rekening met de footprint van ieder gebouw.

## 8.3 Construction

Gebouwen worden niet onmiddellijk geplaatst.

Ze hebben een constructietijd.

Tijdens de constructie:

* Wordt de voortgang getoond.
* Worden credits afgeschreven.
* Is het gebouw nog niet volledig operationeel.
* Kan de constructie worden geannuleerd volgens de gekozen spelregels.

## 8.4 Building prerequisites

Gebouwen hebben vereisten.

Voorbeelden:

* Barracks vereist Construction Yard.
* War Factory vereist Construction Yard en voldoende power.
* Battle Lab vereist eerdere technologische gebouwen.
* Geavanceerde eenheden vereisen een Battle Lab.

Gebruik een data-driven systeem waarin vereisten eenvoudig aanpasbaar zijn.

## 8.5 Building destruction

Gebouwen hebben health.

Ze kunnen beschadigd raken en vernietigd worden.

Vernietigde gebouwen worden uit de game verwijderd en kunnen geen units meer produceren.

---

# 9. UNIT PRODUCTION

De speler moet units kunnen produceren via de juiste gebouwen.

Voorbeelden:

* Infanterie vanuit Barracks.
* Voertuigen vanuit War Factory.
* Luchteenheden vanuit Air Force Command.
* Schepen vanuit Naval Shipyard.

Iedere unit heeft:

* Productiekosten.
* Productietijd.
* Health.
* Damage.
* Range.
* Bewegingssnelheid.
* Aanvalsfrequentie.
* Armor type.
* Eigen gedrag.
* Eigen visuele representatie.

## Production queue

Implementeer een productierij.

De speler kan:

* Een unit toevoegen.
* Meerdere units toevoegen.
* Productie annuleren.
* De voortgang bekijken.
* De resterende tijd bekijken.

Productie moet doorgaan terwijl de speler andere acties uitvoert.

Als een gebouw wordt vernietigd, moet de productierij correct worden afgehandeld.

---

# 10. UNIT CONTROL

Dit is een van de belangrijkste systemen van de game.

De speler moet individuele units en groepen kunnen selecteren en aansturen.

## 10.1 Selection

Ondersteun:

* Single click.
* Drag selection box.
* Shift-click om units toe te voegen.
* Ctrl-click om units te verwijderen.
* Double-click om vergelijkbare units te selecteren.
* Select all units of a type.
* Select all military units.

De geselecteerde units krijgen een duidelijke visuele indicator.

## 10.2 Movement

Rechtsklikken op de grond geeft een bewegingsopdracht.

Units moeten:

* Een pad naar de bestemming vinden.
* Obstakels vermijden.
* Niet allemaal op exact dezelfde positie eindigen.
* Elkaar zo min mogelijk blokkeren.
* Hun bestemming kunnen aanpassen.
* Onderweg kunnen worden aangevallen.

## 10.3 Formation movement

Wanneer meerdere units tegelijk worden geselecteerd, moeten ze als groep kunnen bewegen.

Gebruik een eenvoudige formatie zoals:

* Line.
* Box.
* Loose formation.

Units mogen niet allemaal hetzelfde pad volgen wanneer dat tot opstoppingen leidt.

## 10.4 Attack commands

Rechtsklikken op een vijandelijke unit geeft een aanvalsopdracht.

Units moeten:

* Naar een geschikte aanvalspositie bewegen.
* Binnen hun range aanvallen.
* Opnieuw aanvallen wanneer het doelwit nog leeft.
* Stoppen wanneer het doelwit vernietigd is.
* Een nieuw doelwit zoeken wanneer de opdracht dat toestaat.

## 10.5 Guard mode

Units kunnen een positie bewaken.

Ze vallen vijanden aan die binnen hun detectieradius komen, maar verlaten hun positie niet onbeperkt.

## 10.6 Stop command

De speler moet units onmiddellijk kunnen laten stoppen.

## 10.7 Attack Move

Ondersteun Attack Move.

Units bewegen naar een opgegeven bestemming en vallen onderweg vijanden aan.

---

# 11. PATHFINDING

Implementeer een robuust pathfinding-systeem.

Gebruik A* op een grid als uitgangspunt.

Het systeem moet rekening houden met:

* Terrain.
* Obstakels.
* Gebouwen.
* Water.
* Unit size.
* Bewegende eenheden.
* Dynamische blokkades.

Gebruik waar nodig aanvullende technieken voor lokale avoidance.

Voorkom dat units:

* Vastlopen tegen muren.
* Eindeloos rondjes lopen.
* Door gebouwen heen bewegen.
* Onbereikbare bestemmingen blijven proberen.
* Elkaar permanent blokkeren.

Wanneer een route onmogelijk is, moet de unit een alternatieve route zoeken of de opdracht correct afbreken.

Optimaliseer pathfinding zodat niet iedere unit iedere frame een volledige nieuwe route berekent.

Gebruik waar nodig path caching en throttling.

---

# 12. COMBAT SYSTEM

Combat moet de klassieke RTS-ervaring ondersteunen.

## 12.1 Damage

Elke unit en elk gebouw heeft health.

Aanvallen veroorzaken damage.

Damage wordt beïnvloed door:

* Wapentype.
* Armor.
* Afstand.
* Eventuele resistenties.
* Speciale eigenschappen.

## 12.2 Projectiles

Gebruik zichtbare projectielen voor wapens die dit nodig hebben.

Voorbeelden:

* Machinegeweervuur.
* Tankgranaten.
* Raketten.
* Laserstralen.
* Tesla-aanvallen.

Projectielen moeten hun doel kunnen raken en damage veroorzaken.

## 12.3 Explosions

Bij vernietiging:

* Speel een explosieanimatie.
* Verwijder het object.
* Toon eventueel debris.
* Speel geluid af.

## 12.4 Damage feedback

Toon duidelijk wanneer een unit schade ontvangt.

Gebruik health bars wanneer units geselecteerd zijn of wanneer de speler eroverheen hovert.

## 12.5 Veterancy

Units kunnen ervaring opdoen door gevechten.

Ervaren units kunnen:

* Meer damage veroorzaken.
* Sneller aanvallen.
* Een visuele rangindicatie krijgen.

---

# 13. SPECIAL ABILITIES

Implementeer speciale vaardigheden als afzonderlijke systemen.

Voorbeelden:

* Chrono Shift.
* Iron Curtain.
* Chronosphere.
* Psychic Dominator.
* Spy infiltration.
* Mind Control.
* Engineer capture.
* Repair.
* Unit deployment.

Iedere ability moet beschikken over:

* Een duidelijke gebruikersinterface.
* Een cooldown.
* Geldige targets.
* Een visuele feedback.
* Een werkend effect.

Begin met een beperkt aantal abilities en breid deze uit.

---

# 14. FOG OF WAR

Implementeer fog of war.

De speler mag niet automatisch de volledige vijandelijke basis kunnen zien.

Units en gebouwen hebben een zichtbereik.

Gebieden die eerder zijn verkend kunnen op de minimap zichtbaar blijven, maar vijandelijke bewegingen buiten het actuele zicht mogen niet continu worden weergegeven.

De AI moet dezelfde zichtregels respecteren.

Gebruik een efficiënt systeem dat niet iedere frame voor iedere tile onnodig zichtberekeningen uitvoert.

---

# 15. MINIMAP

Implementeer een minimap in de HUD.

De minimap toont:

* Terrain.
* Eigen gebouwen.
* Eigen units.
* Bekende vijandelijke objecten.
* Resource fields.
* De huidige cameraregio.

De speler kan op de minimap klikken om de camera te verplaatsen.

De minimap moet correct schalen met verschillende mapgroottes.

---

# 16. ENEMY AI

De vijandelijke AI moet daadwerkelijk kunnen spelen.

Dit is geen decoratieve AI die alleen units willekeurig laat bewegen.

De AI moet de fundamentele RTS-gameplay begrijpen.

## 16.1 AI economy

De AI moet:

* Grondstoffen verzamelen.
* Refineries bouwen.
* Power beheren.
* Productiegebouwen bouwen.
* Credits bewaken.

## 16.2 AI base building

De AI moet zelfstandig een basis opbouwen.

Gebruik een prioriteitssysteem voor bouwbeslissingen.

Voorbeeld:

1. Construction Yard.
2. Power.
3. Refinery.
4. Barracks.
5. War Factory.
6. Extra power.
7. Radar.
8. Battle Lab.
9. Defenses.
10. Extra productie.

De volgorde moet dynamisch kunnen veranderen afhankelijk van de situatie.

## 16.3 AI army

De AI moet:

* Units produceren.
* Een leger samenstellen.
* Aanvallen voorbereiden.
* De vijandelijke basis lokaliseren.
* Aanvallen uitvoeren.
* Eigen gebouwen verdedigen.
* Reageren op aanvallen van de speler.

## 16.4 AI difficulty

Ondersteun drie moeilijkheidsgraden.

**Easy**

* Langzamere economie.
* Minder agressief.
* Langere reactietijden.
* Kleinere aanvalsgroepen.

**Normal**

* Gebalanceerde economie.
* Regelmatige aanvallen.
* Redelijke verdediging.
* Gebruik van meerdere unittypes.

**Hard**

* Efficiëntere productie.
* Grotere legers.
* Snellere reacties.
* Strategische aanvallen.
* Actief gebruik van speciale vaardigheden.

Maak de AI uitdagender door betere beslissingen te nemen, niet uitsluitend door oneerlijke voordelen te geven.

---

# 17. GAME MODES

## 17.1 Skirmish

De belangrijkste spelmodus.

De speler kiest:

* Faction.
* Map.
* Tegenstander.
* Aantal AI-spelers.
* Moeilijkheid.
* Startcredits.
* Game speed.
* Map size.

De speler start met een Construction Yard en een kleine hoeveelheid credits.

De overwinning wordt behaald wanneer alle vijandelijke spelers zijn uitgeschakeld.

## 17.2 Sandbox

Een modus waarin de speler vrij kan experimenteren.

Eigenschappen:

* Onbeperkte credits.
* Geen vijandelijke AI.
* Direct toegang tot gebouwen en units.
* Mogelijkheid om systemen te testen.

## 17.3 Tutorial

Een interactieve tutorial die de speler leert:

1. Units selecteren.
2. Units verplaatsen.
3. Gebouwen bouwen.
4. Grondstoffen verzamelen.
5. Units produceren.
6. Een vijand aanvallen.
7. Een skirmish winnen.

---

# 18. USER INTERFACE

De interface moet herkenbaar zijn als een klassieke RTS-interface.

## 18.1 Main menu

Het hoofdmenu bevat:

* New Game.
* Skirmish.
* Sandbox.
* Settings.
* Credits.

Gebruik een passende militaire stijl.

## 18.2 In-game HUD

De HUD bevat:

* Credits.
* Power status.
* Minimap.
* Build menu.
* Unit information.
* Selected unit details.
* Production queue.
* Game timer.
* Pause button.
* Speed controls.

## 18.3 Build menu

Het bouwmenu moet duidelijk tonen:

* Beschikbare gebouwen.
* Kosten.
* Bouwtijd.
* Vereisten.
* Beschikbaarheid.
* Productiestatus.

Onbeschikbare gebouwen zijn zichtbaar maar duidelijk gemarkeerd.

## 18.4 Unit information

Wanneer een unit wordt geselecteerd, toont de UI:

* Naam.
* Health.
* Rank.
* Damage.
* Armor.
* Status.
* Eventuele speciale vaardigheden.

## 18.5 Tooltips

Alle belangrijke knoppen en units moeten tooltips hebben.

Tooltips bevatten korte, bruikbare informatie.

---

# 19. AUDIO

Gebruik een eigen audio-identiteit die past bij een klassieke militaire RTS.

Implementeer:

* Unit selection sounds.
* Movement acknowledgements.
* Attack sounds.
* Weapon sounds.
* Explosions.
* Building construction.
* Unit production.
* Alerts.
* Victory sound.
* Defeat sound.
* Achtergrondmuziek.

Gebruik uitsluitend originele of correct gelicentieerde audiobestanden.

Voorzie een volume-instelling voor:

* Music.
* Sound effects.
* UI sounds.

Audio moet kunnen worden uitgeschakeld.

---

# 20. VISUAL DESIGN

De game moet een herkenbare retro-isometrische RTS-uitstraling hebben.

Gebruik een consistente visuele stijl:

* Pixel art of zorgvuldig ontworpen low-resolution sprites.
* Isometrische gebouwen.
* Duidelijke unit-silhouetten.
* Teamkleuren.
* Animaties voor beweging en combat.
* Explosies.
* Rook.
* Projectielen.
* Schaduwen.
* Visuele feedback voor selectie en opdrachten.

Gebruik geen willekeurige emoji als permanente game-assets.

Gebruik geen generieke gekleurde vierkantjes als definitieve representatie van units.

Placeholder-art mag tijdens de eerste ontwikkelfase worden gebruikt, maar moet duidelijk als tijdelijk herkenbaar zijn en via een asset-systeem eenvoudig vervangbaar blijven.

Gebruik eigen of gelicentieerde assets.

---

# 21. GAME ENGINE ARCHITECTURE

Houd de game-engine modulair.

Aanbevolen structuur:

src/
app/
App.tsx
routes/
state/

game/
core/
Game.ts
GameLoop.ts
GameState.ts
GameConfig.ts

```
rendering/
  Renderer.ts
  Camera.ts
  IsometricProjection.ts
  SpriteManager.ts
  AnimationManager.ts
  EffectsRenderer.ts

world/
  Map.ts
  Tile.ts
  Terrain.ts
  MapGenerator.ts
  ResourceField.ts

entities/
  Entity.ts
  Unit.ts
  Building.ts
  Projectile.ts
  Resource.ts

systems/
  MovementSystem.ts
  PathfindingSystem.ts
  CombatSystem.ts
  EconomySystem.ts
  ProductionSystem.ts
  ConstructionSystem.ts
  FogOfWarSystem.ts
  SelectionSystem.ts
  AISystem.ts
  AudioSystem.ts

factions/
  Allies.ts
  Soviets.ts
  Yuri.ts

data/
  units.ts
  buildings.ts
  weapons.ts
  factions.ts
  technologies.ts

ui/
  MainMenu.tsx
  GameHUD.tsx
  Minimap.tsx
  BuildMenu.tsx
  UnitPanel.tsx
  ProductionQueue.tsx
  PauseMenu.tsx
  VictoryScreen.tsx
  DefeatScreen.tsx

input/
  MouseInput.ts
  KeyboardInput.ts
  CommandHandler.ts
```

assets/
sprites/
audio/
maps/

tests/

Dit is een richtlijn, geen verplichting om ieder bestand direct aan te maken.

Houd bestanden overzichtelijk en verantwoordelijkheden gescheiden.

Vermijd één enorm Game.ts-bestand waarin alle logica terechtkomt.

---

# 22. PERFORMANCE

De game moet ook met veel actieve entiteiten speelbaar blijven.

Implementeer:

* Efficient rendering.
* Spatial partitioning.
* Culling buiten het scherm.
* Throttled pathfinding.
* Object pooling voor projectielen en effecten waar nuttig.
* Efficiënte collision detection.
* Geen onnodige React-rerenders tijdens de game-loop.
* Scheiding tussen simulation en rendering.
* Efficiënt resource management.

Voorkom memory leaks.

Zorg dat event listeners correct worden opgeruimd.

---

# 23. SAVE SYSTEM

Implementeer lokale opslag.

De speler moet een game kunnen opslaan en later hervatten.

Sla minimaal op:

* Map.
* Spelerposities.
* Gebouwen.
* Units.
* Credits.
* Production queues.
* Health.
* Game time.
* Fog of war.
* AI-state.
* Overige relevante gameplay-state.

Gebruik versioned save data.

Voeg een controle toe op corrupte of incompatibele savegames.

---

# 24. GAME BALANCING

Gebruik data-driven balancing.

Alle belangrijke waarden moeten centraal configureerbaar zijn.

Voorbeelden:

* Unit costs.
* Build times.
* Health.
* Damage.
* Range.
* Movement speed.
* Armor.
* Resource gathering speed.
* AI aggressiveness.
* Starting credits.

Vermijd hardcoded waarden verspreid door de codebase.

De game moet zo ontworpen zijn dat balancing later eenvoudig kan worden aangepast.

---

# 25. TESTING

Schrijf tests voor de belangrijkste systemen.

Minimaal:

* Resource gathering.
* Building placement.
* Production queues.
* Unit movement.
* Pathfinding.
* Combat damage.
* Building destruction.
* Win conditions.
* Lose conditions.
* Save/load.
* AI resource management.

Voer daarnaast handmatige gameplaytests uit.

Test minimaal de volgende scenario's:

1. Speler kan een basis bouwen.
2. Speler kan een miner produceren.
3. Miner verzamelt grondstoffen.
4. Speler kan een tank produceren.
5. Tank kan bewegen.
6. Tank kan een vijand aanvallen.
7. Vijand kan een basis bouwen.
8. Vijand kan units produceren.
9. Vijand kan de speler aanvallen.
10. Speler kan winnen.
11. Speler kan verliezen.
12. Game kan worden gepauzeerd.
13. Game kan worden opgeslagen en hervat.

Een feature is pas afgerond wanneer deze daadwerkelijk werkt.

---

# 26. ONTWIKKELSTRATEGIE

Ontwikkel de game in duidelijk afgebakende fases.

BELANGRIJK: begin niet met het volledig implementeren van alle fracties en honderden units.

Maak eerst een complete, kleine game-loop die daadwerkelijk speelbaar is.

## FASE 1 – PLAYABLE FOUNDATION

Doel: een eerste werkende RTS-game.

Implementeer:

* Main menu.
* Battlefield.
* Camera.
* Isometrische tiles.
* Unit selection.
* Unit movement.
* Basis pathfinding.
* Een eenvoudige Construction Yard.
* Power Plant.
* Refinery.
* War Factory.
* Miner.
* Grizzly Tank.
* Ore gathering.
* Credits.
* Unit production.
* Combat.
* Eenvoudige vijandelijke AI.
* Win/loss conditions.

De game moet aan het einde van deze fase al een complete skirmish ondersteunen.

De speler moet een basis kunnen bouwen, grondstoffen verzamelen, tanks produceren en een vijandelijke basis vernietigen.

Gebruik voorlopig eenvoudige maar herkenbare graphics.

## FASE 2 – CORE RTS SYSTEMS

Voeg toe:

* Barracks.
* Infantry.
* Meer gebouwen.
* Meer voertuigen.
* Production queues.
* Building prerequisites.
* Power management.
* Fog of war.
* Minimap.
* Attack Move.
* Guard mode.
* Formation movement.
* Verbeterde AI.
* Meerdere maptypes.

## FASE 3 – FACTIONS

Implementeer Allies, Soviets en Yuri als volwaardige fracties.

Iedere fractie krijgt:

* Eigen gebouwen.
* Eigen units.
* Eigen technologie.
* Eigen sterke en zwakke punten.
* Eigen productievereisten.
* Eigen visuele identiteit.

## FASE 4 – ADVANCED GAMEPLAY

Voeg toe:

* Air units.
* Naval units.
* Special abilities.
* Veterancy.
* Engineers.
* Mind control.
* Garrisoning.
* Bridges.
* Repair.
* Advanced AI.
* Difficulty balancing.

## FASE 5 – POLISH

Verbeter:

* Graphics.
* Animaties.
* Audio.
* UI.
* Tooltips.
* Game feedback.
* Performance.
* Save/load.
* Settings.
* Tutorial.

## FASE 6 – RELEASE READY

Voer een volledige kwaliteitscontrole uit.

Controleer:

* Geen game-breaking bugs.
* Geen console errors.
* Geen vastlopende units.
* Geen onmogelijke build placements.
* Geen onbedoelde resource duplication.
* Geen kapotte production queues.
* Geen onjuiste win/loss conditions.
* Geen memory leaks.
* Geen onbruikbare UI-elementen.

Optimaliseer de game voor Chrome, Firefox, Safari en Edge op desktop.

---

# 27. BELANGRIJKE WERKAFSPRAKEN

Volg deze afspraken gedurende het volledige project.

1. Begin met het analyseren van de technische aanpak.
2. Maak een beknopt maar concreet implementatieplan.
3. Start daarna direct met de eerste werkende versie.
4. Stel geen onnodige vragen wanneer je zelf een redelijke ontwerpkeuze kunt maken.
5. Maak de game niet complexer dan nodig om de gewenste gameplay te bereiken.
6. Test iedere belangrijke feature voordat je verdergaat.
7. Houd de applicatie na iedere fase uitvoerbaar.
8. Los bugs op voordat je nieuwe systemen toevoegt.
9. Gebruik TypeScript-types voor alle belangrijke game-entiteiten.
10. Houd gameplaydata gescheiden van enginecode.
11. Maak geen schijnimplementaties.
12. Verifieer dat knoppen en acties echt werken.
13. Documenteer belangrijke architectuurkeuzes.
14. Houd een TODO-lijst bij van resterende functionaliteit.
15. Rapporteer eerlijk welke onderdelen volledig, gedeeltelijk of nog niet geïmplementeerd zijn.

Wanneer je toegang hebt tot een terminal, voer dan de benodigde commando's uit, installeer dependencies, start de development server en controleer de applicatie.

Wanneer je toegang hebt tot een browser of browserautomatisering, gebruik die dan om daadwerkelijk gameplay te testen.

Wanneer je geen toegang hebt tot een browser, wees dan transparant over welke tests je wel hebt kunnen uitvoeren.

---

# 28. DEFINITIE VAN KLAAR

De game is pas klaar wanneer de volgende ervaring mogelijk is:

Een speler opent de website.

Hij kiest een fractie.

Hij kiest een map.

Hij start een skirmish tegen een AI-tegenstander.

Hij ziet een isometrische battlefield.

Hij selecteert zijn Construction Yard.

Hij bouwt een Power Plant.

Hij bouwt een Refinery.

Hij verzamelt Ore.

Hij bouwt een War Factory.

Hij produceert tanks.

Hij selecteert zijn leger.

Hij geeft een aanvalsopdracht.

De tanks bewegen zelfstandig over het terrein, vermijden obstakels en vallen vijandelijke eenheden en gebouwen aan.

De vijand reageert met een eigen basis, economie en leger.

Het gevecht ontwikkelt zich in real-time.

Uiteindelijk wint of verliest de speler.

De speler kan direct een nieuwe skirmish starten.

**Dit is het minimale einddoel van de eerste complete versie. Alle overige features bouwen hierop voort.**

---

# 29. START NU

Begin met:

1. Een technische analyse van de benodigde systemen.
2. Een concrete projectstructuur.
3. Een implementatieplan voor fase 1.
4. Het opzetten van de applicatie.
5. Het implementeren van de eerste speelbare battlefield.

Schrijf niet alleen op wat je gaat doen. Voer het daadwerkelijk uit.

Geef prioriteit aan een werkende game die ik direct in mijn browser kan spelen.

Het uiteindelijke doel is een volwaardige, uitbreidbare browser-RTS met de gameplaydiepte en het strategische gevoel van Yuri's Revenge.
