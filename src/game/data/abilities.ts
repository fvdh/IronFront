// Active abilities: one per unit/building def (`ability` field), fired with E or the selection-panel button.
export interface AbilityDef {
  name: string;
  cooldown: number; // ticks
  description: string;
}

export const ABILITIES: Record<string, AbilityDef> = {
  deploy: { name: 'Deploy', cooldown: 0, description: 'Builds a Construction Yard here (needs 3×3 clear ground).' },
  pack: { name: 'Pack Up', cooldown: 0, description: 'Packs the Construction Yard up into a Base Crawler.' },
  unload: { name: 'Unload', cooldown: 0, description: 'Unloads all passengers.' },
  digin: { name: 'Dig In', cooldown: 30, description: 'Dug in: stays put, +1.5 range and 40% less damage taken. Press E again to stand up.' },
  rig: { name: 'Deploy', cooldown: 30, description: 'Deployed: mobile refinery for its own Thralls, which mine ore around it. Press E again to drive.' },
  land: { name: 'Land', cooldown: 30, description: 'Land as artillery (long range, ground target) or take off again.' },
  irradiate: { name: 'Irradiate', cooldown: 30, description: 'Deployed: radiation field that kills nearby enemy infantry. Stationary. Press E again to pack up.' },
  psiwave: { name: 'Psi Wave', cooldown: 20 * 30, description: 'Psionic shockwave: heavy damage to all nearby enemy infantry (3 tiles).' },
  psistorm: { name: 'Psi Storm', cooldown: 30 * 30, description: 'Psionic storm: heavy damage to enemy infantry up to 3.5 tiles away, light damage to vehicles.' },
};
