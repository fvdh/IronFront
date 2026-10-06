# Changelog

## Unreleased (Fun Pass 1.4, in progress)

- **Defeat rule:** you are out when you have no buildings left and no Base Crawler. Units alone no longer keep you in the game (a lone airship nobody could reach used to stall it forever).
- **Anti-air vs heavy aircraft:** Psi Spinner Tank and Gatling Cannon, and Red Bloc Flak Gunner and Flak Hauler now properly damage the Thunderhead Airship; their ground fight is unchanged.
- **AI remembers and searches:** the AI keeps track of what it has seen, checks old sightings with a scout and searches the map in a fixed order when it loses track of you. Moving your base no longer hides you.
- Measuring: match export also records Fuel Rig income and free units; new metric for harassment cost.

## 1.3.0 — 2026-10-06

Balance round for units (`plan/balans-plan.md`, numbers in `docs/TODO.md`).

- **Mind control charges first**: a visible beam for 1 s plus 0.5 s per 500 credits of the target; walk away or kill the controller to stop it; leaving range even briefly restarts the beam, and a warning with a radar ping tells you when one starts on your units. Drones and other mind-controllers are immune. Mentalist and Hivemind retuned.
- **The Oracle** takes buildings only from close by, after a 5-second beam that breaks when she is hit; Construction Yards and superweapons are immune. Psi Storm is smaller and recharges slower.
- **Nova's C4** is a time bomb with a 3-second fuse; a Construction Yard or superweapon takes two charges (superweapons now have 1500 health).
- **Grom** calls air strikes less often and from closer by. Heroes and elite units only heal out of combat.
- **Leech Drone** burns out after 20 seconds inside a vehicle. Longbow Launcher and Lash Tank toned down; Phase Trooper, Magnetar, Blight Trooper, Shroud Tank and Sapper made worth building.
- New balance lab: equal-budget duel matrix and scenario tests (`DUELS=1 npx vitest run duels`).
- **Match telemetry** (Fun Pass phase 20, `plan/fun-pass-plan.md`): every game records snapshots, events and decisions without changing the game (checked by a test). **Export match data** on the score screen saves it as JSON; it stays on your computer. Measuring tools: `tools/nulmeting.sh`, `tools/tijdlijn.html`, a sea duel matrix and regression scenarios.

## 1.2.0 — 2026-10-02

UX redesign "Command Console" (`plan/ux-plan.md`, phases 14–19).

- **English everywhere**: UI, tooltips, tutorial, unit and building descriptions. The hero De Orakel is now The Oracle.
- **Faction console HUD**: the sidebar is built from faction-specific metal (Allied steel, Red Bloc oxide red, Psi violet) with a crest and rolling credits counter, radar shutters, a vertical power rail, icon tabs (new Defense tab) and cameos with a clock wipe and visible states (building, queued, on hold, ready, locked, too expensive).
- **On hold**: right-click a cameo to pause production, left-click to resume, right-click again to cancel with a refund.
- **Superweapon clocks** for your own and every enemy superweapon, top left.
- **Command bar** at the bottom of the map with portrait, segmented health and orders with hotkeys.
- **Tablets**: the sidebar becomes a drawer, a Select / Order switch replaces the right button, drag pans, pinch zooms, long-press drag box-selects.
- **Announcers and unit voices**: AEGIS (Allied), KOMMAND (Red Bloc) and CHOIR (Psi), 70 lines each, plus spoken answers from units and the three heroes. Generated offline with Piper TTS from public-domain voice models. Lines are queued by priority and never talk over each other; the music dips while the announcer speaks.
- **Alerts**: red pings on the radar where you are hit, Space jumps to the latest alert (pause is now P only), a message log in the top bar, screen shake for superweapons (off with reduced motion).
- **Fonts**: Barlow Condensed, Barlow and Share Tech Mono (OFL), self-hosted.
- **Battlefield readability**: corner brackets around selected vehicles and buildings, segmented health pips (enemy bars are striped), control group numbers, fading order lines, context cursors (move, attack, cannot move, enter, capture, repair, sell, deploy, target, scroll arrows), a per-cell placement grid with defence range and build-area outline, dimmed buildings with a bolt and OFFLINE under low power, a team-colour rally flag, "+$" over the refinery, a wrench on repairing buildings, dust behind vehicles and a soft map border.
- **Shell**: a main menu over a live AI-vs-AI battle, a lobby with a row per player (faction, AI level and colour per opponent, up to three) and a preview of the real map with start positions, a briefing while the game loads (map, opponents, real load steps, tips), and a score screen with counting tallies, per-player scores and a rank. All panels use the console style.
- **Options and accessibility**: subtitles on/off, interface size 90–125 %, reduce motion (on top of the system setting), a colour-blind palette (Okabe-Ito player colours; blue/yellow/vermillion health; order lines that stay apart with red-green blindness), grouped into Sound, Display and Controls. Text colours meet WCAG AA on every faction theme (checked by a test).
- **Faster start**: the briefing appears before sprite baking begins; with the live menu battle behind it, shared art is already baked.
- **Camera**: hold the right mouse button and drag to scroll the map (a right click without dragging still gives an order). Edge scrolling now also works under the top bar and at the window edge over the sidebar, and it ramps up and eases out instead of jerking at a fixed speed.

## 1.1.0 — 2026-10-01

Large expansion on top of 1.0.0-rc.1 (phases 7–13 in `plan/uitbreidingsplan.md`; per-phase notes in `docs/TODO.md`).

- **Abilities** (E key / panel button), transports and garrisons, walls (drag to place), airfields with rearming aircraft.
- **Infantry and heroes**: Nova, Grom and De Orakel (one each), plus Phase Trooper, Skyjumper, Infiltrator, Sapper, Blight Trooper, Flak Gunner and Toxin Sniper.
- **Vehicles and air**: IFV with passenger weapons, Shroud Tank, Talon jet, Siege Rotor, Leech Drone, Hivemind, Delirium Drone, Thrall Hauler, Amphibious Transport.
- **Map**: civilians with garrisonable towns, capturable tech buildings, destructible bridges with repair huts, bonus crates, new *Inland Sea* and *Archipelago* maps with harbours.
- **Navy**: Naval Yard on water and 9 ships, including stealth submarines with sonar detection and the Kraken's grab. Nova can swim.
- **Superweapons** (on by default, can be switched off in setup): Phase Gate, Storm Engine, Hammer Silo, Stasis Projector, Dominion Engine, Mutagen Spire. Plus Assembly Plant, Duplicator Vats, Reclaimer, Psi Beacon and Arc Coil charging.
- **AI**: uses navy, superweapons, engineers (tech buildings, bridges), garrisons, area abilities and an amphibious ferry when there is no land route.
- **Balance**: tuned with equal-budget duels and 100+ AI-vs-AI games per round. Factions win about equally often, with no seat bias.
- **Art**: all new models are original or procedural, built from verified CC0 parts (see `docs/asset-register.md`).
