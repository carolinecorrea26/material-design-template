export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export const inflate = (r: Rect, gap: number): Rect => ({ x: r.x - gap, y: r.y - gap, width: r.width + gap * 2, height: r.height + gap * 2 });
export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
export function segmentCrossesRect(a: Point, b: Point, r: Rect) {
  let lo = 0, hi = 1;
  for (const [origin, delta, min, max] of [[a.x, b.x - a.x, r.x + 0.01, r.x + r.width - 0.01], [a.y, b.y - a.y, r.y + 0.01, r.y + r.height - 0.01]]) {
    if (!delta) { if (origin < min || origin > max) return false; }
    else { const p = (min - origin) / delta, q = (max - origin) / delta; lo = Math.max(lo, Math.min(p, q)); hi = Math.min(hi, Math.max(p, q)); }
  }
  return lo <= hi;
}

/** Place a label in free space; its actual measured rectangle is an obstacle too. */
export function placeLabel(preferred: Rect, occupied: Rect[]): Rect {
  for (let ring = 0; ; ring++) {
    for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
      const candidate = { ...preferred, x: preferred.x + dx * 32, y: preferred.y + dy * 32 };
      if (!occupied.some(rect => intersects(inflate(candidate, 24), rect))) return candidate;
    }
  }
}

type Entry = { state: number; cost: number; priority: number };
class Heap {
  entries: Entry[] = [];
  push(entry: Entry) {
    const a = this.entries; a.push(entry); let i = a.length - 1;
    while (i) { const p = (i - 1) >> 1; if (a[p].priority <= entry.priority) break; a[i] = a[p]; i = p; }
    a[i] = entry;
  }
  pop() {
    const a = this.entries, first = a[0], last = a.pop()!;
    if (a.length) { let i = 0; while (i * 2 + 1 < a.length) { let c = i * 2 + 1; if (c + 1 < a.length && a[c + 1].priority < a[c].priority) c++; if (a[c].priority >= last.priority) break; a[i] = a[c]; i = c; } a[i] = last; }
    return first;
  }
}

/** Shared rectilinear visibility grid. No route can pass through a node or label.
 * Coordinates are generated from obstacle boundaries and ports, never authored per flow. */
export function createRouter(obstacles: Rect[], ports: Point[]) {
  const unique = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);
  const xs = unique([...obstacles.flatMap(r => [r.x, r.x + r.width]), ...ports.map(p => p.x)]);
  const ys = unique([...obstacles.flatMap(r => [r.y, r.y + r.height]), ...ports.map(p => p.y)]);
  const w = xs.length, h = ys.length;
  const horizontal = new Uint8Array(w * h), vertical = new Uint8Array(w * h);
  // Every obstacle boundary is a grid coordinate, so each interval is wholly
  // blocked or wholly open. Boundary travel retains the requested clearance.
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const id = y * w + x;
    if (x + 1 < w) horizontal[id] = Number(obstacles.some(r => ys[y] > r.y && ys[y] < r.y + r.height && xs[x] < r.x + r.width && xs[x + 1] > r.x));
    if (y + 1 < h) vertical[id] = Number(obstacles.some(r => xs[x] > r.x && xs[x] < r.x + r.width && ys[y] < r.y + r.height && ys[y + 1] > r.y));
  }
  return (start: Point, end: Point): Point[] => {
    const index = (p: Point) => ys.indexOf(p.y) * w + xs.indexOf(p.x);
    const target = index(end), origin = index(start), queue = new Heap();
    const distances = new Map<number, number>(), previous = new Map<number, number>();
    // Direction is part of the state; a small turn cost favors legible routes.
    const initial = origin * 3 + 2;
    distances.set(initial, 0); queue.push({ state: initial, cost: 0, priority: 0 });
    while (queue.entries.length) {
      const { state, cost } = queue.pop();
      if (cost !== distances.get(state)) continue;
      const id = Math.floor(state / 3), x = id % w, y = Math.floor(id / w), direction = state % 3;
      if (id === target) {
        const result: Point[] = []; let cursor: number | undefined = state;
        while (cursor !== undefined) { const n = Math.floor(cursor / 3); result.push({ x: xs[n % w], y: ys[Math.floor(n / w)] }); cursor = previous.get(cursor); }
        result.reverse();
        return result.filter((p, i) => !i || i === result.length - 1 || !(result[i - 1].x === p.x && p.x === result[i + 1].x || result[i - 1].y === p.y && p.y === result[i + 1].y));
      }
      const neighbors: Array<[number, number, boolean]> = [
        [x > 0 ? id - 1 : -1, 0, !!horizontal[id - 1]], [x + 1 < w ? id + 1 : -1, 0, !!horizontal[id]],
        [y > 0 ? id - w : -1, 1, !!vertical[id - w]], [y + 1 < h ? id + w : -1, 1, !!vertical[id]],
      ];
      for (const [next, axis, blocked] of neighbors) {
        if (next < 0 || blocked) continue;
        const nx = next % w, ny = Math.floor(next / w), nextState = next * 3 + axis;
        const total = cost + Math.abs(xs[nx] - xs[x]) + Math.abs(ys[ny] - ys[y]) + (direction !== 2 && direction !== axis ? 18 : 0);
        if (total >= (distances.get(nextState) ?? Infinity)) continue;
        distances.set(nextState, total); previous.set(nextState, state);
        queue.push({ state: nextState, cost: total, priority: total + Math.abs(xs[nx] - end.x) + Math.abs(ys[ny] - end.y) });
      }
    }
    throw new Error('No clear flow route between ports');
  };
}
