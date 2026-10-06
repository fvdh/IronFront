// Third-party asset credits, shown in-game (Credits screen). Keep in sync with docs/asset-register.md
// and public/assets/licenses/CREDITS.txt. CC-BY entries need title, author, source URL, licence and changes.
export type CreditLicense = 'CC0 1.0' | 'CC-BY 3.0' | 'CC-BY 4.0' | 'Public domain' | 'SIL OFL 1.1';
export interface Credit {
  what: string;
  title: string;
  author: string;
  /** Author page, when the creator asks to be credited with a link. */
  authorUrl?: string;
  url: string;
  license: CreditLicense;
  /** Changes made (required for CC-BY; optional for CC0). */
  changes?: string;
}

export const LICENSE_URLS: Record<CreditLicense, string> = {
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC-BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC-BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/',
  'SIL OFL 1.1': 'https://openfontlicense.org',
};

export const CREDITS: Credit[] = [
  { what: 'Olive, heavy & brown tanks', title: 'Tank (3 models)', author: 'Quaternius', url: 'https://poly.pizza/u/Quaternius', license: 'CC0 1.0' },
  { what: 'Defence turret', title: 'Turret Cannon', author: 'Quaternius', url: 'https://poly.pizza/m/mNJ6poH7Cp', license: 'CC0 1.0' },
  { what: 'Attack dog', title: 'Dog', author: 'Quaternius', url: 'https://poly.pizza/m/2kUk0QqpCg', license: 'CC0 1.0' },
  { what: 'Lash Tank, Spinner Tank', title: 'Tank', author: 'Zayn', url: 'https://poly.pizza/m/YWSyTmvGI2', license: 'CC-BY 3.0', changes: 'scaled, rotated 180°; for the Spinner Tank combined with Kenney parts and tinted purple' },
  { what: 'Ore Hauler, Longbow Launcher', title: 'Military Truck - 2D/3D Collab', author: 'Alex Safayan', url: 'https://poly.pizza/m/3XAD5t0Djqv', license: 'CC-BY 3.0', changes: 'team color on the canvas cover; rocket rack (Kenney) added for the Longbow Launcher' },
  { what: 'All infantry (animated)', title: 'Soldier', author: 'Quaternius', url: 'https://poly.pizza/m/oAArCNHjFB', license: 'CC-BY 3.0', changes: 'unused animations removed, recolored and given accessories per unit type, animations baked to sprite frames' },
  { what: 'Infantry rifle', title: 'Rifle', author: 'Quaternius', url: 'https://poly.pizza/m/cCAgiMOQow', license: 'CC0 1.0' },
  { what: 'Rocket launcher', title: 'RPG Launcher', author: 'austincford', url: 'https://poly.pizza/m/2qqg9SbrsZ', license: 'CC-BY 3.0', changes: 'scaled, placed in the infantryman\'s hand (also enlarged for the Flak Gunner)' },
  { what: 'Scout jeep', title: 'Jeep', author: 'Zsky', url: 'https://poly.pizza/m/AcSdGGrgYP', license: 'CC-BY 3.0', changes: 'team color' },
  { what: 'Heavy airship', title: 'Blimp', author: 'Poly by Google', url: 'https://poly.pizza/m/45-KKnBcxvE', license: 'CC-BY 3.0', changes: 'scaled, accents recolored to team/faction color' },
  { what: 'Siege Rotor', title: 'Helicopter', author: 'Zsky', url: 'https://poly.pizza/m/hG2Qr0A3zR', license: 'CC-BY 3.0', changes: 'scaled, recolored, team color on accents, gun barrel added under the hull' },
  { what: 'Talon Strike Jet', title: 'Jet', author: 'jeremy', url: 'https://poly.pizza/m/6fyLMORhgGK', license: 'CC-BY 3.0', changes: 'scaled, recolored dark gray, team-colored spine stripe added' },
  { what: 'Hivemind, Delirium Drone', title: 'Brain', author: 'J-Toastie', url: 'https://poly.pizza/m/YihDCHsOPO', license: 'CC-BY 3.0', changes: 'scaled, recolored (lilac brain; yellow-green gas cloud), combined with Kenney vehicles' },
  { what: 'Leech Drone', title: 'Spider', author: 'Quaternius', url: 'https://poly.pizza/m/yRYJiAJyiM', license: 'CC0 1.0' },
  { what: 'Amphibious Transport', title: 'Lifeboat', author: 'Quaternius', url: 'https://poly.pizza/m/Bkd4KKQA4O', license: 'CC0 1.0' },
  { what: 'Barracks, Field Hospital', title: 'Military Tent', author: 'KolosStudios', url: 'https://poly.pizza/m/vQANVbSE0v', license: 'CC-BY 3.0', changes: 'scaled; untextured plain white for the Field Hospital' },
  { what: 'Fuel Rig', title: 'Oil pump', author: 'Poly by Google', url: 'https://poly.pizza/m/fZykGFywa5D', license: 'CC-BY 3.0', changes: 'scaled, placed on a concrete slab next to a storage tank and barrels (Kenney)' },
  { what: 'Town Hall', title: 'Church', author: 'CreativeTrio', url: 'https://poly.pizza/m/GHzPfvoyzX', license: 'CC0 1.0' },
  { what: 'Farmhouse, Bridge Repair Hut, supply crate', title: 'Barn, Storage Shed, Crate', author: 'Quaternius', url: 'https://poly.pizza/u/Quaternius', license: 'CC0 1.0' },
  { what: 'Houses, office block, Machine Shop truck', title: 'City Kit (Suburban), City Kit (Commercial), Car Kit', author: 'Kenney', url: 'https://kenney.nl', license: 'CC0 1.0' },
  { what: 'Base buildings, superweapons, walls, defences, faction vehicles & infantry props', title: 'City Kit (Industrial), Space Kit, Tower Defense Kit', author: 'Kenney', url: 'https://kenney.nl', license: 'CC0 1.0' },
  { what: 'Trees & rocks', title: 'Nature Kit', author: 'Kenney', url: 'https://kenney.nl/assets/nature-kit', license: 'CC0 1.0' },
  { what: 'Explosions & smoke', title: 'Smoke Particles', author: 'Kenney', url: 'https://kenney.nl/assets/smoke-particles', license: 'CC0 1.0' },
  { what: 'Terrain textures', title: 'Grass004, Ground054, Rock051, Asphalt031', author: 'ambientCG', url: 'https://ambientcg.com', license: 'CC0 1.0' },
  { what: 'Music', title: 'Act of War', author: 'Alexandr Zhelanov', authorUrl: 'https://soundcloud.com/alexandr-zhelanov', url: 'https://opengameart.org/content/act-of-war', license: 'CC-BY 3.0', changes: 'converted to AAC' },
  { what: 'Music', title: 'Iron wasteland', author: 'Alexandr Zhelanov', authorUrl: 'https://soundcloud.com/alexandr-zhelanov', url: 'https://opengameart.org/content/iron-wasteland', license: 'CC-BY 4.0', changes: 'converted to AAC' },
  { what: 'Music', title: 'Escape from Metal City', author: 'congusbongus', url: 'https://opengameart.org/content/escape-from-metal-city', license: 'CC0 1.0' },
  { what: 'Gun sounds', title: 'Chaingun, pistol, rifle, shotgun shots', author: 'Sounds (c) by Michel Baradari apollo-music.de', url: 'https://opengameart.org/content/chaingun-pistol-rifle-shotgun-shots', license: 'CC-BY 3.0', changes: 'mono, trimmed, fade-out, normalized' },
  { what: 'Explosion sounds', title: '2 High Quality Explosions', author: 'Sounds (c) by Michel Baradari apollo-music.de', url: 'https://opengameart.org/content/2-high-quality-explosions', license: 'CC-BY 3.0', changes: 'mono, trimmed, fade-out, normalized' },
  { what: 'Rocket launch sound', title: '4 projectile launches', author: 'Sounds (c) by Michel Baradari apollo-music.de', url: 'https://opengameart.org/content/4-projectile-launches', license: 'CC-BY 3.0', changes: 'mono, trimmed, fade-out, normalized' },
  { what: 'Cannon sound', title: 'Cannon fire', author: 'Thimras', url: 'https://opengameart.org/content/cannon-fire', license: 'CC0 1.0' },
  { what: 'Gunshot & explosion sounds', title: '100 CC0 SFX', author: 'rubberduck', url: 'https://opengameart.org/content/100-cc0-sfx', license: 'CC0 1.0' },
  { what: 'Interface, laser, impact & jingle sounds', title: 'Interface Sounds, Sci-fi Sounds, Impact Sounds, Music Jingles', author: 'Kenney', url: 'https://kenney.nl/assets/category:Audio', license: 'CC0 1.0' },
  { what: 'Bridge concrete', title: 'Concrete034', author: 'ambientCG', url: 'https://ambientcg.com/view?id=Concrete034', license: 'CC0 1.0' },
  { what: 'Announcer AEGIS, Nova', title: 'Piper voice "cori" / "kristin" (LibriVox data)', author: 'Bryce Beattie', url: 'https://huggingface.co/rhasspy/piper-voices', license: 'Public domain', changes: 'own lines synthesised with Piper TTS; radio filter, pitch and echo added (models: MIT)' },
  { what: 'Announcer KOMMAND, Red Bloc units, Grom', title: 'Piper voice "norman" (LibriVox data)', author: 'Bryce Beattie', url: 'https://huggingface.co/rhasspy/piper-voices', license: 'Public domain', changes: 'own lines synthesised with Piper TTS; lowered pitch, radio filter' },
  { what: 'Allied units', title: 'Piper voice "john" (LibriVox data)', author: 'Bryce Beattie', url: 'https://huggingface.co/rhasspy/piper-voices', license: 'Public domain', changes: 'own lines synthesised with Piper TTS; radio filter' },
  { what: 'Announcer CHOIR, The Oracle', title: 'Piper voice "ljspeech" (LJ Speech Dataset)', author: 'Keith Ito (dataset)', url: 'https://keithito.com/LJ-Speech-Dataset/', license: 'Public domain', changes: 'own lines synthesised with Piper TTS; layered with a lowered copy and echo' },
  { what: 'Interface fonts', title: 'Barlow, Barlow Condensed', author: 'The Barlow Project Authors', url: 'https://github.com/jpt/barlow', license: 'SIL OFL 1.1' },
  { what: 'Number font', title: 'Share Tech Mono', author: 'Carrois Type Design, Ralph du Carrois', url: 'https://fonts.google.com/specimen/Share+Tech+Mono', license: 'SIL OFL 1.1' },
];
