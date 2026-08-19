export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const len = (x, y) => Math.hypot(x, y);
export const norm = (x, y) => {
  const l = Math.hypot(x, y);
  return l > 1e-6 ? [x / l, y / l] : [0, 0];
};
export const ang = (x, y) => Math.atan2(y, x);
export const fromAng = (a, m = 1) => [Math.cos(a) * m, Math.sin(a) * m];
export const angDiff = (a, b) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
export const lerpAng = (a, b, t) => a + angDiff(a, b) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const irand = (a, b) => (a + Math.floor(Math.random() * (b - a + 1)));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const hitCirc = (ax, ay, ar, bx, by, br) => Math.hypot(ax - bx, ay - by) < ar + br;

export function mulberry(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SAVE_KEY = "block-chaos-v1";

export function loadSave() {
  const base = {
    ink: 0,
    unlocked: ["circle"],
    selected: "circle",
    skills: {},
    seen: {},
    bestWave: 0,
    bestScore: 0,
    runs: 0,
    kills: 0,
    mute: false,
  };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    return { ...base, ...JSON.parse(raw) };
  } catch {
    return base;
  }
}

export function writeSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export class Input {
  constructor() {
    this.keys = new Set();
    this.just = new Set();
    this.mx = 0;
    this.my = 0;
    this.fire = false;
    this.mouseFire = false;
    this.fireDown = false;
    this.moveX = 0;
    this.moveY = 0;
    this.aimX = 0;
    this.aimY = 0;
    this.aimActive = false;
    this.usingMouse = true;
    this.touch = false;
    this.playing = false;
    this.padAim = false;
    this.padSlide = false;
    this._sticks = { move: null, aim: null };
    this._gpFire = false;
    this._gameKeys = new Set([
      "w", "a", "s", "d", " ", "q", "r", "p", "escape", "shift", "control",
      "arrowup", "arrowdown", "arrowleft", "arrowright", "tab",
    ]);

    addEventListener("keydown", (e) => {
      const k = this._mapKey(e);
      if (this.playing && (this._gameKeys.has(k) || k === "tab")) e.preventDefault();
      else if (k === "tab") e.preventDefault();
      if (!this.keys.has(k)) this.just.add(k);
      this.keys.add(k);
    });
    addEventListener("keyup", (e) => this.keys.delete(this._mapKey(e)));
    addEventListener("blur", () => this.keys.clear());
    addEventListener("mousemove", (e) => {
      this.mx = e.clientX;
      this.my = e.clientY;
      this.usingMouse = true;
    });
    addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.mouseFire = true;
        this.fire = true;
        this.fireDown = true;
      }
    });
    addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.mouseFire = false;
        this.fire = false;
      }
    });
    addEventListener("contextmenu", (e) => e.preventDefault());
  }

  bindTouch(root) {
    const move = root.querySelector("#stick-move");
    const aim = root.querySelector("#stick-aim");
    const dash = root.querySelector("#btn-dash");
    const spec = root.querySelector("#btn-special");
    const pause = root.querySelector("#btn-pause");
    this.touch = true;
    this._bindStick(move, "move");
    this._bindStick(aim, "aim");
    const hold = (el, key) => {
      const on = (e) => {
        e.preventDefault();
        this.keys.add(key);
        this.just.add(key);
      };
      const off = (e) => {
        e.preventDefault();
        this.keys.delete(key);
      };
      el.addEventListener("pointerdown", on);
      el.addEventListener("pointerup", off);
      el.addEventListener("pointerleave", off);
      el.addEventListener("pointercancel", off);
    };
    hold(dash, " ");
    hold(spec, "q");
    pause.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.just.add("escape");
    });
  }

  _bindStick(el, which) {
    const knob = el.querySelector("b");
    const set = (cx, cy, active) => {
      const r = el.getBoundingClientRect();
      const px = r.left + r.width / 2;
      const py = r.top + r.height / 2;
      let x = (cx - px) / (r.width * 0.42);
      let y = (cy - py) / (r.height * 0.42);
      const l = Math.hypot(x, y);
      if (l > 1) {
        x /= l;
        y /= l;
      }
      this._sticks[which] = active ? { x, y } : null;
      knob.style.transform = `translate(calc(-50% + ${x * 28}px), calc(-50% + ${y * 28}px))`;
      if (which === "aim" && active) {
        this.fire = l > 0.28;
        this.aimActive = l > 0.18;
        this.usingMouse = false;
      }
    };
    const start = (e) => {
      el.setPointerCapture(e.pointerId);
      set(e.clientX, e.clientY, true);
    };
    const move = (e) => {
      if (this._sticks[which]) set(e.clientX, e.clientY, true);
    };
    const end = () => {
      this._sticks[which] = null;
      knob.style.transform = "translate(-50%, -50%)";
      if (which === "aim") {
        this.fire = false;
        this.aimActive = false;
      }
    };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  _mapKey(e) {
    const codes = {
      KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d",
      Space: " ", KeyQ: "q", KeyR: "r", KeyP: "p",
      Escape: "escape", ShiftLeft: "shift", ShiftRight: "shift",
      ControlLeft: "control", ControlRight: "control",
      ArrowUp: "arrowup", ArrowDown: "arrowdown",
      ArrowLeft: "arrowleft", ArrowRight: "arrowright",
      Tab: "tab",
    };
    if (codes[e.code]) return codes[e.code];
    return (e.key || "").toLowerCase();
  }

  pressed(k) {
    return this.just.has(k);
  }

  held(k) {
    return this.keys.has(k);
  }

  endFrame() {
    this.just.clear();
    this.fireDown = false;
  }

  poll(canvas) {
    let mx = 0;
    let my = 0;
    if (this.held("a") || this.held("arrowleft")) mx -= 1;
    if (this.held("d") || this.held("arrowright")) mx += 1;
    if (this.held("w") || this.held("arrowup")) my -= 1;
    if (this.held("s") || this.held("arrowdown")) my += 1;

    if (this._sticks.move) {
      mx = this._sticks.move.x;
      my = this._sticks.move.y;
    }

    this.padAim = false;
    this.padSlide = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const dz = (x, y) => {
        const l = Math.hypot(x, y);
        if (l < 0.2) return [0, 0];
        const t = (l - 0.2) / 0.8;
        return [(x / l) * t, (y / l) * t];
      };
      const [lx, ly] = dz(p.axes[0] || 0, p.axes[1] || 0);
      const [rx, ry] = dz(p.axes[2] || 0, p.axes[3] || 0);
      if (Math.hypot(lx, ly) > 0.05) {
        mx = lx;
        my = ly;
      }
      if (Math.hypot(rx, ry) > 0.2) {
        this.aimX = rx;
        this.aimY = ry;
        this.padAim = true;
        this.usingMouse = false;
        this.aimActive = true;
      }
      const rt = p.buttons[7]?.value || 0;
      const firing = rt > 0.3 || p.buttons[5]?.pressed;
      if (firing && !this._gpFire) this.fireDown = true;
      this._gpFire = firing;
      this.fire = this.mouseFire || firing || (this._sticks.aim && Math.hypot(this._sticks.aim.x, this._sticks.aim.y) > 0.28);
      if (p.buttons[0]?.pressed && !this.keys.has(" ")) this.just.add(" ");
      this.padSlide = !!p.buttons[4]?.pressed;
      if (p.buttons[6]?.pressed && !this.keys.has("q")) this.just.add("q");
      if (p.buttons[9]?.pressed) this.just.add("escape");
      if (p.buttons[3]?.pressed) this.just.add("r");
    }

    const l = Math.hypot(mx, my);
    if (l > 1) {
      mx /= l;
      my /= l;
    }
    this.moveX = mx;
    this.moveY = my;

    if (this._sticks.aim) {
      this.aimX = this._sticks.aim.x;
      this.aimY = this._sticks.aim.y;
    }

    const rect = canvas.getBoundingClientRect();
    this.sx = this.mx - rect.left;
    this.sy = this.my - rect.top;
  }
}

export class AudioBus {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = 0.22;
  }
  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  beep({ f = 440, t = 0.08, type = "square", g = 0.08, slide = 0, start = 0 }) {
    if (this.muted) return;
    this.ensure();
    const c = this.ctx;
    const o = c.createOscillator();
    const a = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, c.currentTime + start);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), c.currentTime + start + t);
    a.gain.setValueAtTime(0.0001, c.currentTime + start);
    a.gain.exponentialRampToValueAtTime(g * this.master, c.currentTime + start + 0.01);
    a.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + t);
    o.connect(a);
    a.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + t + 0.02);
  }
  noise(t = 0.06, g = 0.05) {
    if (this.muted) return;
    this.ensure();
    const c = this.ctx;
    const n = c.createBuffer(1, c.sampleRate * t, c.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = n;
    const a = c.createGain();
    a.gain.setValueAtTime(g * this.master, c.currentTime);
    a.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t);
    s.connect(a);
    a.connect(c.destination);
    s.start();
  }
  shoot() {
    this.beep({ f: 680, t: 0.045, type: "square", g: 0.05, slide: -280 });
  }
  dash() {
    this.beep({ f: 180, t: 0.12, type: "sawtooth", g: 0.06, slide: 220 });
    this.noise(0.05, 0.04);
  }
  hit() {
    this.beep({ f: 220, t: 0.04, type: "triangle", g: 0.05, slide: -80 });
  }
  kill() {
    this.beep({ f: 520, t: 0.09, type: "square", g: 0.06, slide: -360 });
  }
  hurt() {
    this.beep({ f: 140, t: 0.16, type: "sawtooth", g: 0.09, slide: -90 });
  }
  level() {
    this.beep({ f: 440, t: 0.1, g: 0.06, type: "square" });
    this.beep({ f: 660, t: 0.12, g: 0.05, type: "square", start: 0.08 });
    this.beep({ f: 880, t: 0.16, g: 0.05, type: "square", start: 0.16 });
  }
  pickup() {
    this.beep({ f: 740, t: 0.08, type: "sine", g: 0.05, slide: 200 });
  }
  ui() {
    this.beep({ f: 420, t: 0.05, type: "square", g: 0.04 });
  }
  perfect() {
    this.beep({ f: 880, t: 0.2, type: "sine", g: 0.07, slide: 400 });
  }
}

export class Particles {
  constructor() {
    this.list = [];
  }
  spawn(x, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = opts.a ?? rand(0, Math.PI * 2);
      const s = rand(opts.s0 ?? 40, opts.s1 ?? 280);
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * s + (opts.vx || 0),
        vy: Math.sin(a) * s + (opts.vy || 0),
        life: rand(opts.l0 ?? 0.18, opts.l1 ?? 0.55),
        max: 1,
        size: rand(opts.z0 ?? 1, opts.z1 ?? 3.2),
        color: opts.color || "#fff",
        glyph: opts.glyph || "",
        drag: opts.drag ?? 2.8,
      });
      this.list[this.list.length - 1].max = this.list[this.list.length - 1].life;
    }
  }
  burst(x, y, color, glyph) {
    this.spawn(x, y, 14, { color, glyph: "", s0: 50, s1: 340, z0: 1, z1: 2.4 });
    if (glyph) {
      this.list.push({
        x,
        y,
        vx: rand(-30, 30),
        vy: rand(-80, -20),
        life: 0.45,
        max: 0.45,
        size: 22,
        color,
        glyph,
        drag: 1.2,
      });
    }
  }
  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.vx *= 1 - p.drag * dt;
      p.vy *= 1 - p.drag * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    if (this.list.length > 900) this.list.splice(0, this.list.length - 900);
  }
  draw(ctx) {
    for (const p of this.list) {
      const a = p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.glyph) {
        ctx.font = `700 ${p.size}px Syne, Arial Black, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyph, p.x, p.y);
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }
}

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.tx = 0;
    this.ty = 0;
    this.shake = 0;
    this.zoom = 1;
  }
  punch(n) {
    this.shake = Math.max(this.shake, n);
  }
  follow(x, y, aimx, aimy, dt) {
    this.tx = x + aimx * 48;
    this.ty = y + aimy * 48;
    this.x = lerp(this.x, this.tx, 1 - Math.pow(0.001, dt));
    this.y = lerp(this.y, this.ty, 1 - Math.pow(0.001, dt));
    this.shake = Math.max(0, this.shake - dt * 8);
  }
  apply(ctx, w, h) {
    const sx = this.shake ? rand(-1, 1) * this.shake * 10 : 0;
    const sy = this.shake ? rand(-1, 1) * this.shake * 10 : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(w / 2 + sx, h / 2 + sy);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }
  screenToWorld(sx, sy, w, h) {
    return [(sx - w / 2) / this.zoom + this.x, (sy - h / 2) / this.zoom + this.y];
  }
}
