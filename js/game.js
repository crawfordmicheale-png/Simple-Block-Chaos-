import {
  clamp, lerp, len, norm, ang, fromAng, lerpAng, rand, pick, dist, hitCirc,
  Input, AudioBus, Particles, Camera, loadSave, writeSave,
} from "./engine.js";
import {
  WORLD, PAL, SHAPES, WEAPONS, SKILLS, MUTATIONS, SHOP, GLYPHS, CODEX_ORDER,
  wavePlan, skillRank, skillCost,
} from "./content.js";

const SIM_DT = 1 / 120;

function drawShape(ctx, id, r, color, fillA = 0.12) {
  ctx.beginPath();
  if (id === "circle") ctx.arc(0, 0, r, 0, Math.PI * 2);
  else if (id === "square") {
    const s = r * 1.55;
    ctx.rect(-s / 2, -s / 2, s, s);
  } else if (id === "triangle") {
    ctx.moveTo(r * 1.25, 0);
    ctx.lineTo(-r * 0.85, r * 0.95);
    ctx.lineTo(-r * 0.85, -r * 0.95);
    ctx.closePath();
  } else if (id === "diamond") {
    ctx.moveTo(r * 1.2, 0);
    ctx.lineTo(0, r * 0.95);
    ctx.lineTo(-r * 1.2, 0);
    ctx.lineTo(0, -r * 0.95);
    ctx.closePath();
  } else if (id === "hex") {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      const fn = i ? ctx.lineTo : ctx.moveTo;
      fn.call(ctx, Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15);
    }
    ctx.closePath();
  } else if (id === "star") {
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r * 1.25 : r * 0.52;
      const fn = i ? ctx.lineTo : ctx.moveTo;
      fn.call(ctx, Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = fillA;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function xpToNext(level) {
  return Math.floor(12 + level * 9 + level * level * 1.4);
}

export class Game {
  constructor(root) {
    this.root = root;
    this.canvas = root.querySelector("#view");
    this.ctx = this.canvas.getContext("2d");
    this.input = new Input();
    this.audio = new AudioBus();
    this.fx = new Particles();
    this.cam = new Camera();
    this.save = loadSave();
    this.audio.muted = this.save.mute;
    this.screen = "title";
    this.time = 0;
    this.acc = 0;
    this.last = 0;
    this.dpr = 1;
    this.vw = 1;
    this.vh = 1;
    this.hitstop = 0;
    this.slow = 1;
    this.bannerT = 0;
    this.tut = { move: false, fire: false, dash: false };
    this.run = null;
    this.drift = [];
    this._menuSel = this.save.selected;
    this._onResize = () => this.resize();
    addEventListener("resize", this._onResize);
    this.resize();
    this.bindUI();
    if (matchMedia("(pointer: coarse)").matches) {
      root.querySelector("#touch").classList.remove("hidden");
      this.input.bindTouch(root.querySelector("#touch"));
    }
    this.seedDrift();
    this.show("title");
    this.refreshMeta();
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.vw = innerWidth;
    this.vh = innerHeight;
    this.canvas.width = Math.floor(this.vw * dpr);
    this.canvas.height = Math.floor(this.vh * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  bindUI() {
    this.root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      this.audio.ui();
      this.audio.ensure();
      const act = btn.dataset.act;
      if (act === "play") this.startRun(this.save.selected);
      if (act === "shapes") this.show("shapes");
      if (act === "protocol") this.show("protocol");
      if (act === "intel") this.show("intel");
      if (act === "title") this.show("title");
      if (act === "resume") this.resume();
      if (act === "quit") this.abort();
      if (act === "again") this.startRun(this.save.selected);
      if (act === "shop-skip") this.closeShop();
    });
  }

  show(name) {
    this.screen = name;
    for (const s of this.root.querySelectorAll(".screen")) s.classList.toggle("active", s.id === `screen-${name}`);
    const playing = name === "playing" || name === "levelup" || name === "shop" || name === "pause";
    this.root.querySelector("#hud").classList.toggle("hidden", !playing || name === "pause");
    this.root.querySelector("#overlay").style.pointerEvents = name === "playing" ? "none" : "auto";
    if (name === "title" || name === "shapes" || name === "protocol" || name === "intel") this.refreshMeta();
  }

  refreshMeta() {
    const ink = `${this.save.ink} INK`;
    const a = this.root.querySelector("#ink-shapes");
    const b = this.root.querySelector("#ink-protocol");
    if (a) a.textContent = ink;
    if (b) b.textContent = ink;
    this.root.querySelector("#best-line").textContent =
      this.save.runs ? `best wave ${String(this.save.bestWave).padStart(2, "0")}   ·   best ${this.save.bestScore}   ·   ${this.save.runs} runs` : "first print";
    this.renderShapes();
    this.renderSkills();
    this.renderCodex();
  }

  renderShapes() {
    const grid = this.root.querySelector("#shape-grid");
    grid.innerHTML = "";
    for (const s of Object.values(SHAPES)) {
      const owned = this.save.unlocked.includes(s.id);
      const el = document.createElement("button");
      el.className = "card" + (owned ? " owned" : " locked") + (this.save.selected === s.id ? " selected" : "");
      el.innerHTML = `<div class="glyph">${s.name[0]}</div><h4>${s.name}</h4><p>${s.blurb}</p><div class="cost">${owned ? (this.save.selected === s.id ? "SELECTED" : "SELECT") : s.cost + " INK"}</div>`;
      el.addEventListener("click", () => {
        this.audio.ui();
        if (!owned) {
          if (this.save.ink >= s.cost) {
            this.save.ink -= s.cost;
            this.save.unlocked.push(s.id);
            this.save.selected = s.id;
            writeSave(this.save);
            this.refreshMeta();
          }
          return;
        }
        this.save.selected = s.id;
        writeSave(this.save);
        this.refreshMeta();
      });
      grid.appendChild(el);
    }
  }

  renderSkills() {
    const tree = this.root.querySelector("#skill-tree");
    tree.innerHTML = "";
    const groups = {};
    for (const s of SKILLS) (groups[s.branch] ||= []).push(s);
    for (const [branch, list] of Object.entries(groups)) {
      const wrap = document.createElement("div");
      wrap.className = "skill-branch";
      wrap.innerHTML = `<header><span>${branch}</span></header>`;
      const ranks = document.createElement("div");
      ranks.className = "ranks";
      for (const def of list) {
        const r = skillRank(this.save, def.id);
        const cell = document.createElement("div");
        cell.style.display = "flex";
        cell.style.flexDirection = "column";
        cell.style.gap = "4px";
        cell.style.marginRight = "10px";
        const lab = document.createElement("div");
        lab.style.cssText = "font-size:10px;letter-spacing:0.16em;color:#8b93a7";
        lab.textContent = def.desc.toUpperCase();
        const row = document.createElement("div");
        row.className = "ranks";
        for (let i = 0; i < def.max; i++) {
          const btn = document.createElement("button");
          btn.className = "rank" + (i < r ? " on" : i === r ? " next" : "");
          btn.textContent = def.label;
          btn.title = `${def.desc} ${i + 1}/${def.max} — ${skillCost(def, r)} INK`;
          btn.addEventListener("click", () => {
            if (i !== r) return;
            const c = skillCost(def, r);
            if (this.save.ink < c) return;
            this.audio.ui();
            this.save.ink -= c;
            this.save.skills[def.id] = r + 1;
            writeSave(this.save);
            this.refreshMeta();
          });
          row.appendChild(btn);
        }
        cell.appendChild(lab);
        cell.appendChild(row);
        ranks.appendChild(cell);
      }
      wrap.appendChild(ranks);
      tree.appendChild(wrap);
    }
  }

  renderCodex() {
    const box = this.root.querySelector("#codex");
    box.innerHTML = "";
    for (const g of CODEX_ORDER) {
      const seen = this.save.seen[g];
      const el = document.createElement("div");
      el.className = "cell" + (seen ? " seen" : "");
      el.textContent = seen ? g : "?";
      el.title = seen && GLYPHS[g] ? GLYPHS[g].name : "unknown";
      box.appendChild(el);
    }
  }

  startRun(shapeId) {
    const def = SHAPES[shapeId] || SHAPES.circle;
    const sk = (id) => skillRank(this.save, id);
    this.audio.ensure();
    this.run = {
      shape: def,
      x: WORLD.w / 2,
      y: WORLD.h / 2,
      vx: 0,
      vy: 0,
      r: 14,
      aim: 0,
      hp: def.hp + sk("hp"),
      maxHp: def.hp + sk("hp"),
      speed: def.speed * (1 + sk("speed") * 0.06),
      dashes: def.dashes + sk("dashes"),
      dashMax: def.dashes + sk("dashes"),
      dashTime: def.dashTime + sk("iframes") * 0.02,
      dashCd: [0, 0, 0, 0, 0, 0],
      dashing: 0,
      dashDir: [1, 0],
      invuln: 0,
      hurtFlash: 0,
      slide: 0,
      fireCd: 0,
      charge: 0,
      specialCd: 0,
      specialT: 0,
      lance: 0,
      prism: 0,
      orbits: [],
      well: 0,
      weapons: [def.weapon],
      wIndex: 0,
      dmg: 0 + (sk("dmg") > 0 ? Math.ceil(sk("dmg") * 0.4) : 0),
      rate: 1 + sk("rate") * 0.06,
      pierce: sk("pierce"),
      spread: 1,
      bounce: 0,
      knock: 1,
      bsize: 1,
      vamp: 0,
      explode: false,
      magnet: 78 * (1 + sk("pickup") * 0.2),
      crit: 0.04 + sk("luck") * 0.03,
      echo: 0,
      clarity: false,
      xpMul: 1 + sk("xp") * 0.08,
      dashDmg: 0,
      slow: false,
      chain: false,
      armor: sk("armor") * 0.12,
      inkMul: 1 + sk("ink") * 0.1,
      xp: 0,
      level: 1,
      score: 0,
      combo: 0,
      comboT: 0,
      glyphs: 0,
      wave: 0,
      waveT: 0,
      spawning: false,
      enemies: [],
      bullets: [],
      ebullets: [],
      pickups: [],
      blocks: this.makeBlocks(),
      kills: 0,
      perfects: 0,
      alive: true,
      paused: false,
      choosing: false,
      shopOpen: false,
      pendingMuts: [],
      trail: [],
    };
    this.cam.x = this.run.x;
    this.cam.y = this.run.y;
    this.slow = 1;
    this.hitstop = 0;
    this.tut = { move: false, fire: false, dash: this.save.runs > 0 };
    this.show("playing");
    this.nextWave();
    this.syncHud();
  }

  makeBlocks() {
    const b = [];
    const spots = [
      [500, 420, 120, 80], [1700, 420, 120, 80],
      [500, 1180, 120, 80], [1700, 1180, 120, 80],
      [1040, 800, 140, 140],
      [780, 800, 70, 180], [1380, 800, 70, 180],
    ];
    for (const [x, y, w, h] of spots) b.push({ x, y, w, h });
    return b;
  }

  seedDrift() {
    this.drift = [];
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 28; i++) {
      this.drift.push({
        g: glyphs[(Math.random() * glyphs.length) | 0],
        x: Math.random() * WORLD.w,
        y: Math.random() * WORLD.h,
        s: rand(18, 56),
        a: rand(0.03, 0.12),
        v: rand(8, 28),
      });
    }
  }

  nextWave() {
    const r = this.run;
    r.wave += 1;
    const plan = wavePlan(r.wave);
    r.waveT = 0;
    r.spawning = true;
    r.plan = plan;
    r.spawnLeft = plan.budget;
    r.spawnAcc = 0;
    this.flash(plan.shop ? "PRINTER" : plan.boss ? plan.name : `WAVE ${String(r.wave).padStart(2, "0")}  ${plan.name}`);
    if (plan.shop) {
      r.spawning = false;
      this.openShop();
    }
    if (plan.boss) this.spawnEnemy(plan.boss, WORLD.w / 2, 220, 1.15);
  }

  flash(text) {
    const el = this.root.querySelector("#banner");
    el.textContent = text;
    el.classList.add("show");
    this.bannerT = 1.4;
  }

  currentWeapon() {
    return WEAPONS[this.run.weapons[this.run.wIndex]] || WEAPONS.pulse;
  }

  grantRandomWeapon() {
    const ids = Object.keys(WEAPONS).filter((id) => !this.run.weapons.includes(id));
    if (!ids.length) {
      this.run.dmg += 1;
      return;
    }
    const id = pick(ids);
    this.run.weapons.push(id);
    this.run.wIndex = this.run.weapons.length - 1;
    this.flash(WEAPONS[id].name);
  }

  spawnEnemy(glyph, x, y, scale = 1) {
    const d = GLYPHS[glyph];
    if (!d) return;
    const t = this.run.plan?.t || 1;
    this.run.enemies.push({
      glyph,
      x, y,
      vx: 0, vy: 0,
      r: d.radius * (scale > 1 ? 1 : 1),
      hp: Math.max(1, Math.round(d.hp * t * scale)),
      maxHp: Math.max(1, Math.round(d.hp * t * scale)),
      speed: d.speed * (0.92 + t * 0.08),
      color: d.color,
      kind: d.kind,
      contact: d.contact,
      score: d.score,
      xp: d.xp,
      shotCd: rand(0.2, d.shotCd || 1),
      dashT: 0,
      fuse: d.fuse || 0,
      ang: rand(0, Math.PI * 2),
      hit: 0,
      slowT: 0,
      born: this.time,
    });
    this.save.seen[glyph] = true;
  }

  spawnAtEdge(glyph) {
    const p = this.run;
    let x, y;
    const side = (Math.random() * 4) | 0;
    if (side === 0) { x = rand(80, WORLD.w - 80); y = 70; }
    if (side === 1) { x = rand(80, WORLD.w - 80); y = WORLD.h - 70; }
    if (side === 2) { x = 70; y = rand(80, WORLD.h - 80); }
    if (side === 3) { x = WORLD.w - 70; y = rand(80, WORLD.h - 80); }
    if (dist(x, y, p.x, p.y) < 180) return this.spawnAtEdge(glyph);
    this.spawnEnemy(glyph, x, y);
  }

  tick(now) {
    if (!this.last) this.last = now;
    let frame = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.input.poll(this.canvas);
    if (this.input.pressed("escape") || this.input.pressed("p")) {
      if (this.screen === "playing") this.pause();
      else if (this.screen === "pause") this.resume();
    }
    if (this.screen === "playing") {
      if (this.hitstop > 0) {
        this.hitstop -= frame;
      } else {
        this.acc += frame * this.slow;
        while (this.acc >= SIM_DT) {
          this.step(SIM_DT);
          this.acc -= SIM_DT;
        }
      }
    } else {
      this.time += frame;
    }
    this.draw();
    this.input.endFrame();
  }

  pause() {
    if (!this.run?.alive) return;
    this.show("pause");
  }
  resume() {
    if (this.run?.alive) this.show("playing");
  }
  abort() {
    if (this.run) this.endRun(false);
    this.show("title");
  }

  step(dt) {
    this.time += dt;
    const r = this.run;
    if (!r.alive || r.choosing || r.shopOpen) return;
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) this.root.querySelector("#banner").classList.remove("show");
    }
    this.slow = lerp(this.slow, 1, 1 - Math.pow(0.02, dt));
    r.comboT = Math.max(0, r.comboT - dt);
    if (r.comboT <= 0) r.combo = 0;

    this.updatePlayer(dt);
    this.updateWave(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updatePickups(dt);
    this.fx.update(dt);
    this.collide(dt);

    if (r.alive && r.hp <= 0) this.endRun(false);
    this.syncHud();
  }

  updatePlayer(dt) {
    const r = this.run;
    const inp = this.input;
    if (len(inp.moveX, inp.moveY) > 0.2) this.tut.move = true;
    if (inp.fire) this.tut.fire = true;
    if (inp.pressed(" ")) this.tut.dash = true;

    let aimx, aimy;
    if (inp.padAim || (inp.aimActive && !inp.usingMouse)) {
      [aimx, aimy] = [inp.aimX, inp.aimY];
    } else {
      const [wx, wy] = this.cam.screenToWorld(inp.sx, inp.sy, this.vw, this.vh);
      aimx = wx - r.x;
      aimy = wy - r.y;
    }
    if (len(aimx, aimy) < 0.01) {
      aimx = Math.cos(r.aim);
      aimy = Math.sin(r.aim);
    }
    const assist = this.bestAimAssist(aimx, aimy);
    if (assist) {
      aimx = lerp(aimx, assist[0], inp.padAim ? 0.35 : 0.08);
      aimy = lerp(aimy, assist[1], inp.padAim ? 0.35 : 0.08);
    }
    r.aim = lerpAng(r.aim, ang(aimx, aimy), 1 - Math.pow(0.0002, dt));

    const precision = inp.held("control");
    const sliding = (inp.held("shift") || inp.padSlide) && len(r.vx, r.vy) > 140;
    r.slide = sliding ? 1 : 0;

    if (inp.pressed(" ")) this.tryDash();
    if (inp.pressed("q")) this.trySpecial();
    if (inp.pressed("r")) {
      r.wIndex = (r.wIndex + 1) % r.weapons.length;
      this.flash(this.currentWeapon().name);
    }

    for (let i = 0; i < r.dashCd.length; i++) r.dashCd[i] = Math.max(0, r.dashCd[i] - dt);
    if (r.dashes < r.dashMax) {
      const slot = r.dashCd.findIndex((t, i) => i >= r.dashes && t <= 0);
      // charges regen independently below
    }
    this.regenDashes(dt);

    if (r.dashing > 0) {
      r.dashing -= dt;
      r.x += r.dashDir[0] * 860 * dt;
      r.y += r.dashDir[1] * 860 * dt;
      r.vx = r.dashDir[0] * 280;
      r.vy = r.dashDir[1] * 280;
      r.invuln = Math.max(r.invuln, r.dashing + 0.02);
      r.trail.push({ x: r.x, y: r.y, a: 0.5, aim: r.aim });
      if (r.trail.length > 10) r.trail.shift();
      this.wallKick();
    } else {
      const accel = sliding ? 900 : precision ? 2200 : 4300;
      const max = r.speed * (precision ? 0.72 : 1) * (sliding ? 1.12 : 1);
      const [mx, my] = [inp.moveX, inp.moveY];
      if (len(mx, my) > 0.02) {
        r.vx += mx * accel * dt;
        r.vy += my * accel * dt;
      } else if (!sliding) {
        const f = 2600 * dt;
        const l = len(r.vx, r.vy);
        if (l > 0) {
          const nf = Math.max(0, l - f);
          r.vx *= nf / l;
          r.vy *= nf / l;
        }
      } else {
        r.vx *= 1 - 1.1 * dt;
        r.vy *= 1 - 1.1 * dt;
      }
      const sp = len(r.vx, r.vy);
      if (sp > max) {
        r.vx *= max / sp;
        r.vy *= max / sp;
      }
      r.x += r.vx * dt;
      r.y += r.vy * dt;
    }

    this.constrain(r, r.r);
    r.invuln = Math.max(0, r.invuln - dt);
    r.hurtFlash = Math.max(0, r.hurtFlash - dt);
    r.fireCd = Math.max(0, r.fireCd - dt);
    r.specialCd = Math.max(0, r.specialCd - dt);
    r.lance = Math.max(0, r.lance - dt);
    r.well = Math.max(0, r.well - dt);

    const wep = this.currentWeapon();
    const wantFire = inp.fire || (wep.charge && inp.fire);
    if (wep.charge) {
      if (inp.fire) r.charge = Math.min(1, r.charge + dt * 1.35);
      if (!inp.fire && r.charge > 0.2 && r.fireCd <= 0) {
        this.shoot(r.charge);
        r.charge = 0;
      }
      if (!inp.fire) r.charge = Math.max(0, r.charge - dt * 2);
    } else if (wantFire && r.fireCd <= 0 && r.dashing <= 0) {
      this.shoot(1);
      if (Math.random() < r.echo) this.shoot(1, 0.12);
    }

    this.updateOrbits(dt);
    const [ax, ay] = fromAng(r.aim);
    this.cam.follow(r.x, r.y, ax, ay, dt);
    if (r.trail.length && r.dashing <= 0) r.trail.shift();
  }

  regenDashes(dt) {
    const r = this.run;
    if (r.dashes >= r.dashMax) {
      r._dregen = 0;
      return;
    }
    r._dregen = (r._dregen || 0) + dt;
    if (r._dregen > 1.25) {
      r._dregen = 0;
      r.dashes += 1;
    }
  }

  bestAimAssist(aimx, aimy) {
    const r = this.run;
    let best = null;
    let bestDot = 0.92;
    const [nx, ny] = norm(aimx, aimy);
    for (const e of r.enemies) {
      const [ex, ey] = norm(e.x - r.x, e.y - r.y);
      const d = nx * ex + ny * ey;
      const distv = dist(r.x, r.y, e.x, e.y);
      if (d > bestDot && distv < 520) {
        bestDot = d;
        best = [e.x - r.x, e.y - r.y];
      }
    }
    return best;
  }

  tryDash() {
    const r = this.run;
    if (r.dashes <= 0 || r.dashing > 0) return;
    r.dashes -= 1;
    r.dashing = r.dashTime;
    let [dx, dy] = [this.input.moveX, this.input.moveY];
    if (len(dx, dy) < 0.15) [dx, dy] = fromAng(r.aim);
    r.dashDir = norm(dx, dy);
    r.invuln = r.dashTime + 0.04;
    this.audio.dash();
    this.fx.spawn(r.x, r.y, 8, { color: r.shape.color, s0: 40, s1: 180 });
    this.cam.punch(0.18);
  }

  wallKick() {
    const r = this.run;
    const pad = WORLD.pad + r.r;
    let kicked = false;
    if (r.x < pad) { r.x = pad; r.dashDir[0] = Math.abs(r.dashDir[0]); kicked = true; }
    if (r.x > WORLD.w - pad) { r.x = WORLD.w - pad; r.dashDir[0] = -Math.abs(r.dashDir[0]); kicked = true; }
    if (r.y < pad) { r.y = pad; r.dashDir[1] = Math.abs(r.dashDir[1]); kicked = true; }
    if (r.y > WORLD.h - pad) { r.y = WORLD.h - pad; r.dashDir[1] = -Math.abs(r.dashDir[1]); kicked = true; }
    for (const b of r.blocks) {
      if (this.circRect(r.x, r.y, r.r, b)) {
        const cx = clamp(r.x, b.x - b.w / 2, b.x + b.w / 2);
        const cy = clamp(r.y, b.y - b.h / 2, b.y + b.h / 2);
        const [nx, ny] = norm(r.x - cx, r.y - cy);
        r.dashDir = norm(r.dashDir[0] + nx * 1.8, r.dashDir[1] + ny * 1.8);
        r.x += nx * 6;
        r.y += ny * 6;
        kicked = true;
      }
    }
    if (kicked) this.fx.spawn(r.x, r.y, 4, { color: PAL.ice, s0: 80, s1: 200 });
  }

  trySpecial() {
    const r = this.run;
    if (r.specialCd > 0) return;
    r.specialCd = r.shape.specialCd;
    const sp = r.shape.special;
    this.audio.perfect();
    if (sp === "orbit") {
      r.orbits = [0, 1, 2].map((i) => ({ a: (i / 3) * Math.PI * 2, life: 6 }));
    } else if (sp === "barrier") {
      this.radial(r.x, r.y, 160, 2, true);
      this.cam.punch(0.4);
    } else if (sp === "lance") {
      r.lance = 4;
      r.dashes = Math.min(r.dashMax, r.dashes + 1);
    } else if (sp === "prism") {
      r.prism = 3;
    } else if (sp === "nova") {
      this.radial(r.x, r.y, 210, 3, false);
      this.cam.punch(0.5);
    } else if (sp === "well") {
      r.well = 2.8;
    }
  }

  radial(x, y, rad, dmg, knockOnly) {
    const r = this.run;
    for (const e of r.enemies) {
      const d = dist(x, y, e.x, e.y);
      if (d < rad) {
        const [nx, ny] = norm(e.x - x, e.y - y);
        e.vx += nx * 420;
        e.vy += ny * 420;
        if (!knockOnly) this.hurtEnemy(e, dmg, nx, ny);
      }
    }
    this.fx.spawn(x, y, 24, { color: r.shape.color, s0: 80, s1: 360 });
  }

  updateOrbits(dt) {
    const r = this.run;
    for (const o of r.orbits) {
      o.a += dt * 4.2;
      o.life -= dt;
      o.cd = Math.max(0, (o.cd || 0) - dt);
      const ox = r.x + Math.cos(o.a) * 34;
      const oy = r.y + Math.sin(o.a) * 34;
      o.x = ox; o.y = oy;
      if (o.cd <= 0) {
        for (const e of r.enemies) {
          if (hitCirc(ox, oy, 8, e.x, e.y, e.r)) {
            this.hurtEnemy(e, 1, Math.cos(o.a), Math.sin(o.a));
            o.cd = 0.14;
            break;
          }
        }
      }
      for (const b of r.ebullets) {
        if (hitCirc(ox, oy, 10, b.x, b.y, b.r)) b.life = 0;
      }
    }
    r.orbits = r.orbits.filter((o) => o.life > 0);
  }

  shoot(power = 1, extraSpread = 0) {
    const r = this.run;
    const wep = this.currentWeapon();
    r.fireCd = wep.cd / r.rate;
    const prism = r.prism > 0;
    if (prism) r.prism -= 1;
    const n = wep.pellets * (prism ? 2 : 1);
    const spread = wep.spread * r.spread + extraSpread;
    this.audio.shoot();
    const [bx, by] = fromAng(r.aim);
    r.vx -= bx * wep.recoil * 0.35;
    r.vy -= by * wep.recoil * 0.35;
    for (let i = 0; i < n; i++) {
      const fan = n === 1 ? 0 : ((i / (n - 1)) - 0.5) * spread;
      const jitter = (Math.random() - 0.5) * spread * 0.35;
      const a = r.aim + fan + jitter;
      const dmg = (wep.dmg + r.dmg) * (wep.charge ? 0.45 + power * 1.1 : 1);
      const crit = Math.random() < r.crit;
      r.bullets.push({
        x: r.x + Math.cos(a) * 18,
        y: r.y + Math.sin(a) * 18,
        vx: Math.cos(a) * wep.speed,
        vy: Math.sin(a) * wep.speed,
        r: wep.size * r.bsize * (wep.charge ? 0.8 + power : 1),
        dmg: Math.max(1, Math.round(dmg)) * (crit ? 2 : 1),
        life: wep.life,
        pierce: wep.pierce + r.pierce,
        bounce: r.bounce,
        color: crit ? PAL.gold : r.shape.color,
        homing: wep.homing || 0,
        curve: wep.curve || 0,
        chain: wep.chain || 0,
        crit,
        hit: new Set(),
      });
    }
    if (r.lance > 0 && r.dashing > 0) {
      this.radial(r.x, r.y, 54, 2, false);
    }
  }

  updateWave(dt) {
    const r = this.run;
    if (!r.spawning) {
      if (!r.plan?.shop && r.enemies.length === 0 && r.waveT > 1.2) this.nextWave();
      r.waveT += dt;
      return;
    }
    r.waveT += dt;
    r.spawnAcc += dt;
    const rate = Math.max(0.12, 0.45 - r.wave * 0.012);
    while (r.spawnLeft > 0 && r.spawnAcc > rate) {
      r.spawnAcc -= rate;
      const g = pick(r.plan.glyphs);
      this.spawnAtEdge(g);
      r.spawnLeft -= 1;
    }
    if (r.spawnLeft <= 0) r.spawning = false;
  }

  updateEnemies(dt) {
    const r = this.run;
    for (const e of r.enemies) {
      e.hit = Math.max(0, e.hit - dt);
      e.slowT = Math.max(0, e.slowT - dt);
      const mul = e.slowT > 0 ? 0.45 : 1;
      const [dx, dy] = [r.x - e.x, r.y - e.y];
      const d = len(dx, dy) || 1;
      const [nx, ny] = [dx / d, dy / d];
      let ax = 0, ay = 0;
      if (e.kind === "rush") { ax = nx; ay = ny; }
      else if (e.kind === "tank" || e.kind === "digit") { ax = nx; ay = ny; }
      else if (e.kind === "flank") {
        ax = -ny * 0.85 + nx * 0.35;
        ay = nx * 0.85 + ny * 0.35;
        if (d < 170) { ax = nx; ay = ny; }
      } else if (e.kind === "orbit") {
        ax = -ny + nx * 0.2;
        ay = nx + ny * 0.2;
      } else if (e.kind === "sniper") {
        if (d < 340) { ax = -nx; ay = -ny; } else { ax = nx * 0.2; ay = ny * 0.2; }
      } else if (e.kind === "caster" || e.kind === "mortar") {
        if (d < 220) { ax = -nx; ay = -ny; } else { ax = nx * 0.15; ay = ny * 0.15; }
      } else if (e.kind === "turret") { ax = 0; ay = 0; }
      else if (e.kind === "dasher") {
        e.dashT -= dt;
        if (e.dashT <= 0 && d < 360) {
          e.vx += nx * 520;
          e.vy += ny * 520;
          e.dashT = 1.6;
        } else { ax = nx * 0.5; ay = ny * 0.5; }
      } else if (e.kind === "bomb") {
        ax = nx; ay = ny;
        if (d < 70) e.fuse -= dt * 2;
        else e.fuse -= dt * 0.25;
      } else if (e.kind === "boss") {
        ax = nx * 0.7; ay = ny * 0.7;
        e.ang += dt;
        ax += Math.cos(e.ang * 2) * 0.5;
        ay += Math.sin(e.ang * 2) * 0.5;
      } else { ax = nx; ay = ny; }

      if (r.well > 0) {
        ax -= nx * 1.6;
        ay -= ny * 1.6;
      }
      e.vx += ax * e.speed * 3.4 * dt * mul;
      e.vy += ay * e.speed * 3.4 * dt * mul;
      e.vx *= 1 - 4.2 * dt;
      e.vy *= 1 - 4.2 * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      this.constrain(e, e.r);

      for (const o of r.enemies) {
        if (o === e) continue;
        if (hitCirc(e.x, e.y, e.r * 0.85, o.x, o.y, o.r * 0.85)) {
          const [sx, sy] = norm(e.x - o.x, e.y - o.y);
          e.x += sx * 0.6;
          e.y += sy * 0.6;
        }
      }

      const def = GLYPHS[e.glyph];
      if (def?.shotCd) {
        e.shotCd -= dt;
        if (e.shotCd <= 0) {
          e.shotCd = def.shotCd * (0.85 + Math.random() * 0.3);
          this.enemyShoot(e, nx, ny);
        }
      }
      if (e.kind === "bomb" && e.fuse <= 0) {
        e.hp = 0;
        this.radial(e.x, e.y, 90, 2, false);
        if (dist(e.x, e.y, r.x, r.y) < 90 && r.invuln <= 0) this.hurtPlayer(1);
      }
      if (e.kind === "hive") {
        e._h = (e._h || 0) + dt;
        if (e._h > 3.2 && r.enemies.length < 40) {
          e._h = 0;
          this.spawnEnemy("1", e.x + rand(-20, 20), e.y + rand(-20, 20));
        }
      }
    }
  }

  enemyShoot(e, nx, ny) {
    const r = this.run;
    const mark = e.kind === "sniper" ? "!" : e.kind === "mortar" ? "*" : e.kind === "boss" ? ":" : ".";
    const n = e.kind === "boss" ? 5 : 1;
    for (let i = 0; i < n; i++) {
      const a = ang(nx, ny) + (i - (n - 1) / 2) * 0.22 + rand(-0.04, 0.04);
      const spd = e.kind === "sniper" ? 420 : e.kind === "mortar" ? 240 : 300;
      r.ebullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: e.kind === "boss" ? 6 : 4.2,
        life: 2.4,
        glyph: mark,
        color: e.color,
        dmg: 1,
      });
    }
  }

  updateBullets(dt) {
    const r = this.run;
    for (const b of r.bullets) {
      if (b.homing) {
        let best = null, bd = 1e9;
        for (const e of r.enemies) {
          const d = dist(b.x, b.y, e.x, e.y);
          if (d < bd) { bd = d; best = e; }
        }
        if (best) {
          const [nx, ny] = norm(best.x - b.x, best.y - b.y);
          b.vx += nx * b.homing * 80 * dt;
          b.vy += ny * b.homing * 80 * dt;
          const sp = len(b.vx, b.vy);
          const max = 780;
          if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
        }
      }
      if (b.curve) {
        const t = ang(b.vx, b.vy) + dt * b.curve;
        const sp = len(b.vx, b.vy);
        b.vx = Math.cos(t) * sp;
        b.vy = Math.sin(t) * sp;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      this.bounceWorld(b);
    }
    for (const b of r.ebullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
    }
    r.bullets = r.bullets.filter((b) => b.life > 0);
    r.ebullets = r.ebullets.filter((b) => b.life > 0);
  }

  bounceWorld(b) {
    const pad = WORLD.pad;
    let hit = false;
    if (b.x < pad || b.x > WORLD.w - pad) {
      if (b.bounce > 0) { b.vx *= -1; b.bounce -= 1; hit = true; }
      else b.life = 0;
    }
    if (b.y < pad || b.y > WORLD.h - pad) {
      if (b.bounce > 0) { b.vy *= -1; b.bounce -= 1; hit = true; }
      else b.life = 0;
    }
    if (hit) { b.x = clamp(b.x, pad + 2, WORLD.w - pad - 2); b.y = clamp(b.y, pad + 2, WORLD.h - pad - 2); }
  }

  updatePickups(dt) {
    const r = this.run;
    for (const p of r.pickups) {
      const d = dist(p.x, p.y, r.x, r.y);
      if (d < r.magnet) {
        const [nx, ny] = norm(r.x - p.x, r.y - p.y);
        p.x += nx * 420 * dt;
        p.y += ny * 420 * dt;
      }
      p.life -= dt;
      if (d < r.r + 10) {
        p.life = 0;
        this.grab(p);
      }
    }
    r.pickups = r.pickups.filter((p) => p.life > 0);
  }

  grab(p) {
    const r = this.run;
    this.audio.pickup();
    if (p.kind === "xp") this.gainXp(p.n);
    if (p.kind === "hp") r.hp = Math.min(r.maxHp, r.hp + 1);
    if (p.kind === "glyph") r.glyphs += p.n;
    if (p.kind === "wep") this.grantRandomWeapon();
  }

  collide() {
    const r = this.run;
    for (const b of r.bullets) {
      for (const e of r.enemies) {
        if (b.hit.has(e)) continue;
        if (hitCirc(b.x, b.y, b.r, e.x, e.y, e.r)) {
          b.hit.add(e);
          const [nx, ny] = norm(e.x - b.x, e.y - b.y);
          this.hurtEnemy(e, b.dmg, nx, ny, b);
          if (b.pierce > 0) b.pierce -= 1;
          else b.life = 0;
        }
      }
    }
    for (const e of r.enemies) {
      const pr = r.slide ? r.r * 0.72 : r.r;
      if (hitCirc(r.x, r.y, pr, e.x, e.y, e.r * 0.85)) {
        if (r.dashing > 0) {
          if (r.dashDmg) this.hurtEnemy(e, r.dashDmg, r.dashDir[0], r.dashDir[1]);
          if (r.lance > 0) this.hurtEnemy(e, 3, r.dashDir[0], r.dashDir[1]);
        } else if (r.invuln <= 0) {
          this.hurtPlayer(Math.max(1, Math.round(e.contact * (1 - r.armor))));
          const [nx, ny] = norm(r.x - e.x, r.y - e.y);
          r.vx += nx * 280;
          r.vy += ny * 280;
          e.vx -= nx * 180;
          e.vy -= ny * 180;
        }
      }
    }
    for (const b of r.ebullets) {
      const pr = r.slide ? r.r * 0.7 : r.r;
      if (hitCirc(b.x, b.y, b.r, r.x, r.y, pr)) {
        if (r.dashing > 0 || r.invuln > 0) {
          b.life = 0;
          this.perfectDodge(b);
        } else {
          b.life = 0;
          this.hurtPlayer(b.dmg);
        }
      }
    }
    const dead = [];
    r.enemies = r.enemies.filter((e) => {
      if (e.hp > 0) return true;
      dead.push(e);
      return false;
    });
    for (const e of dead) this.kill(e);
  }

  perfectDodge() {
    const r = this.run;
    r.perfects += 1;
    this.slow = 0.32;
    this.hitstop = 0.06;
    this.audio.perfect();
    this.fx.spawn(r.x, r.y, 16, { color: PAL.gold, s0: 80, s1: 300 });
    this.flash("PERFECT");
    if (r.clarity) r.dashes = Math.min(r.dashMax, r.dashes + 1);
    r.invuln = Math.max(r.invuln, 0.2);
  }

  hurtPlayer(n) {
    const r = this.run;
    if (r.invuln > 0) return;
    r.hp -= n;
    r.invuln = 0.55;
    r.hurtFlash = 0.12;
    this.cam.punch(0.7);
    this.hitstop = 0.05;
    this.audio.hurt();
    this.fx.spawn(r.x, r.y, 12, { color: PAL.coral, s0: 60, s1: 240 });
  }

  hurtEnemy(e, dmg, nx, ny, bullet) {
    const r = this.run;
    e.hp -= dmg;
    e.hit = 0.08;
    e.vx += (nx || 0) * 90 * (r.knock);
    e.vy += (ny || 0) * 90 * (r.knock);
    if (r.slow) e.slowT = 0.55;
    this.audio.hit();
    this.fx.spawn(e.x, e.y, 4, { color: e.color, s0: 40, s1: 160, a: ang(nx || 1, ny || 0) });
    if (bullet?.crit) this.hitstop = Math.max(this.hitstop, 0.035);
  }

  kill(e) {
    const r = this.run;
    r.kills += 1;
    r.combo += 1;
    r.comboT = 2.4;
    const mul = 1 + Math.min(8, r.combo) * 0.12;
    r.score += Math.round(e.score * mul * 10);
    this.gainXp(e.xp * mul);
    this.audio.kill();
    this.fx.burst(e.x, e.y, e.color, e.glyph);
    this.cam.punch(e.kind === "boss" ? 0.9 : 0.22);
    if (r.explode) this.radial(e.x, e.y, 54, 2, false);
    if (r.chain) {
      let best = null, bd = 160;
      for (const o of r.enemies) {
        if (o === e) continue;
        const d = dist(e.x, e.y, o.x, o.y);
        if (d < bd) { bd = d; best = o; }
      }
      if (best) this.hurtEnemy(best, 2, 0, 0);
    }
    if (Math.random() < r.vamp) r.hp = Math.min(r.maxHp, r.hp + 1);
    if (e.kind === "split") {
      this.spawnEnemy("1", e.x - 12, e.y);
      this.spawnEnemy("1", e.x + 12, e.y);
    }
    if (Math.random() < 0.72) r.pickups.push({ x: e.x, y: e.y, kind: "xp", n: e.xp, life: 8, glyph: "+" });
    if (Math.random() < 0.12 + r.crit * 0.1) r.pickups.push({ x: e.x + 8, y: e.y, kind: "glyph", n: 1 + (e.kind === "boss" ? 8 : 0), life: 10, glyph: "$" });
    if (Math.random() < 0.04 && r.hp < r.maxHp) r.pickups.push({ x: e.x, y: e.y + 8, kind: "hp", n: 1, life: 10, glyph: "+" });
    if (e.kind === "boss" || Math.random() < 0.03) r.pickups.push({ x: e.x, y: e.y - 10, kind: "wep", n: 1, life: 12, glyph: ">" });
  }

  gainXp(n) {
    const r = this.run;
    r.xp += n * r.xpMul;
    r.levelQueue = r.levelQueue || 0;
    while (r.xp >= xpToNext(r.level)) {
      r.xp -= xpToNext(r.level);
      r.level += 1;
      r.levelQueue += 1;
    }
    if (r.levelQueue > 0 && !r.choosing && !r.shopOpen) this.openLevelup();
  }

  openLevelup() {
    const r = this.run;
    r.choosing = true;
    this.audio.level();
    const pool = [...MUTATIONS];
    const cards = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = (Math.random() * pool.length) | 0;
      cards.push(pool.splice(idx, 1)[0]);
    }
    r.pendingMuts = cards;
    const box = this.root.querySelector("#mut-cards");
    box.innerHTML = "";
    for (const m of cards) {
      const el = document.createElement("button");
      el.className = "card";
      el.innerHTML = `<h4>${m.name}</h4><p>${m.desc}</p>`;
      el.addEventListener("click", () => {
        m.apply(r, this);
        r.choosing = false;
        r.levelQueue = Math.max(0, (r.levelQueue || 1) - 1);
        this.audio.ui();
        this.flash(m.name);
        if (r.levelQueue > 0) this.openLevelup();
        else this.show("playing");
      });
      box.appendChild(el);
    }
    this.show("levelup");
  }

  openShop() {
    const r = this.run;
    r.shopOpen = true;
    const pool = [...SHOP];
    const box = this.root.querySelector("#shop-cards");
    box.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const m = pool.splice((Math.random() * pool.length) | 0, 1)[0];
      const el = document.createElement("button");
      el.className = "card";
      el.innerHTML = `<h4>${m.name}</h4><p>${m.desc}</p><div class="cost">${m.cost} GLYPHS</div>`;
      el.addEventListener("click", () => {
        if (r.glyphs < m.cost) return;
        r.glyphs -= m.cost;
        m.apply(r, this);
        this.audio.ui();
        this.closeShop();
      });
      box.appendChild(el);
    }
    this.show("shop");
  }

  closeShop() {
    if (!this.run) return;
    this.run.shopOpen = false;
    this.show("playing");
    this.run.waveT = 0;
    if (this.run.plan.shop) this.nextWave();
    else if (this.run.levelQueue > 0) this.openLevelup();
  }

  constrain(o, rad) {
    const pad = WORLD.pad + rad;
    o.x = clamp(o.x, pad, WORLD.w - pad);
    o.y = clamp(o.y, pad, WORLD.h - pad);
    for (const b of this.run.blocks) {
      if (this.circRect(o.x, o.y, rad, b)) {
        const cx = clamp(o.x, b.x - b.w / 2, b.x + b.w / 2);
        const cy = clamp(o.y, b.y - b.h / 2, b.y + b.h / 2);
        const [nx, ny] = norm(o.x - cx || 0.01, o.y - cy || 0.01);
        o.x = cx + nx * (rad + 1);
        o.y = cy + ny * (rad + 1);
      }
    }
  }

  circRect(x, y, r, b) {
    const cx = clamp(x, b.x - b.w / 2, b.x + b.w / 2);
    const cy = clamp(y, b.y - b.h / 2, b.y + b.h / 2);
    return dist(x, y, cx, cy) < r;
  }

  endRun(won) {
    const r = this.run;
    r.alive = false;
    const ink = Math.max(1, Math.floor((r.score / 40 + r.wave * 6 + r.kills * 0.4) * r.inkMul));
    this.save.ink += ink;
    this.save.runs += 1;
    this.save.kills += r.kills;
    this.save.bestWave = Math.max(this.save.bestWave, r.wave);
    this.save.bestScore = Math.max(this.save.bestScore, r.score);
    writeSave(this.save);
    this.root.querySelector("#result-kicker").textContent = won ? "CLEAN COPY" : "DISASSEMBLED";
    this.root.querySelector("#result-title").textContent = `WAVE ${String(r.wave).padStart(2, "0")}`;
    this.root.querySelector("#result-stats").innerHTML = `
      <div><span>SCORE</span><b>${r.score}</b></div>
      <div><span>KILLS</span><b>${r.kills}</b></div>
      <div><span>LEVEL</span><b>${r.level}</b></div>
      <div><span>PERFECTS</span><b>${r.perfects}</b></div>
      <div><span>INK BANKED</span><b>${ink}</b></div>
      <div><span>TOTAL INK</span><b>${this.save.ink}</b></div>`;
    this.show("results");
  }

  syncHud() {
    const r = this.run;
    if (!r) return;
    this.root.querySelector("#wave-label").textContent = `WAVE ${String(r.wave).padStart(2, "0")}`;
    this.root.querySelector("#score-label").textContent = String(r.score);
    this.root.querySelector("#combo-label").textContent = r.combo > 2 ? `x${r.combo}` : "";
    this.root.querySelector("#weapon-name").textContent = this.currentWeapon().name;
    this.root.querySelector("#shape-name").textContent = `${r.shape.name}  ·  ${r.glyphs} GLYPHS`;
    const xp = this.root.querySelector("#xp-fill");
    xp.style.width = `${(r.xp / xpToNext(r.level)) * 100}%`;
    const hp = this.root.querySelector("#hp-pips");
    hp.innerHTML = "";
    for (let i = 0; i < r.maxHp; i++) {
      const s = document.createElement("span");
      if (i < r.hp) s.className = "on";
      hp.appendChild(s);
    }
    const dash = this.root.querySelector("#dash-pips");
    dash.innerHTML = "";
    for (let i = 0; i < r.dashMax; i++) {
      const s = document.createElement("span");
      if (i < r.dashes) s.className = "on";
      dash.appendChild(s);
    }
    this.root.querySelector("#special-cd i").style.width = `${(1 - r.specialCd / r.shape.specialCd) * 100}%`;
    const tut = this.root.querySelector("#tut");
    if (!this.tut.move) tut.textContent = "MOVE";
    else if (!this.tut.fire) tut.textContent = "AIM  +  FIRE";
    else if (!this.tut.dash) tut.textContent = "DASH";
    else tut.textContent = "";
  }

  draw() {
    const ctx = this.ctx;
    const w = this.vw;
    const h = this.vh;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, w, h);

    if (this.run && (this.screen === "playing" || this.screen === "levelup" || this.screen === "shop" || this.screen === "pause" || this.screen === "results")) {
      this.cam.apply(ctx, w, h);
      this.drawWorld(ctx);
    } else {
      this.cam.x = WORLD.w / 2 + Math.cos(this.time * 0.15) * 40;
      this.cam.y = WORLD.h / 2 + Math.sin(this.time * 0.12) * 30;
      this.cam.apply(ctx, w, h);
      this.drawWorld(ctx, true);
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.78);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  drawWorld(ctx, menu = false) {
    ctx.fillStyle = "#0c0f16";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    ctx.strokeStyle = PAL.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.w; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.h); ctx.stroke();
    }
    for (let y = 0; y <= WORLD.h; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(122,215,255,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(WORLD.pad, WORLD.pad, WORLD.w - WORLD.pad * 2, WORLD.h - WORLD.pad * 2);

    if (menu) {
      ctx.font = "700 28px Syne, Arial Black, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const d of this.drift) {
        d.y += d.v * 0.016;
        if (d.y > WORLD.h + 40) d.y = -40;
        ctx.globalAlpha = d.a;
        ctx.fillStyle = PAL.ink;
        ctx.fillText(d.g, d.x, d.y);
      }
      ctx.globalAlpha = 1;
      return;
    }

    const r = this.run;
    ctx.fillStyle = PAL.wall;
    ctx.strokeStyle = "rgba(232,237,245,0.14)";
    ctx.lineWidth = 2;
    for (const b of r.blocks) {
      const x = b.x - b.w / 2;
      const y = b.y - b.h / 2;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, b.w, b.h, 8);
      else ctx.rect(x, y, b.w, b.h);
      ctx.fill();
      ctx.stroke();
    }

    if (r.well > 0) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, 160, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,154,74,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const p of r.pickups) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = p.kind === "hp" ? PAL.mint : p.kind === "wep" ? PAL.ice : PAL.gold;
      ctx.font = "700 16px Syne, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.glyph, p.x, p.y);
      ctx.globalAlpha = 1;
    }

    for (const b of r.ebullets) {
      ctx.fillStyle = b.color;
      ctx.font = `700 ${12 + b.r}px Syne, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.glyph, b.x, b.y);
    }

    for (const e of r.enemies) {
      const flash = e.hit > 0;
      ctx.save();
      ctx.translate(e.x, e.y);
      const size = Math.max(18, e.r * 1.8);
      ctx.font = `800 ${size}px Syne, Arial Black, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = flash ? "#fff" : e.color;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillText(e.glyph, 0, 1);
      if (e.hp < e.maxHp) {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(-e.r, e.r + 8, e.r * 2, 3);
        ctx.fillStyle = e.color;
        ctx.fillRect(-e.r, e.r + 8, e.r * 2 * (e.hp / e.maxHp), 3);
      }
      ctx.restore();
    }

    for (const b of r.bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang(b.vx, b.vy));
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.r * 1.8, -b.r * 0.55, b.r * 3.2, b.r * 1.1);
      ctx.restore();
    }

    for (const t of r.trail) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.aim);
      ctx.globalAlpha = t.a * 0.35;
      drawShape(ctx, r.shape.id, r.r, r.shape.color, 0);
      ctx.restore();
      t.a *= 0.9;
    }

    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.aim);
    if (r.hurtFlash > 0) {
      ctx.shadowColor = PAL.coral;
      ctx.shadowBlur = 18;
    } else {
      ctx.shadowColor = r.shape.color;
      ctx.shadowBlur = 12;
    }
    drawShape(ctx, r.shape.id, r.r, r.hurtFlash > 0 ? "#fff" : r.shape.color, r.dashing > 0 ? 0.28 : 0.12);
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(r.r + 2, 0);
    ctx.lineTo(r.r + 14, 0);
    ctx.strokeStyle = r.shape.color;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    if (this.currentWeapon().charge && r.charge > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r.r + 8, -Math.PI / 2, -Math.PI / 2 + r.charge * Math.PI * 2);
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    for (const o of r.orbits) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, 5, 0, Math.PI * 2);
      ctx.strokeStyle = r.shape.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    this.fx.draw(ctx);

    const [wx, wy] = this.cam.screenToWorld(this.input.sx, this.input.sy, this.vw, this.vh);
    ctx.strokeStyle = "rgba(232,237,245,0.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(wx - 7, wy); ctx.lineTo(wx + 7, wy);
    ctx.moveTo(wx, wy - 7); ctx.lineTo(wx, wy + 7);
    ctx.stroke();
  }
}
