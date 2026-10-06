// 2:1 isometric projection. World = tile space (x right-down, y left-down); iso = pixels at zoom 1.
export const TW = 64;
export const TH = 32;

export const isoX = (x: number, y: number) => ((x - y) * TW) / 2;
export const isoY = (x: number, y: number) => ((x + y) * TH) / 2;

export function fromIso(ix: number, iy: number): [number, number] {
  const a = ix / (TW / 2), b = iy / (TH / 2);
  return [(a + b) / 2, (b - a) / 2];
}

export class Camera {
  x = 0; // iso px at the viewport's top-left
  y = 0;
  zoom = 1;
  vw = 800; // viewport size in CSS px
  vh = 600;
  constructor(public mapW: number, public mapH: number) {}

  toScreen(wx: number, wy: number): [number, number] {
    return [(isoX(wx, wy) - this.x) * this.zoom, (isoY(wx, wy) - this.y) * this.zoom];
  }
  toWorld(sx: number, sy: number): [number, number] {
    return fromIso(sx / this.zoom + this.x, sy / this.zoom + this.y);
  }
  centerOn(wx: number, wy: number) {
    this.x = isoX(wx, wy) - this.vw / 2 / this.zoom;
    this.y = isoY(wx, wy) - this.vh / 2 / this.zoom;
    this.clamp();
  }
  center(): [number, number] {
    return fromIso(this.x + this.vw / 2 / this.zoom, this.y + this.vh / 2 / this.zoom);
  }
  pan(dx: number, dy: number) {
    this.x += dx / this.zoom;
    this.y += dy / this.zoom;
    this.clamp();
  }
  zoomAt(z: number, sx: number, sy: number) {
    const [wx, wy] = [sx / this.zoom + this.x, sy / this.zoom + this.y];
    this.zoom = Math.min(2, Math.max(0.5, z));
    this.x = wx - sx / this.zoom;
    this.y = wy - sy / this.zoom;
    this.clamp();
  }
  /** Keep the view centre inside the map's iso bounding box. */
  clamp() {
    const hw = this.vw / 2 / this.zoom, hh = this.vh / 2 / this.zoom;
    const minX = (-this.mapH * TW) / 2, maxX = (this.mapW * TW) / 2;
    const maxY = ((this.mapW + this.mapH) * TH) / 2;
    const cx = Math.min(maxX, Math.max(minX, this.x + hw));
    const cy = Math.min(maxY, Math.max(0, this.y + hh));
    this.x = cx - hw;
    this.y = cy - hh;
  }
}
