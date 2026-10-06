# Duelmatrix (2026-10-02)

Twee legers met hetzelfde budget (3000; met een held: de prijs van de held) op open grasland, attack-move op elkaar, max 90 s.
Efficiëntie = waarde die de tegenstander verloor / waarde die jij verloor. 1 = gelijk; > 1 = jij wint de ruil.
Gemiddelden zijn geometrisch en afgekapt op ×8 en ×⅛ (een unit die de ander niet eens kan raken telt als ×8, niet als ×3000).
Kolommen Inf/Voert/Lucht: gemiddeld tegen tegenstanders van die soort. Counters = tegenstanders waartegen het onder 0,5 ligt.
Abilities (E) worden niet gebruikt; helden en mind control gedragen zich zoals de AI ze inzet.

| Unit | Kosten | Gemiddeld | Inf | Voert | Lucht | Counters | Beste ruil | Slechtste ruil |
|---|---:|---:|---:|---:|---:|---:|---|---|
| Thunderhead Airship (`airship`) | 2000 | 4.45 | 6.88 | 7.16 | 0.29 | 3/35 | prism ≥8, heavy ≥8, hivemind ≥8 | disc ≤⅛, skyjumper ≤⅛, jet ≤⅛ |
| Hover Disc (`disc`) | 1500 | 4.35 | 5.12 | 3.54 | 4.90 | 6/35 | airship ≥8, prism ≥8, talon ≥8 | rocket 0.20, ifv 0.35, gatling 0.36 |
| Talon Strike Jet (`talon`) | 1200 | 4.06 | 6.27 | 6.36 | 0.29 | 3/35 | prism ≥8, hivemind ≥8, tank_soviets ≥8 | skyjumper ≤⅛, disc ≤⅛, jet ≤⅛ |
| Skyjumper (`skyjumper`) | 600 | 3.94 | 5.38 | 2.93 | 3.79 | 6/35 | prism ≥8, talon ≥8, heavy ≥8 | flakgunner ≤⅛, jeep ≤⅛, flakhauler ≤⅛ |
| Kestrel VTOL (`jet`) | 1200 | 3.02 | 3.04 | 3.29 | 2.28 | 8/35 | prism ≥8, phasetrooper ≥8, artillery ≥8 | flakgunner ≤⅛, rocket 0.13, flakhauler 0.24 |
| Siege Rotor (`siegerotor`) | 1100 | 2.93 | 5.46 | 3.42 | 0.29 | 8/35 | prism ≥8, heavy ≥8, hivemind ≥8 | skyjumper ≤⅛, disc ≤⅛, jet ≤⅛ |
| Hivemind (`hivemind`) | 1750 | 1.87 | 2.51 | 4.34 | ≤⅛ | 9/35 | dog ≥8, arc ≥8, brute ≥8 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Longbow Launcher (`artillery`) | 900 | 1.86 | 3.91 | 2.68 | ≤⅛ | 6/35 | mentalist ≥8, brute ≥8, phasetrooper ≥8 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Lash Tank (`tank_psi`) | 750 | 1.50 | 3.15 | 1.95 | ≤⅛ | 8/35 | dog ≥8, phasetrooper ≥8, nova ≥8 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Colossus Tank (`heavy`) | 1750 | 1.37 | 2.11 | 2.39 | ≤⅛ | 10/35 | dog ≥8, phasetrooper ≥8, nova ≥8 | siegerotor ≤⅛, skyjumper ≤⅛, disc ≤⅛ |
| Anvil Heavy Tank (`tank_soviets`) | 850 | 1.25 | 1.96 | 2.09 | ≤⅛ | 10/35 | dog ≥8, phasetrooper ≥8, nova ≥8 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Attack Dog (`dog`) | 200 | 1.12 | 2.63 | 1.21 | ≤⅛ | 12/35 | phasetrooper ≥8, magnetar ≥8, ifv ≥8 | hivemind ≤⅛, siegerotor ≤⅛, toxin ≤⅛ |
| Refractor Tank (`prism`) | 1200 | 1.11 | 2.90 | 1.01 | ≤⅛ | 10/35 | mentalist ≥8, arc ≥8, phasetrooper ≥8 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| The Oracle (`oracle`) | 1800 | 1.07 | 0.86 | 2.73 | 0.18 | 12/35 | tank_allies ≥8, arc ≥8, brute ≥8 | siegerotor ≤⅛, talon ≤⅛, toxin ≤⅛ |
| Rocket Trooper (`rocket`) | 300 | 1.07 | 0.52 | 1.54 | 2.33 | 12/35 | magnetar ≥8, phasetrooper ≥8, sapper ≥8 | toxin ≤⅛, dog 0.16, initiate 0.18 |
| Mentalist (`mentalist`) | 800 | 1.07 | 1.38 | 1.97 | ≤⅛ | 12/35 | hivemind ≥8, arc ≥8, brute ≥8 | siegerotor ≤⅛, talon ≤⅛, toxin ≤⅛ |
| Flak Hauler (`flakhauler`) | 600 | 1.05 | 1.56 | 0.58 | 1.54 | 10/35 | phasetrooper ≥8, nova ≥8, skyjumper ≥8 | hivemind ≤⅛, heavy ≤⅛, tank_soviets ≤⅛ |
| Warden Tank (`tank_allies`) | 700 | 1.05 | 1.54 | 1.72 | ≤⅛ | 13/35 | dog ≥8, phasetrooper ≥8, nova ≥8 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Mauler (`brute`) | 500 | 1.04 | 1.70 | 1.53 | ≤⅛ | 11/35 | phasetrooper ≥8, nova ≥8, toxin 7.31 | hivemind ≤⅛, siegerotor ≤⅛, talon ≤⅛ |
| Scout Jeep (`jeep`) | 500 | 0.97 | 1.76 | 0.46 | 1.26 | 11/35 | phasetrooper ≥8, nova ≥8, oracle ≥8 | hivemind ≤⅛, tank_psi ≤⅛, heavy ≤⅛ |
| Flak Gunner (`flakgunner`) | 300 | 0.97 | 1.29 | 0.61 | 1.52 | 13/35 | phasetrooper ≥8, sapper ≥8, skyjumper ≥8 | toxin ≤⅛, tank_psi ≤⅛, airship ≤⅛ |
| Spinner Tank (`gatling`) | 650 | 0.95 | 1.30 | 0.57 | 1.41 | 12/35 | phasetrooper ≥8, nova ≥8, skyjumper 6.01 | hivemind ≤⅛, tank_psi ≤⅛, heavy ≤⅛ |
| Adept (`initiate`) | 200 | 0.79 | 1.20 | 1.13 | ≤⅛ | 11/35 | phasetrooper ≥8, sapper ≥8, magnetar ≥8 | siegerotor ≤⅛, toxin ≤⅛, skyjumper ≤⅛ |
| Lancer IFV (`ifv`) | 600 | 0.77 | 0.56 | 0.80 | 1.53 | 17/35 | nova ≥8, leechdrone 4.99, jet 3.54 | dog ≤⅛, initiate 0.20, rifle 0.20 |
| Arc Trooper (`arc`) | 500 | 0.75 | 1.27 | 0.94 | ≤⅛ | 12/35 | phasetrooper ≥8, nova ≥8, blight 5.58 | hivemind ≤⅛, siegerotor ≤⅛, talon ≤⅛ |
| Toxin Sniper (`toxin`) | 600 | 0.69 | 4.62 | 0.24 | ≤⅛ | 20/35 | mentalist ≥8, rifle ≥8, rocket ≥8 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Grom (`grom`) | 1500 | 0.69 | 0.99 | 0.86 | 0.18 | 19/35 | oracle ≥8, hivemind ≥8, mentalist ≥8 | siegerotor ≤⅛, talon ≤⅛, toxin ≤⅛ |
| Rifleman (`rifle`) | 200 | 0.62 | 1.00 | 0.76 | ≤⅛ | 16/35 | phasetrooper ≥8, magnetar ≥8, shroudtank 6.04 | siegerotor ≤⅛, toxin ≤⅛, skyjumper ≤⅛ |
| Delirium Drone (`deliriumdrone`) | 900 | 0.56 | 0.76 | 0.77 | ≤⅛ | 12/35 | nova ≥8, leechdrone 3.33, tank_soviets 1.89 | hivemind ≤⅛, siegerotor ≤⅛, talon ≤⅛ |
| Leech Drone (`leechdrone`) | 500 | 0.47 | 1.26 | 0.29 | ≤⅛ | 20/35 | phasetrooper ≥8, nova ≥8, toxin 3.67 | hivemind ≤⅛, siegerotor ≤⅛, talon ≤⅛ |
| Sapper (`sapper`) | 600 | 0.43 | 0.44 | 0.69 | ≤⅛ | 14/35 | magnetar 2.68, phasetrooper 1.67, gatling 1.08 | siegerotor ≤⅛, talon ≤⅛, toxin ≤⅛ |
| Nova (`nova`) | 1500 | 0.40 | 1.66 | 0.14 | 0.18 | 22/35 | sapper ≥8, oracle ≥8, mentalist ≥8 | siegerotor ≤⅛, leechdrone ≤⅛, talon ≤⅛ |
| Shroud Tank (`shroudtank`) | 1000 | 0.36 | 0.41 | 0.48 | ≤⅛ | 25/35 | nova ≥8, leechdrone 3.00, toxin 1.59 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Blight Trooper (`blight`) | 600 | 0.27 | 0.39 | 0.26 | ≤⅛ | 27/35 | phasetrooper ≥8, magnetar 4.92, rocket 2.06 | siegerotor ≤⅛, talon ≤⅛, toxin ≤⅛ |
| Magnetar (`magnetar`) | 1300 | 0.26 | 0.23 | 0.39 | ≤⅛ | 31/35 | nova ≥8, leechdrone 2.31, deliriumdrone 0.69 | siegerotor ≤⅛, talon ≤⅛, skyjumper ≤⅛ |
| Phase Trooper (`phasetrooper`) | 1500 | 0.17 | 0.14 | 0.24 | ≤⅛ | 30/35 | magnetar 5.11, deliriumdrone 1.38, shroudtank 1.12 | hivemind ≤⅛, siegerotor ≤⅛, leechdrone ≤⅛ |

## Scenario's

| Scenario | Doel | Uitkomst | |
|---|---|---|---|
| nova alone vs soviets base | CY survives 120 s | CY survives, hero dead | ✓ |
| nova alone vs psi base | CY survives 120 s | CY survives, hero dead | ✓ |
| nova + 1500 tanks vs soviets base | CY falls after 20–120 s | CY lost after 7s | ✗ |
| grom alone vs allies base | CY survives 120 s | CY survives, hero dead | ✓ |
| grom alone vs psi base | CY survives 120 s | CY survives, hero dead | ✓ |
| grom + 1500 tanks vs allies base | CY falls after 20–120 s | CY lost after 12s | ✗ |
| oracle alone vs allies base | CY survives 120 s | CY lost after 5s, hero alive | ✗ |
| oracle alone vs soviets base | CY survives 120 s | CY lost after 5s, hero alive | ✗ |
| oracle + 1500 tanks vs allies base | CY falls after 20–120 s | CY lost after 5s | ✗ |
| 2× mentalist (budget) vs tank_allies | efficiency 0.6–1.6 | efficiency 5.37 in 5s | ✗ |
| 2× mentalist (budget) vs tank_soviets | efficiency 0.6–1.6 | efficiency 4.30 in 5s | ✗ |
| 2× mentalist (budget) vs heavy | efficiency 0.6–1.6 | efficiency 4.37 in 5s | ✗ |
| 1× hivemind (budget) vs tank_allies | efficiency 0.6–1.6 | efficiency 12.85 in 5s | ✗ |
| 1× hivemind (budget) vs tank_soviets | efficiency 0.6–1.6 | efficiency 5.16 in 5s | ✗ |
| 1× hivemind (budget) vs heavy | efficiency 0.6–1.6 | efficiency 5.87 in 5s | ✗ |
| Leech Drone vs Colossus (no depot, 60 s) | Colossus survives | Colossus eaten | ✗ |
| Nova vs Riflemen (1500) | Nova wins, but hurt (left < 85 %) | Nova 52 % left, riflemen 0 % | ✓ |

_630 duels in 6 s._
