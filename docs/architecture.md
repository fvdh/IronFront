# Architectuur

```
src/
  main.tsx, App.tsx          schermen: menu → setup → game (React)
  settings.ts                persistente gebruikersinstellingen
  ui/                        React: MainMenu, SkirmishSetup, GameView (topbar, pauze, eindscherm), Sidebar (bouwmenu, minimap, selectie)
  game/
    Game.ts                  controller: fixed-timestep loop, camera, events → audio/meldingen, API voor de UI
    input.ts                 muis/toetsenbord → selectie, camera, commando's
    audio.ts                 Web Audio-synthese + spraakmeldingen
    tutorial.ts              tutorialstappen (conditie per stap)
    types.ts                 alle gameplay-types
    data/                    balans en definities (units, buildings, weapons, factions, config)
    world/                   map, terrain, seeded mapgeneratie
    core/                    state (createGame), entities, sim (tick), save
    systems/                 pathfinding, movement, combat, economy, production, fog, orders, ai
    render/                  iso-projectie + camera, AssetManager (assets.ts), renderer
    tests/                   Vitest (incl. headless AI-vs-AI)
```

## Belangrijke keuzes
- **Simulatie los van rendering.** `core/sim.ts#tick` is een pure functie op `GameState` (30 ticks/s × gamesnelheid). De renderer interpoleert posities tussen ticks. Hierdoor draait de hele game headless in tests.
- **Serialiseerbare state.** Alles in `GameState` is plain data behalve `rt` (id-index, bezettingsgrid, eventqueue), die bij laden via `rebuildRuntime` wordt herbouwd. Saves zijn geversioneerd en gevalideerd (`core/save.ts`).
- **Commando's met eigendomscontrole.** Speler en AI gebruiken dezelfde functies (`systems/orders.ts`, `systems/production.ts`); die filteren op eigenaar.
- **Eerlijke AI.** De AI leest alleen `visible`-tiles, eerder geziene gebouwen (`seenBy`) en publieke kaartinfo. Geen verborgen kennis.
- **React rendert niet per tick.** `Game.notify()` draait ~8×/s; React leest via `useSyncExternalStore`. Het slagveld is één canvas; de minimap tekent zelf op 10 Hz.
- **Assets via ID.** Data verwijst naar `sprite`-ID's. `render/art.ts` (manifest + baker) rendert de 3D-modellen bij het laden met three.js naar sprite-atlassen per teamkleur; `render/assets.ts` levert procedurele fallbacks. Vervangen raakt geen gameplaycode.
- **Baked art.** `prepareArt(players)` draait vóór de game start (laadbalk, ~1–2 s per team, gecachet). Units: 32 richtingen, torens apart met draaipunt; gebouwen: één beeld; terrein: wereld-verankerde texturen + zachte overgangen.
- **Terrein-art per onderdeel.** `render/water.ts`, `bridge.ts` en `ore.ts` bakken hun eigen art (water bij het laden, bruggen per kaart via `bakeBridges`, ore bij het laden) en geven `false` terug als iets faalt; de renderer valt dan terug op `assets.ts`.
- **Ore mines.** `map.oreSources` (onbegaanbare tegels) vullen ore in een straal van 2 aan; rijke tegels verspreiden zich (`economy.ts#regrowOre`). Deterministisch via de game-RNG.
- **Pathfinding.** A* (8 richtingen, geen hoek-afsnijden) met herbruikbare buffers en node-limiet, budget per tick (`PATHS_PER_TICK`), padversimpeling via line-of-sight, vastloopdetectie → herplannen → opgeven. Onbereikbaar doel ⇒ pad naar dichtstbijzijnde bereikbare tile.
- **Botsing.** Zachte separatie tussen units (O(n²), ruim voldoende tot ~400 units; gemeten 1,9 ms/tick bij ~290 units).

## Verificatie
- `BALANCE=27 npx vitest run balance` — opt-in AI-vs-AI-balansmeting (print winnaars, duur en eindstand per potje).
- `npm test` — unit/integratietests voor pathfinding, bouwen/plaatsen, productie & kosten, oogsten, combat & opruimen, win/verlies, save/load, AI-economie/aanval en een volledig AI-vs-AI-potje tot winnaar.
- In dev-modus zijn `window.__game` en `window.__step(n)` beschikbaar om de simulatie vanuit browserautomatisering te sturen.

## Facties (fase 3)
Elke unit/gebouw-def heeft `factions` (gebouwen: weglaten = alle facties). `forFaction(def, faction)` in `systems/production.ts` is de enige check (sidebar-catalogus én `enqueue`). `FACTIONS[f].roster` beschrijft de rollen die de AI gebruikt (raider, support, tech, infAI, infAT, defenses). Wapenmechanieken staan in `WeaponDef` (`splash`, `ramp`) en `UnitDef.regen`; afhandeling in `systems/combat.ts` (`hit`, `fire`) en `systems/orders.ts`.

## Fase 4
- `canHit(weapon, target)` in `systems/combat.ts` is de centrale regel wie wat kan raken (lucht vs `aa`, mind control, armor 0). Gebruikt door auto-targeting, `engage`, `commandAttack` en spatschade.
- Mind control: `takeControl` zet `owner`, `mcBy`, `mcOwner`; vrijgave in `core/sim.ts removeDead` als de controller sterft.
- Veterancy: `Entity.xp`, `rankOf(e)`; schade wordt in `hit`/`damage` geschaald. `damage(…, by)` krijgt de schutter mee (projectielen via `sourceId`).
- Vliegtuigen (`UnitDef.air`): `processPaths` geeft een direct pad, `moveStep` negeert blokkades, `separate` duwt alleen lucht tegen lucht. De renderer tekent ze `AIR_ALTITUDE` px hoger met een eigen grondschaduw.
- Engineers: order `capture` (`commandCapture` + `captureTick` in `systems/orders.ts`). Repair Depot: `BuildingDef.repairs` → `depotTick`.

