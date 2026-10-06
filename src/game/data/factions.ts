import type { FactionId } from '../types';
import { FACTION_BUILDING_NAMES, BUILDINGS } from './buildings';
import { FACTION_UNIT_NAMES, UNITS } from './units';

export interface FactionDef {
  id: FactionId;
  harvester: string;
  name: string;
  tagline: string;
  mainTank: string;
  /** Unit roles the AI builds from (see systems/ai.ts). */
  roster: { raider: string; support?: string; air: string; aa: string; special?: string; tech: string; infAI: string; infAT: string; defenses: [string, string]; aaDef?: string; extras?: string[]; vextras?: string[]; navy?: string[] }; // extras/vextras: specialist infantry/vehicles the AI mixes in; navy: ships once it has a Naval Yard
  style: { body: string; roof: string; accent: string };
}

export const FACTIONS: Record<FactionId, FactionDef> = {
  allies: { id: 'allies', harvester: 'miner', name: 'Allied Coalition', tagline: 'Versatile and high-tech', mainTank: 'tank_allies', roster: { raider: 'ifv', air: 'jet', aa: 'ifv', tech: 'prism', infAI: 'rifle', infAT: 'rocket', defenses: ['pillbox', 'prismtower'], aaDef: 'samsite', extras: ['skyjumper', 'phasetrooper', 'nova'], vextras: ['shroudtank', 'talon'], navy: ['destroyer', 'destroyer', 'cruiser', 'carrier', 'sonardrone'] }, style: { body: '#9aa6ad', roof: '#c4ccd1', accent: '#5b6a74' } },
  soviets: { id: 'soviets', harvester: 'miner', name: 'Red Bloc', tagline: 'Heavy armor and brute force', mainTank: 'tank_soviets', roster: { raider: 'jeep', air: 'airship', aa: 'flakhauler', support: 'artillery', tech: 'heavy', infAI: 'rifle', infAT: 'arc', defenses: ['tower', 'coil'], aaDef: 'flakbattery', extras: ['flakgunner', 'sapper', 'blight', 'grom'], vextras: ['leechdrone', 'siegerotor'], navy: ['flakboat', 'barracuda', 'barracuda', 'leviathan', 'kraken'] }, style: { body: '#8d7a66', roof: '#a8917a', accent: '#4f4236' } },
  psi: { id: 'psi', harvester: 'thrallhauler', name: 'Psi Directorate', tagline: 'Psionic and unconventional technology', mainTank: 'tank_psi', roster: { raider: 'gatling', air: 'disc', aa: 'gatling', special: 'mentalist', tech: 'magnetar', infAI: 'initiate', infAT: 'brute', defenses: ['gatlingtower', 'psispire'], extras: ['toxin', 'oracle'], vextras: ['hivemind', 'deliriumdrone'], navy: ['psisub'] }, style: { body: '#7c6f8e', roof: '#9d8db3', accent: '#3f3450' } },
};

export function displayName(def: string, faction: FactionId): string {
  return FACTION_UNIT_NAMES[faction]?.[def] ?? FACTION_BUILDING_NAMES[faction]?.[def] ?? UNITS[def]?.name ?? BUILDINGS[def]?.name ?? def;
}
