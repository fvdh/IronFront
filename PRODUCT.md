# Product

## Register

product

## Users
Players who grew up with the late-90s/early-00s isometric RTS genre (Red Alert 2 / Yuri's Revenge era) and want that feel back in a browser. They play 15–40 minute skirmishes against the AI, on a large monitor with mouse and keyboard or on a tablet with touch, usually in the evening in a dim room. During a match they are under pressure: managing a base, an economy and an army at once, with their eyes mostly on the battlefield.

## Product Purpose
Iron Front is an original, open-licensed browser RTS that delivers the C&C genre feel: build from a sidebar, harvest ore, three asymmetric factions, superweapons. Success means a genre player recognises the rhythm within seconds (cameo click, "Construction complete", place, "Unit ready") without anything being copied from EA/Westwood.

## Brand Personality
Heavy, militaristic, theatrical. The interface is an army command console: metal, rivets, warning lights, a commanding announcer voice. Every faction feels different in the hand. Confident and direct, with a wink of B-movie bravado, never comical or cartoony.

## Anti-references
- Flat SaaS dark mode (gray cards, one gold accent): what v1.1 looks like now.
- Mobile-game UI: glossy buttons, loot-box glow, rounded candy shapes.
- Esports/"gamer" neon on black, Chakra Petch-style sci-fi fonts, RGB.
- Literal copies of RA2/C&C: sidebar artwork, logos, EVA samples, faction emblems. Genre language yes, imitation no (see plan/assets.md).
- Red Cross emblem, anywhere.

## Design Principles
1. **The battlefield speaks.** Every important event comes in through three channels: voice, sound and image. The player never has to read text to know what happened.
2. **The faction is the frame.** The UI chrome *is* the faction identity; Allied, Red Bloc and Psi feel different in material, colour and sound.
3. **Genre muscle memory over innovation.** Sidebar on the right, cameos with countdown wipe, radar at the top, credits counting up: keep the familiar rhythm and make it sharper.
4. **Weight in every click.** Buttons press, counters tick, cameos flash. Feedback is mechanical and physical, never floaty.
5. **Readable under pressure.** Health, power, threats and readiness can be read at a glance, at 1x on a large monitor and on a tablet.

## Accessibility & Inclusion
- WCAG AA contrast for all text and status information on the chrome.
- Team and status colours never carry meaning alone: add shape/icon/pattern (colour-blind safe).
- Announcer messages also appear as text (subtitle log); separate volume sliders for voice/sfx/music.
- `prefers-reduced-motion`: no screen shake, no flashing; blinking replaced by steady highlight.
- Touch targets ≥ 44 px on tablet; everything also reachable by keyboard shortcut on desktop.
