# Roster: rechtvaardiging per eenheid en gebouw (fase 22.1)

Status: **concept, voorbereid 2026-10-06**. Hoort bij `plan/fun-pass-plan.md` fase 22. Vul na playtest-ronde 1 en de besluiten van fase 22 aan.

**Wat er al in staat (uit data):** rol (eerste zin van de beschrijving in het spel), kosten, kandidaat-uitzonderingsregels (uit de eigenschappen in `units.ts`/`buildings.ts`), gebruik door de AI en kosteneffectiviteit.
**Wat nog leeg is:** *Factiezin* (pas na de kernzin, beslissing 1–3), *Gebruik (mens)* (ronde 1), *Besluit* (fase 22). De kolom *Regels* is een **automatisch voorstel**: het tellen van uitzonderingsregels (22.2) gebeurt door twee personen onafhankelijk.

Bronnen: AI-gebruik = alle potjes van `ref-26a` (land, zee, Normal-medium; AI-versie 2), *gebouwd* telt gratis eenheden niet mee, *kosten-eff.* = vernietigde waarde / eigen waarde. *Duel* = gemiddelde in de duelmatrix `ref-26a-duels` (land) of `-zee` (schepen), band 0,8–1,25.

## Allies

### Eenheden

| Eenheid | Rol | Kosten | Regels (voorstel) | AI gebouwd | AI kosten-eff. | Duel | Factiezin | Gebruik (mens) | Overlap / opmerking | Besluit |
|---|---|---:|---|---:|---:|---:|---|---|---|---|
| Rocket Trooper (`rocket`) | Anti-tank infantry with a rocket launcher | 300 | – | 262 | 2.03 | 1.18 |  |  |  |  |
| Skyjumper (`skyjumper`) | Jetpack infantry: flies over everything | 600 | lucht | 8 | 0.55 | 3.94 |  |  |  |  |
| Infiltrator (`infiltrator`) | Spy: the enemy sees him as their own infantry (dogs don't) | 1000 | vermomming, infiltreert | 0 | – | – |  |  |  |  |
| Phase Trooper (`phasetrooper`) | Teleports instead of walking | 1000 | teleport | 7 | 0.07 | 0.35 |  |  |  |  |
| Nova (`nova`) | Hero | 1500 | herstelt, limiet, held | 1 | 4.93 | 0.34 |  |  |  |  |
| Lancer IFV (`ifv`) | Fast rocket-armed fighting vehicle | 600 | ability, passagierswapen, transport | 279 | 1.16 | 0.77 |  |  | schrapkandidaat 22.3: passagierswapen |  |
| Sonar Drone (`sonardrone`) | Fast sea drone: sonic pulse against ships and subs, detects subs and shakes a Kraken off its prey | 600 | drone, detectie | 0 | – | 0.45 |  |  |  |  |
| Warden Tank (`tank_allies`) | Fast, versatile battle tank | 700 | – | 656 | 2.37 | 1.03 |  |  |  |  |
| Shroud Tank (`shroudtank`) | When stationary and holding fire, the enemy sees a tree (dogs don't) | 900 | imiteert | 19 | 1.70 | 0.47 |  |  |  |  |
| Picket Destroyer (`destroyer`) | Cannon against ships and shore, depth charges against subs | 1000 | detectie | 0 | – | 2.08 |  |  |  |  |
| Refractor Tank (`prism`) | Long-range light beam with splash damage | 1200 | – | 98 | 0.93 | 1.00 |  |  |  |  |
| Kestrel VTOL (`jet`) | Fast attack aircraft with 3 missile salvos, hits ground and air targets | 1200 | lucht, munitie/herladen | 0 | – | 3.02 |  |  |  |  |
| Talon Strike Jet (`talon`) | Fast bomber: one heavy precision bomb, then back to the Airfield | 1200 | lucht, munitie/herladen | 0 | – | 4.06 |  |  |  |  |
| Bastion Cruiser (`cruiser`) | Floating anti-air shield: long-range missiles | 1200 | – | 0 | – | 0.16 |  |  |  |  |
| Skyhaven Carrier (`carrier`) | Launches long-range combat drones at land and sea targets | 2000 | – | 0 | – | 0.69 |  |  |  |  |

### Gebouwen

| Gebouw | Rol | Kosten | Regels (voorstel) | Factiezin | Gebruik (mens) | Overlap / opmerking | Besluit |
|---|---|---:|---|---|---|---|---|
| Pillbox (`pillbox`) | Concrete machine-gun bunker against infantry | 500 | – |  |  |  |  |
| Skyguard SAM (`samsite`) | Long-range anti-air missiles | 900 | – |  |  |  |  |
| Airfield (`airfield`) | Four landing pads | 1000 | landingsplatforms |  |  |  |  |
| Refractor Tower (`prismtower`) | Long-range light beam with splash damage | 1500 | – |  |  |  |  |
| Phase Gate (`phasegate`) | Superweapon: teleports a group of vehicles across the map | 2500 | superwapen, limiet |  |  |  |  |
| Storm Engine (`stormengine`) | Superweapon: lightning storm over an area | 5000 | superwapen, limiet |  |  |  |  |

## Red Bloc

### Eenheden

| Eenheid | Rol | Kosten | Regels (voorstel) | AI gebouwd | AI kosten-eff. | Duel | Factiezin | Gebruik (mens) | Overlap / opmerking | Besluit |
|---|---|---:|---|---:|---:|---:|---|---|---|---|
| Flak Gunner (`flakgunner`) | Anti-air infantry | 300 | – | 26 | 1.29 | 1.02 |  |  |  |  |
| Blight Trooper (`blight`) | Radiation rifle against infantry | 450 | ability | 4 | 0.28 | 0.52 |  |  |  |  |
| Arc Trooper (`arc`) | Armored infantry with a short-range electric discharge | 500 | – | 66 | 1.39 | 0.97 |  |  |  |  |
| Sapper (`sapper`) | Plants a time bomb on units or buildings | 600 | – | 5 | 1.38 | 0.51 |  |  |  |  |
| Grom (`grom`) | Hero | 1500 | herstelt, limiet, held | 2 | 0.28 | 0.60 |  |  |  |  |
| Scout Jeep (`jeep`) | Fast scout with a machine gun | 500 | – | 154 | 0.49 | 0.91 |  |  |  |  |
| Leech Drone (`leechdrone`) | Fast spider bot: kills infantry and crawls into vehicles, eating them from within for 20 seconds | 500 | drone | 50 | 0.00 | 0.55 |  |  | schrapkandidaat 22.3 (gotcha) |  |
| Flak Hauler (`flakhauler`) | Tracked anti-air | 600 | ability, transport | 18 | 0.37 | 1.09 |  |  |  |  |
| Flak Boat (`flakboat`) | Fast anti-air patrol boat, also good against infantry on the shore | 600 | detectie | 0 | – | 0.43 |  |  |  |  |
| Anvil Heavy Tank (`tank_soviets`) | Heavily armored twin-barrel tank | 850 | – | 501 | 2.04 | 1.40 |  |  |  |  |
| Longbow Launcher (`artillery`) | Rocket artillery with huge range and splash damage | 900 | – | 54 | 2.38 | 1.31 |  |  |  |  |
| Barracuda Sub (`barracuda`) | Submarine: invisible underwater until it fires | 1000 | camouflage | 3 | 0.00 | 3.08 |  |  |  |  |
| Kraken (`kraken`) | Invisible sea monster: grabs a ship and crushes it | 1000 | camouflage | 1 | 0.00 | 3.46 |  |  |  |  |
| Siege Rotor (`siegerotor`) | Helicopter with a machine gun against ground troops | 1100 | lucht, ability, ontplooid wapen | 27 | 0.70 | 2.93 |  |  | schrapkandidaat 22.3 (overlap Longbow) |  |
| Colossus Tank (`heavy`) | Super-heavy twin-cannon tank | 1750 | herstelt | 49 | 2.70 | 1.38 |  |  |  |  |
| Thunderhead Airship (`airship`) | Slow, heavily armored airship that drops devastating bombs on whatever is below | 2000 | lucht | 25 | 3.52 | 4.45 |  |  |  |  |
| Leviathan (`leviathan`) | Missile ship: heavy, very long-range missiles against land and sea targets | 2000 | – | 0 | – | 0.74 |  |  |  |  |

### Gebouwen

| Gebouw | Rol | Kosten | Regels (voorstel) | Factiezin | Gebruik (mens) | Overlap / opmerking | Besluit |
|---|---|---:|---|---|---|---|---|
| Sentry Gun (`tower`) | Rapid-fire cannon against infantry and light vehicles | 600 | – |  |  |  |  |
| Flak Battery (`flakbattery`) | Anti-air flak with splash damage | 900 | – |  |  |  |  |
| Arc Coil (`coil`) | Heavy electric discharge, destroys anything up close | 1500 | – |  |  |  |  |
| Assembly Plant (`assembly`) | Vehicles (and ships) cost 25% less and build 25% faster | 2000 | korting, limiet |  |  |  |  |
| Stasis Projector (`stasis`) | Superweapon: 20 seconds of invulnerability for vehicles and buildings | 2500 | superwapen, limiet |  |  |  |  |
| Hammer Silo (`hammersilo`) | Superweapon: heavy missile with radiation | 5000 | superwapen, limiet |  |  |  |  |

## Psi

### Eenheden

| Eenheid | Rol | Kosten | Regels (voorstel) | AI gebouwd | AI kosten-eff. | Duel | Factiezin | Gebruik (mens) | Overlap / opmerking | Besluit |
|---|---|---:|---|---:|---:|---:|---|---|---|---|
| Thrall (`thrall`) | Thrall Hauler slave: mines ore while its hauler is deployed | 0 | oogst, onzichtbaar | 0 | – | – |  |  |  |  |
| Adept (`initiate`) | Basic infantry with a psionic discharge | 200 | – | 253 | 0.95 | 0.89 |  |  |  |  |
| Mauler (`brute`) | Mutated powerhouse | 500 | – | 224 | 1.70 | 1.31 |  |  |  |  |
| Toxin Sniper (`toxin`) | Long-range sniper against infantry | 600 | – | 14 | 0.13 | 0.65 |  |  |  |  |
| Mentalist (`mentalist`) | Mind-controls one enemy unit after a short beam (longer for expensive units; machines are immune) | 800 | ability | 16 | 0.05 | 0.30 |  |  |  |  |
| The Oracle (`oracle`) | Hero | 1800 | ability, herstelt, limiet, held | 1 | 0.00 | 0.35 |  |  |  |  |
| Spinner Tank (`gatling`) | Gatling cannon that fires faster the longer it keeps shooting | 650 | – | 204 | 1.00 | 1.03 |  |  |  |  |
| Lash Tank (`tank_psi`) | Psionic beam | 750 | – | 488 | 2.45 | 1.57 |  |  |  |  |
| Delirium Drone (`deliriumdrone`) | Gas cloud: affected enemies go delirious and attack everything nearby for 10 seconds, including their own troops | 900 | drone | 19 | 0.00 | 0.79 |  |  | schrapkandidaat 22.3 (tweede controlesysteem naast mind control) |  |
| Magnetar (`magnetar`) | Long-range magnetic beam, devastating against vehicles and buildings | 1300 | – | 37 | 3.20 | 0.43 |  |  |  |  |
| Psi Submarine (`psisub`) | Submarine with missiles against land and torpedoes against ships | 1400 | camouflage | 2 | 0.00 | 2.84 |  |  |  |  |
| Hover Disc (`disc`) | Hovering laser disc, hits ground and air targets | 1500 | lucht | 11 | 4.56 | 4.35 |  |  | schrapkandidaat 22.3: diefstal (laser blijft) |  |
| Thrall Hauler (`thrallhauler`) | Psi harvester with 3 Thralls | 1500 | ability, escort, oogst | 157 | 0.00 | – |  |  |  |  |
| Hivemind (`hivemind`) | Controls up to 3 units at once, each after a short beam | 1750 | – | 6 | 0.00 | 0.91 |  |  |  |  |

### Gebouwen

| Gebouw | Rol | Kosten | Regels (voorstel) | Factiezin | Gebruik (mens) | Overlap / opmerking | Besluit |
|---|---|---:|---|---|---|---|---|
| Gatling Cannon (`gatlingtower`) | Spins up: fires faster and faster | 1000 | – |  |  |  |  |
| Psi Beacon (`psibeacon`) | Shows enemy units' attack targets on the minimap and reveals subs and spies within 10 tiles | 1000 | detectie |  |  |  |  |
| Reclaimer (`reclaimer`) | Right-click the Reclaimer with your own (or captured) ground units: they are recycled for half their cost | 1200 | recyclet |  |  | schrapkandidaat 22.3 |  |
| Psi Spire (`psispire`) | Psionic beam against vehicles | 1500 | – |  |  |  |  |
| Mutagen Spire (`mutagen`) | Superweapon: turns enemy infantry into Maulers for you | 2500 | superwapen, limiet |  |  | schrapkandidaat 22.3 (overlap Dominion Engine) |  |
| Duplicator Vats (`vats`) | Every infantry trained comes out of the barracks twice (not heroes) | 2500 | dupliceert, limiet |  |  | schrapkandidaat 22.3 (economie-uitzondering) |  |
| Dominion Engine (`dominion`) | Superweapon: permanently takes over everything in an area | 5000 | superwapen, limiet |  |  |  |  |

## Gedeeld (alle facties of meerdere)

| Naam | Soort | Rol | Kosten | Facties | AI gebouwd | Duel | Besluit |
|---|---|---|---:|---|---:|---:|---|
| Rifleman (`rifle`) | eenheid | Cheap basic infantry | 200 | Allies, Red Bloc | 738 | 0.70 |  |
| Attack Dog (`dog`) | eenheid | Fast | 200 | Allies, Red Bloc | 0 | 1.17 |  |
| Engineer (`engineer`) | eenheid | Captures enemy buildings or fully repairs your own (right-click the building) | 500 | Allies, Red Bloc, Psi | 161 | – |  |
| Amphibious Transport (`amphib`) | eenheid | Sails and drives: carries 8 infantry over land and water | 900 | Allies, Red Bloc, Psi | 0 | – |  |
| Ore Hauler (`miner`) | eenheid | Gathers ore automatically and hauls it to the refinery | 1400 | Allies, Red Bloc | 311 | – |  |
| Base Crawler (`mcv`) | eenheid | Mobile construction yard | 3000 | Allies, Red Bloc, Psi | 0 | – |  |
| Wall (`wall`) | gebouw | Wall | 100 | Allies, Red Bloc, Psi | – | – |  |
| Barracks (`barracks`) | gebouw | Trains infantry | 500 | Allies, Red Bloc, Psi | – | – |  |
| Power Plant (`power`) | gebouw | Provides 100 power | 800 | Allies, Red Bloc, Psi | – | – |  |
| Repair Depot (`depot`) | gebouw | Repairs adjacent friendly vehicles (costs credits) | 800 | Allies, Red Bloc, Psi | – | – |  |
| Radar Array (`radar`) | gebouw | Enables the minimap (with enough power) | 1000 | Allies, Red Bloc, Psi | – | – |  |
| Naval Yard (`navalyard`) | gebouw | Built on open water | 1000 | Allies, Red Bloc, Psi | – | – |  |
| Ore Refinery (`refinery`) | gebouw | Processes ore into credits | 2000 | Allies, Red Bloc, Psi | – | – |  |
| War Factory (`factory`) | gebouw | Builds vehicles | 2000 | Allies, Red Bloc, Psi | – | – |  |
| Tech Center (`lab`) | gebouw | Unlocks your faction's most advanced units | 2000 | Allies, Red Bloc, Psi | – | – |  |
| Construction Yard (`cy`) | gebouw | Heart of the base | 3000 | Allies, Red Bloc, Psi | – | – |  |

## Neutraal (kaart)

| Naam | Rol |
|---|---|
| House (`civhouse`) | Civilian house |
| Office Block (`civoffice`) | Office building |
| Town Hall (`civhall`) | Town hall |
| Farmhouse (`civfarm`) | Farmhouse |
| Fuel Rig (`techrig`) | Tech building |
| Field Hospital (`hospital`) | Tech building |
| Machine Shop (`machineshop`) | Tech building |
| Outpost (`outpost`) | Tech building |
| Bridge Repair Hut (`bridgehut`) | Send an Engineer here to rebuild the destroyed bridge next to it |
| Bridge (`bridge`) | Bridge |

## Nog niet ingevuld

- **Bonuskratten** (22.3: standaard uit in de lobby?) en **IFV-passagierswapen** staan als regel bij de Lancer IFV.
- **Complexiteitsbudget (22.2)**: Allies ≤ 6, Red Bloc ≤ 6, Psi ≤ 8 regels. Telling door twee personen; het resultaat komt hier.
