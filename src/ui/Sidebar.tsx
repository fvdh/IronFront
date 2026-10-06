import { useEffect, useRef, useState } from 'react';
import { ABILITIES } from '../game/data/abilities';
import { BUILDINGS } from '../game/data/buildings';
import { abilityOf } from '../game/systems/abilities';
import { LOW_POWER_PRODUCTION, TICK_RATE } from '../game/data/config';
import { displayName } from '../game/data/factions';
import { UNITS } from '../game/data/units';
import { WEAPONS } from '../game/data/weapons';
import type { Game } from '../game/Game';
import { icon, TERRAIN_MINIMAP } from '../game/render/assets';
import { fromIso, TH, TW } from '../game/render/iso';
import { canSee, disguisedFrom, rankOf } from '../game/systems/combat';
import { FACTIONS } from '../game/data/factions';
import type { WeaponDef } from '../game/data/weapons';
import { hasRadar, isLowPower as lowPower } from '../game/systems/economy';
import { catalog, categoryOf, costOf, missingRequirements, priceOf, timeOf } from '../game/systems/production';
import { POWERS } from '../game/data/powers';
import { fullCharge, isReady } from '../game/systems/powers';
import type { Entity } from '../game/types';
import { Emblem, Icon, type IconName } from './icons';

type Tab = 'building' | 'defense' | 'infantry' | 'vehicle';
const TABS: [Tab, string, IconName][] = [['building', 'Structures', 'struct'], ['defense', 'Defense', 'defense'], ['infantry', 'Infantry', 'infantry'], ['vehicle', 'Vehicles', 'vehicle']];
/** The Defense tab is a view on the building queue: weapons and walls. */
const isDefense = (def: string) => !!(BUILDINGS[def]?.weapon || BUILDINGS[def]?.wall);
const tabItems = (game: Game, t: Tab) =>
  t === 'building' || t === 'defense' ? catalog(game.s, game.view.me, 'building').filter((d) => isDefense(d) === (t === 'defense')) : catalog(game.s, game.view.me, t);
const tabOf = (def: string): Tab => (categoryOf(def) === 'building' ? (isDefense(def) ? 'defense' : 'building') : (categoryOf(def) as Tab));

/** Touch screens and narrow windows get the sidebar as a drawer over the map. */
export const useDrawer = () => {
  const q = '(pointer: coarse), (max-width: 1179px)';
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => { const mq = matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, []);
  return m;
};

export function Sidebar({ game }: { game: Game }) {
  const [tab, setTab] = useState<Tab>('building');
  const [tip, setTip] = useState<string | null>(null);
  const drawer = useDrawer();
  const [open, setOpen] = useState(false);
  // Placing a structure needs the map: the drawer gets out of the way.
  useEffect(() => { if (game.placing) setOpen(false); }, [game.placing]);
  const p = game.me;
  return (
    <aside className={`sidebar ${drawer ? 'drawer' : ''} ${drawer && open ? 'open' : ''}`}>
      <PowerRail game={game} onToggle={drawer ? () => setOpen((o) => !o) : undefined} open={open} />
      <div className="col">
        <div className="crest well">
          <Emblem faction={p.faction} />
          <div>
            <div className="fname">{FACTIONS[p.faction].name}</div>
            <Odometer value={Math.floor(p.credits)} />
          </div>
        </div>
        <div className={`radar plate ${hasRadar(game.s, game.view.me) || game.s.settings.mode === 'sandbox' ? 'on' : ''}`}>
          <div className="well">
            <Minimap game={game} />
            <div className="shutter t" /><div className="shutter b" />
          </div>
        </div>
        <div className="modes">
          <button className={`plate ${game.mode === 'repair' ? 'on' : ''}`} onClick={() => game.setMode('repair')} title="Repair: click one of your structures (Shift = keep repairing). Costs credits."><Icon name="wrench" size={16} />Repair</button>
          <button className={`plate ${game.mode === 'sell' ? 'on' : ''}`} onClick={() => game.setMode('sell')} title="Sell: click one of your structures for 50% of its value (scaled by health)."><Icon name="sell" size={16} />Sell</button>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map(([t, label, ico]) => <TabButton key={t} game={game} t={t} label={label} ico={ico} on={tab === t} onClick={() => setTab(t)} />)}
        </div>
        <div className="cameos well">
          {tabItems(game, tab).map((def) => <Cameo key={def} game={game} def={def} onTip={setTip} />)}
        </div>
        <div className="tip well">{tip ? <Tooltip game={game} def={tip} /> : <p className="hint">Hover a cameo for details. Left-click builds, right-click holds, again cancels. Right-drag scrolls the map.</p>}</div>
      </div>
    </aside>
  );
}

function TabButton({ game, t, label, ico, on, onClick }: { game: Game; t: Tab; label: string; ico: IconName; on: boolean; onClick(): void }) {
  const p = game.me;
  const ready = !!p.ready && tabOf(p.ready) === t;
  const head = p.queues[t === 'defense' ? 'building' : t][0];
  const k = head && tabOf(head.def) === t ? head.progress / (timeOf(head.def) * TICK_RATE) : -1;
  return (
    <button role="tab" aria-selected={on} aria-label={label} title={label} className={`plate ${on ? 'on' : ''}`} onClick={onClick}>
      <Icon name={ico} size={22} />
      {ready ? <i className="dot" /> : k >= 0 && <i className={`ring ${head.hold ? 'held' : ''}`} style={{ '--p': `${k * 360}deg` } as React.CSSProperties} />}
    </button>
  );
}

/** Credits as a mechanical counter: a digit that changes remounts and rolls in. */
function Odometer({ value }: { value: number }) {
  const s = `$${value.toLocaleString('en-US')}`;
  return (
    <div className="odo" title="Credits" aria-label={`${value} credits`}>
      {[...s].map((ch, i) => <b key={`${s.length - i}:${ch}`} className={/\d/.test(ch) ? '' : 'sep'}>{ch}</b>)}
    </div>
  );
}

/** Vertical power meter along the sidebar's inner edge; doubles as the drawer handle on touch screens. */
function PowerRail({ game, onToggle, open }: { game: Game; onToggle?: () => void; open: boolean }) {
  const p = game.me, low = p.powerUsed > p.powerMade, N = 24;
  const scale = Math.max(100, p.powerMade, p.powerUsed) * 1.1;
  const made = Math.round((p.powerMade / scale) * N), used = Math.min(N - 1, Math.round((p.powerUsed / scale) * N));
  const title = `Power: ${p.powerMade} produced, ${p.powerUsed} used${low ? '. LOW POWER: production at half speed, defenses offline' : ''}`;
  const body = (
    <>
      <span className={`bolt ${low ? 'low' : ''}`}><Icon name="bolt" size={14} /></span>
      <div className={`seg ${low ? 'low' : ''}`}>
        {Array.from({ length: N }, (_, i) => <i key={i} className={`${i < made ? 'on' : ''} ${i === used ? 'mark' : ''}`} />)}
      </div>
      <span className="lbl">{onToggle ? `$${Math.floor(p.credits).toLocaleString('en-US')}` : `${p.powerUsed}/${p.powerMade}`}</span>
    </>
  );
  return onToggle
    ? <button className="rail plate" onClick={onToggle} aria-expanded={open} aria-label={`Build menu. ${title}`} title={title}>{body}</button>
    : <div className={`rail plate power ${low ? 'low' : ''}`} title={title}>{body}</div>;
}

/** Superweapon clocks, top left of the map: your own (click to fire when ready) and every enemy one. */
export function SuperweaponTimers({ game }: { game: Game }) {
  const s = game.s;
  const sws = s.entities.filter((e) => e.hp > 0 && e.kind === 'building' && e.built >= 1 && BUILDINGS[e.def].superweapon && e.owner !== s.neutral);
  if (!sws.length) return null;
  return (
    <div className="swt">
      {sws.map((b) => {
        const pw = POWERS[BUILDINGS[b.def].superweapon!], k = Math.min(1, (b.charge ?? 0) / fullCharge(b.def)), left = Math.ceil((1 - k) * pw.charge);
        const clock = isReady(b) ? 'READY' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
        const mine = b.owner === game.view.me;
        const body = <><i /><span>{pw.name}<small>{mine ? 'Your superweapon' : s.players[b.owner].name}</small></span><em>{clock}</em></>;
        return mine
          ? <button key={b.id} className={`${isReady(b) ? 'ready' : ''} ${game.mode === 'power' && game.powerId === b.id ? 'on' : ''}`} disabled={!isReady(b)} onClick={() => game.armPower(b.id)}
              title={`${pw.name}: ${pw.description}`} aria-label={`${pw.name}${isReady(b) ? ', ready' : `, ${left} s left`}`}>{body}</button>
          : <div key={b.id} className="enemy" title={`${s.players[b.owner].name}: ${pw.name}`}>{body}</div>;
      })}
    </div>
  );
}

/** Zoom per footprint so a 1x1 tower fills the frame as well as a 3x3 factory. */
const cameoZoom = (def: string) => {
  const b = BUILDINGS[def];
  if (b) return b.w <= 1 ? 2 : b.w === 2 ? 1.7 : 1.45;
  return UNITS[def].category === 'infantry' ? 1.25 : 1.5;
};
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.ceil(sec % 60) === 60 ? 59 : Math.ceil(sec % 60)).padStart(2, '0')}`;

function Cameo({ game, def, onTip }: { game: Game; def: string; onTip(d: string | null): void }) {
  const p = game.me;
  const cat = categoryOf(def);
  const locked = missingRequirements(game.s, game.view.me, def).length > 0;
  const q = p.queues[cat];
  const count = q.filter((i) => i.def === def).length;
  const head = q[0]?.def === def ? q[0] : null;
  const total = timeOf(def) * TICK_RATE;
  const progress = head ? head.progress / total : 0;
  const ready = p.ready === def;
  const price = priceOf(game.s, game.view.me, def);
  const poor = !locked && !ready && !count && p.credits < price;
  const left = head ? (total - head.progress) / TICK_RATE / (lowPower(game.s, game.view.me) ? LOW_POWER_PRODUCTION : 1) : 0;
  const state = locked ? 'locked' : ready ? 'ready' : head?.hold ? 'hold' : head ? 'building' : count ? 'queued' : poor ? 'poor' : '';
  return (
    <button
      className={`cameo ${state} ${game.placing === def ? 'placing' : ''}`}
      style={{ '--z': cameoZoom(def) } as React.CSSProperties}
      onClick={() => game.queue(def)}
      onContextMenu={(e) => { e.preventDefault(); game.cancel(def); }}
      onMouseEnter={() => onTip(def)}
      onMouseLeave={() => onTip(null)}
      aria-label={`${displayName(def, p.faction)}, ${price} credits${locked ? ', locked' : ''}${ready ? ', ready to place' : ''}${head?.hold ? ', on hold' : ''}`}
    >
      <img src={icon(def, p.faction, p.color)} alt="" draggable={false} />
      {(head || count > 0) && !ready && <div className="wipe" style={{ '--p': `${progress * 360}deg` } as React.CSSProperties} />}
      {head && !head.hold && <span className="tm">{clock(left)}</span>}
      {count > 1 && <span className="count">{count}</span>}
      {ready && <span className="plate-tag">READY</span>}
      {head?.hold && <span className="plate-tag">ON HOLD</span>}
      {locked && <span className="lk"><Icon name="lock" size={20} /></span>}
      <span className="cost">${price.toLocaleString('en-US')}</span>
      <span className="name">{displayName(def, p.faction)}</span>
    </button>
  );
}

function Tooltip({ game, def }: { game: Game; def: string }) {
  const p = game.me;
  const b = BUILDINGS[def], u = UNITS[def];
  const miss = missingRequirements(game.s, game.view.me, def);
  const head = p.queues[categoryOf(def)][0];
  const low = p.powerUsed > p.powerMade;
  const remaining = head?.def === def ? (timeOf(def) * TICK_RATE - head.progress) / TICK_RATE / (low ? LOW_POWER_PRODUCTION : 1) : null;
  const w = u?.weapon ? WEAPONS[u.weapon] : b?.weapon ? WEAPONS[b.weapon] : null;
  const tr = traits(def, w);
  return (
    <div className="tooltip">
      <b>{displayName(def, p.faction)}</b>
      <div className="kv">
        <span>Cost</span><span>${priceOf(game.s, game.view.me, def)}{priceOf(game.s, game.view.me, def) < costOf(def) && ' (Assembly Plant)'}</span>
        <span>Build time</span><span>{timeOf(def)} s{remaining !== null && ` (${Math.ceil(remaining)} s left)`}</span>
        {b && <><span>Power</span><span>{b.power > 0 ? `+${b.power}` : b.power}</span></>}
        <span>Health</span><span>{(b ?? u).hp}</span>
        {u && <><span>Armor</span><span>{ARMOR_LABEL[u.armor]}</span></>}
        {w && !w.control && <><span>Weapon</span><span>{w.damage} damage · range {w.range}</span></>}
        {tr.strong && <><span>Strong vs</span><span>{tr.strong}</span></>}
        {tr.weak && <><span>Weak vs</span><span>{tr.weak}</span></>}
      </div>
      {tr.extra.length > 0 && <p className="traits">{tr.extra.join(' · ')}</p>}
      <p>{(b ?? u).description}</p>
      {miss.length > 0 && <p className="req">Requires: {miss.map((d) => displayName(d, p.faction)).join(', ')}</p>}
      <p className="hint">Left-click: build · Right-click: hold, again: cancel</p>
    </div>
  );
}

const ARMOR_LABEL: Record<string, string> = { none: 'none', light: 'light', heavy: 'heavy', building: 'structure' };
const TARGET_LABEL: Record<string, string> = { none: 'infantry', light: 'light vehicles', heavy: 'tanks', building: 'structures' };

/** "Strong vs" / "Weak vs" derived from the weapon's damage table, plus special traits. */
function traits(def: string, w: WeaponDef | null): { strong: string; weak: string; extra: string[] } {
  const u = UNITS[def], b = BUILDINGS[def];
  const extra: string[] = [];
  if (u?.air) extra.push('airborne');
  if (w?.aa) extra.push('hits air targets');
  else if (w && !w.control && !w.airOnly) extra.push('ground targets only');
  if (w?.splash) extra.push('splash damage');
  if (w?.ramp) extra.push('fires faster over time');
  if (w?.control) extra.push('mind control');
  if (u?.regen) extra.push('self-repairing');
  if (u?.engineer) extra.push('captures structures');
  if (b?.repairs) extra.push(b.naval ? 'repairs ships' : 'repairs vehicles');
  if (w?.airOnly) extra.push('air targets only');
  if (u?.transport) extra.push(`carries ${u.transport} infantry`);
  if (u?.ammo) extra.push(`${u.ammo} volleys, rearms at an airfield pad`);
  if (u?.ability) extra.push(`ability: ${ABILITIES[u.ability].name} (E)`);
  if (u?.limit) extra.push(`max. ${u.limit} at a time`);
  if (u?.hero) extra.push('hero');
  if (u?.teleport) extra.push('teleports');
  if (u?.disguise) extra.push('disguised');
  if (u?.infiltrate) extra.push('infiltrates structures');
  if (u?.detects) extra.push(u.move === 'water' ? `sonar: detects submarines (${u.detects})` : 'detects spies');
  if (u?.stealth) extra.push('invisible when submerged');
  if (u?.move === 'water') extra.push('water only');
  if (w?.navalOnly) extra.push('naval targets only');
  if (w?.grab) extra.push('grabs ships');
  if (b?.naval) extra.push('built on water');
  if (b?.superweapon) extra.push(`superweapon · charges in ${POWERS[b.superweapon].charge / 60} min`);
  if (b?.limit) extra.push(`max. ${b.limit}`);
  if (b?.vehicleDiscount) extra.push('vehicles −25% cost and build time');
  if (b?.duplicates) extra.push('infantry comes out doubled');
  if (b?.recycles) extra.push('recycles units for 50%');
  if (b?.detects) extra.push(`detects submarines and spies (${b.detects})`);
  if (u?.weapon2) { const w2 = WEAPONS[u.weapon2]; extra.push(w2.strike ? 'calls air strikes on structures' : w2.sub ? 'torpedoes / depth charges vs submarines' : w2.controlBuildings ? 'captures structures from close by (5 s beam)' : 'C4 vs structures (3 s fuse)'); }
  if (w?.phase) extra.push('phases targets out of time');
  if (w?.fuse) extra.push('time bomb');
  if (w?.cloud) extra.push('toxic cloud');
  if (w?.leech) extra.push('devours vehicles from the inside');
  if (w?.berserk) extra.push('berserk gas');
  if (w?.maxControl) extra.push(`controls ${w.maxControl} units`);
  if (w?.control) extra.push('mind control after a beam (longer on expensive units)');
  if (w?.drain) extra.push('drains power and credits');
  if (u?.mimic) extra.push('disguises itself as a tree');
  if (u?.move === 'amphibious') extra.push('land and water');
  if (u?.gunner) extra.push('weapon depends on passenger');
  if (u?.deployWeapon) extra.push('lands as artillery');
  if (u?.escort) extra.push(`comes with ${u.escort[1]} ${UNITS[u.escort[0]].name}s`);
  if (!w || w.control) return { strong: '', weak: '', extra };
  const keys = Object.keys(w.versus) as (keyof WeaponDef['versus'])[];
  const strong = keys.filter((k) => w.versus[k] >= 1).map((k) => TARGET_LABEL[k]).join(', ');
  const weak = keys.filter((k) => w.versus[k] < 0.5).map((k) => TARGET_LABEL[k]).join(', ');
  return { strong, weak, extra };
}

const ORDER_LABEL: Record<string, string> = { idle: 'Standing by', move: 'Moving', attack: 'Attacking', attackMove: 'Attack-move', guard: 'Guarding', harvest: 'Harvesting', capture: 'Capturing', enter: 'Boarding', rearm: 'Rearming' };
const HARVEST_LABEL: Record<string, string> = { seek: 'seeking ore', toOre: 'to ore field', harvest: 'harvesting', toRef: 'to refinery', unload: 'unloading', wait: 'waiting' };

/** Bottom-of-map command bar for the current selection: portrait, health, details and orders with hotkeys. */
export function CommandBar({ game }: { game: Game }) {
  const sel = game.selectedEntities();
  if (!sel.length) return null;
  const p = game.me;
  const mine = sel.some((e) => e.owner === game.view.me && e.kind === 'unit');
  const ab = sel.filter((e) => e.owner === game.view.me).map(abilityOf).find(Boolean);
  const orders = (mine || ab) && (
    <div className="orders plate">
      {mine && <>
        <button className={`ord ${game.mode === 'attackMove' ? 'on' : ''}`} onClick={() => game.attackMoveMode()} title="Attack-move (F)"><kbd>F</kbd><Icon name="attackMove" size={24} />Atk-move</button>
        <button className="ord" onClick={() => game.guard()} title="Guard position (G)"><kbd>G</kbd><Icon name="guard" size={24} />Guard</button>
        <button className="ord" onClick={() => game.stop()} title="Stop (X)"><kbd>X</kbd><Icon name="stop" size={24} />Stop</button>
      </>}
      {ab && <button className="ord ability" onClick={() => game.ability()} title={`${ABILITIES[ab].description} (E)`}><kbd>E</kbd><Icon name="ability" size={24} />{ABILITIES[ab].name}</button>}
    </div>
  );
  if (sel.length === 1) return <div className="cmdbar"><EntityInfo game={game} e={sel[0]} />{orders}</div>;
  const groups = new Map<string, Entity[]>();
  for (const e of sel) groups.set(e.def, [...(groups.get(e.def) ?? []), e]);
  const hp = sel.reduce((a, e) => a + e.hp / (UNITS[e.def] ?? BUILDINGS[e.def]).hp, 0) / sel.length;
  return (
    <div className="cmdbar">
      <div className="info plate">
        <div className="groups">
          {[...groups].map(([def, es]) => (
            <button key={def} className="group well" title={`Select only ${displayName(def, p.faction)}`} onClick={() => { game.view.selected.clear(); es.forEach((e) => game.view.selected.add(e.id)); game.notify(); }}>
              <img src={icon(def, p.faction, p.color)} alt="" /><span>{es.length}×</span>
            </button>
          ))}
        </div>
        <Pips k={hp} />
      </div>
      {orders}
    </div>
  );
}

/** Health as 10 segments: the count carries the meaning as well as the colour. */
function Pips({ k }: { k: number }) {
  const n = Math.max(k > 0 ? 1 : 0, Math.round(k * 10)), c = k > 0.5 ? 'g' : k > 0.25 ? 'y' : 'r';
  return <div className="pips" aria-label={`Health ${Math.round(k * 100)}%`}>{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < n ? c : ''} />)}</div>;
}

function EntityInfo({ game, e: real }: { game: Game; e: Entity }) {
  // An undetected enemy spy shows up as one of our own basic infantry.
  const fake = disguisedFrom(game.s, real, game.view.me);
  const e = fake ? { ...real, owner: game.view.me, def: FACTIONS[game.me.faction].roster.infAI } : { ...real }; // a copy: the panel may adjust it
  const owner = game.s.players[e.owner];
  const b = BUILDINGS[e.def], u = UNITS[e.def];
  const max = (b ?? u).hp;
  if (b?.bridge) e.hp = game.s.rt.byId.get(e.link ?? 0)?.hp ?? e.hp; // panel copy: show the span's shared health
  const w = u?.weapon ? WEAPONS[u.weapon] : b?.weapon ? WEAPONS[b.weapon] : null;
  const status = b ? (e.built < 1 ? 'Under construction' : b.needsPower && owner.powerUsed > owner.powerMade ? 'Offline (low power)' : 'Operational')
    : u.harvester ? `Harvesting: ${HARVEST_LABEL[e.hstate]}` : ORDER_LABEL[e.order.type];
  const repairing = b && e.repairing;
  const producer = b && b.produces && e.def !== 'cy' && e.owner === game.view.me;
  return (
    <div className="info plate">
      <div className="head">
        <span className="portrait well"><img src={icon(e.def, owner.faction, owner.color)} alt="" /></span>
        <div>
          <b>{displayName(e.def, owner.faction)}</b>
          <span className="owner"><span className="dot" style={{ background: owner.color }} />{owner.name}</span>
        </div>
      </div>
      <div className="hprow"><Pips k={e.hp / max} /><span>{Math.ceil(e.hp)}/{max}</span></div>
      <div className="kv">
        <span>Status</span><span>{status}</span>
        {u && <><span>Armor</span><span>{ARMOR_LABEL[u.armor]}</span></>}
        {w && !w.control && <><span>Weapon</span><span>{w.damage} · range {w.range}</span></>}
        {rankOf(e) > 0 && <><span>Rank</span><span className="rank">{rankOf(e) === 2 ? 'Elite ★★' : 'Veteran ★'}</span></>}
        {!!e.mcBy && <><span>Alert</span><span className="mc">mind-controlled</span></>}
        {u?.transport && <><span>Passengers</span><span>{e.passengers?.length ?? 0}/{u.transport}</span></>}
        {b?.garrison && <><span>Garrison</span><span>{e.passengers?.length ?? 0}/{b.garrison}</span></>}
        {b?.income && <><span>Income</span><span>+${b.income}/s{e.owner === game.s.neutral ? ' (once captured)' : ''}</span></>}
        {u?.ammo && <><span>Ammo</span><span>{e.ammo ?? 0}/{u.ammo}{e.order.type === 'rearm' ? ' (rearming)' : ''}</span></>}
        {e.dug && <><span>Stance</span><span>dug in</span></>}
        {e.deployed && <><span>Stance</span><span>deployed</span></>}
        {(e.phased ?? 0) > 0 && <><span>Alert</span><span className="mc">phasing out of time</span></>}
        {e.bombAt && <><span>Alert</span><span className="mc">time bomb!</span></>}
        {u?.harvester && <><span>Cargo</span><span>{Math.round(e.cargo)}/{u.harvester.capacity}</span></>}
        {b && <><span>Power</span><span>{b.power > 0 ? `+${b.power}` : b.power}</span></>}
        {repairing && <><span>Repair</span><span>in progress</span></>}
      </div>
      {producer && <p className="hint">Right-click the map to set the rally point for new units.</p>}
    </div>
  );
}

// ------------------------------------------------------------------ minimap

const MM_W = 232, MM_H = 116;

function Minimap({ game }: { game: Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = MM_W * dpr; c.height = MM_H * dpr;
    const g = c.getContext('2d')!;
    const { w, h } = game.s.map;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const og = off.getContext('2d')!;
    const img = og.createImageData(w, h);
    const rgb = TERRAIN_MINIMAP.map((hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
    const k = MM_W / (w + h), ox = h * k;
    const draw = () => {
      const s = game.s, me = game.me, m = s.map;
      if (!hasRadar(s, game.view.me) && s.settings.mode !== 'sandbox') {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = '#050607'; g.fillRect(0, 0, c.width, c.height);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = '#5c6a72'; g.font = '600 11px sans-serif'; g.textAlign = 'center';
        g.fillText(s.entities.some((e) => e.owner === game.view.me && e.def === 'radar') ? 'RADAR OFFLINE: LOW POWER' : 'NO RADAR', MM_W / 2, MM_H / 2 + 4);
        return;
      }
      for (let i = 0; i < w * h; i++) {
        let [r, gg, b] = m.ore[i] ? (m.gem[i] ? [90, 210, 230] : [214, 170, 60]) : rgb[m.terrain[i]];
        if (!me.explored[i]) r = gg = b = 0;
        else if (!me.visible[i]) { r *= 0.55; gg *= 0.55; b *= 0.55; }
        img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
      }
      for (const e of s.entities) {
        if (e.kind !== 'building' || BUILDINGS[e.def].bridge || !canSee(s, game.view.me, e)) continue;
        const col = s.players[e.owner].color;
        const [r, gg, b] = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
        const d = BUILDINGS[e.def];
        for (let y = e.y; y < e.y + d.h; y++) for (let x = e.x; x < e.x + d.w; x++) { const i = (y * w + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; }
      }
      og.putImageData(img, 0, 0);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#050607'; g.fillRect(0, 0, c.width, c.height);
      g.imageSmoothingEnabled = false;
      g.setTransform(k * dpr, (k / 2) * dpr, -k * dpr, (k / 2) * dpr, ox * dpr, 0);
      g.drawImage(off, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const e of s.entities) {
        if (e.kind !== 'unit' || e.inside || !canSee(s, game.view.me, e) || (UNITS[e.def].mimic && disguisedFrom(s, e, game.view.me))) continue;
        g.fillStyle = s.players[e.owner].color;
        g.fillRect(ox + (e.x - e.y) * k - 1, ((e.x + e.y) * k) / 2 - 1, 2.5, 2.5);
      }
      // Psi Beacon: where enemy units are headed to attack.
      if (s.entities.some((e) => e.owner === game.view.me && e.def === 'psibeacon' && e.hp > 0 && e.built >= 1) && !lowPower(s, game.view.me)) {
        g.strokeStyle = '#ff5a8a'; g.lineWidth = 1;
        for (const e of s.entities) {
          if (e.owner === game.view.me || e.owner === s.neutral || e.kind !== 'unit' || e.hp <= 0) continue;
          const t = e.order.type === 'attack' ? s.rt.byId.get(e.order.targetId) : undefined;
          if (!t && e.order.type !== 'attackMove') continue;
          if (t && t.owner !== game.view.me) continue;
          const tx = t ? t.x + (t.kind === 'building' ? 1 : 0) : e.order.tx, ty = t ? t.y + (t.kind === 'building' ? 1 : 0) : e.order.ty;
          const mx = ox + (tx - ty) * k, my = ((tx + ty) * k) / 2;
          g.beginPath(); g.moveTo(mx - 3, my - 3); g.lineTo(mx + 3, my + 3); g.moveTo(mx + 3, my - 3); g.lineTo(mx - 3, my + 3); g.stroke();
        }
      }
      // alert pings: expanding red rings where something of ours was hit
      for (const q of game.pings) {
        const a = game.clock - q.t, px = ox + (q.x - q.y) * k, py = ((q.x + q.y) * k) / 2;
        for (const off of [0, 0.5]) {
          const f = ((a + off) % 1);
          g.strokeStyle = `rgba(255, 74, 58, ${(1 - f) * Math.max(0, 1 - a / 3)})`; g.lineWidth = 2;
          g.beginPath(); g.arc(px, py, 3 + f * 14, 0, Math.PI * 2); g.stroke();
        }
      }
      // camera frame
      const cam = game.cam;
      const fx = ox + (cam.x / (TW / 2)) * k, fy = (cam.y / (TH / 2)) * (k / 2);
      const fw = (cam.vw / cam.zoom / (TW / 2)) * k, fh = (cam.vh / cam.zoom / (TH / 2)) * (k / 2);
      g.strokeStyle = '#e8f0f2'; g.lineWidth = 1;
      g.strokeRect(fx + 0.5, fy + 0.5, fw, fh);
    };
    draw();
    const id = setInterval(draw, 100);
    return () => clearInterval(id);
  }, [game]);

  const jump = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    if (!(ev.buttons & 1) && ev.type !== 'mousedown') return;
    if (!hasRadar(game.s, game.view.me) && game.s.settings.mode !== 'sandbox') return;
    const r = ev.currentTarget.getBoundingClientRect();
    const { w, h } = game.s.map;
    const k = MM_W / (w + h), ox = h * k;
    const mx = ((ev.clientX - r.left) * MM_W) / r.width, my = ((ev.clientY - r.top) * MM_H) / r.height; // UI scale (CSS zoom) safe
    const [wx, wy] = fromIso(((mx - ox) / k) * (TW / 2), (my / (k / 2)) * (TH / 2));
    game.cam.centerOn(wx, wy);
  };
  return <canvas ref={ref} className="minimap" style={{ width: MM_W, height: MM_H }} onMouseDown={jump} onMouseMove={jump} aria-label="Minimap: click to move the camera" />;
}
