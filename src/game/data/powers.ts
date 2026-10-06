// Superweapons: one per building def (`superweapon` in data/buildings.ts). They charge while the owner has power,
// everybody is warned when one is built and when it is ready, and they are fired at a point on the map.
export interface PowerDef {
  name: string;
  charge: number; // seconds
  radius: number; // tiles
  twoStep?: boolean; // Phase Gate: pick the group, then the destination
  description: string;
}

export const POWERS: Record<string, PowerDef> = {
  phasegate: { name: 'Phase Gate', charge: 240, radius: 2.5, twoStep: true, description: 'Teleports all vehicles in an area to a second point. Infantry does not survive (Phase Troopers and heroes do); anything landing on water or rocks is lost.' },
  storm: { name: 'Storm Engine', charge: 360, radius: 4, description: 'Lightning strikes around the target for ten seconds.' },
  hammer: { name: 'Hammer Silo', charge: 360, radius: 4, description: 'Heavy missile: massive explosion, then 25 seconds of radiation.' },
  stasis: { name: 'Stasis Projector', charge: 240, radius: 2.5, description: 'Vehicles and buildings in the area are invulnerable for 20 seconds. Infantry dies.' },
  dominion: { name: 'Dominion Engine', charge: 360, radius: 3, description: 'Permanently takes over all enemy units and buildings in the area (not heroes).' },
  mutagen: { name: 'Mutagen Spire', charge: 240, radius: 3, description: 'Turns enemy infantry in the area into Maulers that fight for you (not heroes).' },
};
