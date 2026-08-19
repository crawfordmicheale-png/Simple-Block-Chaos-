export const WORLD = { w: 2200, h: 1600, pad: 48 };

export const PAL = {
  bg: "#090b10",
  grid: "rgba(232,237,245,0.035)",
  wall: "#151922",
  ice: "#7ad7ff",
  mint: "#7dffb3",
  coral: "#ff5a4a",
  gold: "#ffd36a",
  violet: "#b9a7ff",
  ink: "#e8edf5",
  dim: "#8b93a7",
};

export const SHAPES = {
  circle: {
    id: "circle",
    name: "CIRCLE",
    blurb: "Balanced pulse gun. Orbiting pips on special. The control kit.",
    color: "#7ad7ff",
    cost: 0,
    hp: 6,
    speed: 285,
    dashes: 3,
    dashTime: 0.13,
    weapon: "pulse",
    special: "orbit",
    specialCd: 7,
  },
  square: {
    id: "square",
    name: "SQUARE",
    blurb: "Heavy slug. Barrier pulse knocks glyphs off you. Built to stay.",
    color: "#7dffb3",
    cost: 180,
    hp: 9,
    speed: 240,
    dashes: 2,
    dashTime: 0.1,
    weapon: "slug",
    special: "barrier",
    specialCd: 8,
  },
  triangle: {
    id: "triangle",
    name: "TRIANGLE",
    blurb: "Piercing needles. Next dash is a lance. Speed is the defense.",
    color: "#ff5a7a",
    cost: 320,
    hp: 5,
    speed: 325,
    dashes: 4,
    dashTime: 0.155,
    weapon: "needle",
    special: "lance",
    specialCd: 5.5,
  },
  diamond: {
    id: "diamond",
    name: "DIAMOND",
    blurb: "Hold fire to charge a rail. Special splits the next shot.",
    color: "#c9a0ff",
    cost: 640,
    hp: 5,
    speed: 275,
    dashes: 3,
    dashTime: 0.13,
    weapon: "rail",
    special: "prism",
    specialCd: 6,
  },
  hex: {
    id: "hex",
    name: "HEX",
    blurb: "Close-range hex spread. Nova when they crowd you.",
    color: "#ffd36a",
    cost: 960,
    hp: 7,
    speed: 260,
    dashes: 3,
    dashTime: 0.12,
    weapon: "hex",
    special: "nova",
    specialCd: 7.5,
  },
  star: {
    id: "star",
    name: "STAR",
    blurb: "Homing sparks. Gravity well special. Chaos with a leash.",
    color: "#ff9a4a",
    cost: 1500,
    hp: 6,
    speed: 270,
    dashes: 3,
    dashTime: 0.14,
    weapon: "spark",
    special: "well",
    specialCd: 9,
  },
};

export const WEAPONS = {
  pulse: { id: "pulse", name: "PULSE", dmg: 1, cd: 0.095, pellets: 1, spread: 0.04, speed: 780, life: 0.7, size: 3.4, pierce: 0, knock: 40, recoil: 18 },
  slug: { id: "slug", name: "SLUG", dmg: 3, cd: 0.34, pellets: 1, spread: 0.01, speed: 620, life: 0.85, size: 6.2, pierce: 0, knock: 140, recoil: 70 },
  needle: { id: "needle", name: "NEEDLE", dmg: 1, cd: 0.11, pellets: 1, spread: 0.02, speed: 980, life: 0.65, size: 2.4, pierce: 2, knock: 20, recoil: 10 },
  rail: { id: "rail", name: "RAIL", dmg: 5, cd: 0.72, pellets: 1, spread: 0, speed: 2200, life: 0.18, size: 3, pierce: 8, knock: 80, recoil: 40, charge: true },
  hex: { id: "hex", name: "HEX", dmg: 1, cd: 0.42, pellets: 6, spread: 0.55, speed: 700, life: 0.32, size: 3, pierce: 0, knock: 30, recoil: 90 },
  spark: { id: "spark", name: "SPARK", dmg: 1, cd: 0.16, pellets: 2, spread: 0.4, speed: 420, life: 1.1, size: 3.2, pierce: 0, knock: 10, recoil: 8, homing: 6.5 },
  splitter: { id: "splitter", name: "SPLITTER", dmg: 1, cd: 0.22, pellets: 3, spread: 0.22, speed: 760, life: 0.55, size: 3, pierce: 0, knock: 28, recoil: 30 },
  gyre: { id: "gyre", name: "GYRE", dmg: 1, cd: 0.18, pellets: 1, spread: 0, speed: 260, life: 1.4, size: 4, pierce: 1, knock: 20, recoil: 12, curve: 7 },
  arc: { id: "arc", name: "ARC", dmg: 2, cd: 0.28, pellets: 1, spread: 0.05, speed: 640, life: 0.7, size: 3.6, pierce: 0, knock: 20, recoil: 16, chain: 3 },
};

export const SKILLS = [
  { id: "speed", branch: "MOBILITY", label: "V", max: 5, cost: 60, desc: "Move speed" },
  { id: "dashes", branch: "MOBILITY", label: "D", max: 3, cost: 90, desc: "Dash charges" },
  { id: "iframes", branch: "MOBILITY", label: "I", max: 4, cost: 80, desc: "Dash window" },
  { id: "dmg", branch: "FIREPOWER", label: "+", max: 5, cost: 75, desc: "Flat damage" },
  { id: "rate", branch: "FIREPOWER", label: "R", max: 5, cost: 70, desc: "Fire rate" },
  { id: "pierce", branch: "FIREPOWER", label: "P", max: 3, cost: 110, desc: "Pierce" },
  { id: "hp", branch: "SURVIVAL", label: "H", max: 5, cost: 70, desc: "Hit pips" },
  { id: "armor", branch: "SURVIVAL", label: "A", max: 4, cost: 85, desc: "Contact resist" },
  { id: "pickup", branch: "SURVIVAL", label: "M", max: 4, cost: 55, desc: "Magnet" },
  { id: "xp", branch: "FORTUNE", label: "X", max: 5, cost: 65, desc: "XP gain" },
  { id: "ink", branch: "FORTUNE", label: "$", max: 5, cost: 65, desc: "INK gain" },
  { id: "luck", branch: "FORTUNE", label: "L", max: 4, cost: 90, desc: "Drops / crit" },
];

export const MUTATIONS = [
  { id: "rate", name: "STACCATO", desc: "+18% fire rate", apply: (r) => (r.rate *= 1.18) },
  { id: "dmg", name: "WEIGHT", desc: "+1 bullet damage", apply: (r) => (r.dmg += 1) },
  { id: "pierce", name: "THROUGH", desc: "+1 pierce", apply: (r) => (r.pierce += 1) },
  { id: "spread", name: "TIGHT", desc: "−35% spread", apply: (r) => (r.spread *= 0.65) },
  { id: "speed", name: "GLIDE", desc: "+12% move speed", apply: (r) => (r.speed *= 1.12) },
  { id: "dash", name: "AFTERIMAGE", desc: "+1 dash charge", apply: (r) => (r.dashes += 1) },
  { id: "hp", name: "THICK", desc: "+2 hit pips", apply: (r) => { r.maxHp += 2; r.hp += 2; } },
  { id: "vamp", name: "INKFEED", desc: "4% chance to heal on kill", apply: (r) => (r.vamp += 0.04) },
  { id: "explode", name: "PUNCTATE", desc: "Kills pop for 2 dmg", apply: (r) => (r.explode = true) },
  { id: "magnet", name: "PULL", desc: "Pickup radius +60%", apply: (r) => (r.magnet *= 1.6) },
  { id: "crit", name: "EDGE", desc: "+12% crit (2× dmg)", apply: (r) => (r.crit += 0.12) },
  { id: "ghost", name: "PHASE", desc: "Dash lasts +40ms", apply: (r) => (r.dashTime += 0.04) },
  { id: "ricochet", name: "BANK", desc: "Bullets bounce once", apply: (r) => (r.bounce += 1) },
  { id: "double", name: "ECHO", desc: "8% chance to double-shot", apply: (r) => (r.echo += 0.08) },
  { id: "perfect", name: "CLARITY", desc: "Perfect dodge restores a dash", apply: (r) => (r.clarity = true) },
  { id: "xp", name: "READER", desc: "+20% XP", apply: (r) => (r.xpMul *= 1.2) },
  { id: "size", name: "BOLD", desc: "Bigger bullets, +knock", apply: (r) => { r.bsize *= 1.35; r.knock *= 1.3; } },
  { id: "overdash", name: "KICK", desc: "Dash deals 2 contact", apply: (r) => (r.dashDmg = 2) },
  { id: "slow", name: "SERIF", desc: "Hits slow glyphs", apply: (r) => (r.slow = true) },
  { id: "chain", name: "LIGATURE", desc: "Kills arc to a nearby glyph", apply: (r) => (r.chain = true) },
];

export const SHOP = [
  { id: "heal", name: "REPRINT", desc: "Restore 3 pips", cost: 18, apply: (r) => (r.hp = Math.min(r.maxHp, r.hp + 3)) },
  { id: "full", name: "CLEAN COPY", desc: "Full heal", cost: 40, apply: (r) => (r.hp = r.maxHp) },
  { id: "dash", name: "EXTRA STEP", desc: "+1 dash this run", cost: 28, apply: (r) => (r.dashes += 1) },
  { id: "dmg", name: "BOLD FACE", desc: "+1 damage this run", cost: 32, apply: (r) => (r.dmg += 1) },
  { id: "rate", name: "ITALIC", desc: "+15% fire rate", cost: 24, apply: (r) => (r.rate *= 1.15) },
  { id: "hp", name: "LEADING", desc: "+2 max pips and heal them", cost: 30, apply: (r) => { r.maxHp += 2; r.hp += 2; } },
  { id: "weapon", name: "NEW SORT", desc: "Grab a random extra weapon", cost: 36, apply: (r, g) => g.grantRandomWeapon() },
  { id: "reroll", name: "KERNING", desc: "+8% crit", cost: 22, apply: (r) => (r.crit += 0.08) },
];

const DIGIT = (n) => ({
  glyph: String(n),
  name: `DIGIT ${n}`,
  hp: n,
  speed: 72 + (9 - n) * 10,
  radius: 11 + n * 0.9,
  contact: 1,
  color: n >= 7 ? "#ff9a4a" : "#ff6b4a",
  kind: "digit",
  score: n,
  xp: n,
});

export const GLYPHS = {
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), DIGIT(n)])),
  0: { glyph: "0", name: "ZERO", hp: 3, speed: 95, radius: 14, contact: 1, color: "#ffd36a", kind: "bomb", score: 8, xp: 6, fuse: 1.1 },
  A: { glyph: "A", name: "ACE", hp: 4, speed: 175, radius: 13, contact: 1, color: "#ff5a7a", kind: "rush", score: 6, xp: 5 },
  B: { glyph: "B", name: "BRICK", hp: 18, speed: 55, radius: 20, contact: 2, color: "#8b93a7", kind: "tank", score: 16, xp: 12 },
  C: { glyph: "C", name: "CASTER", hp: 6, speed: 70, radius: 14, contact: 1, color: "#b9a7ff", kind: "caster", score: 10, xp: 8, shotCd: 1.6 },
  D: { glyph: "D", name: "DASHER", hp: 7, speed: 90, radius: 14, contact: 1, color: "#7ad7ff", kind: "dasher", score: 12, xp: 9 },
  F: { glyph: "F", name: "FLANK", hp: 5, speed: 130, radius: 13, contact: 1, color: "#7dffb3", kind: "flank", score: 8, xp: 7 },
  H: { glyph: "H", name: "HIVE", hp: 10, speed: 50, radius: 18, contact: 1, color: "#ffd36a", kind: "hive", score: 14, xp: 10 },
  K: { glyph: "K", name: "KNIGHT", hp: 12, speed: 80, radius: 16, contact: 1, color: "#c9a0ff", kind: "knight", score: 14, xp: 10 },
  O: { glyph: "O", name: "ORBIT", hp: 8, speed: 110, radius: 14, contact: 1, color: "#7ad7ff", kind: "orbit", score: 11, xp: 8 },
  P: { glyph: "P", name: "PERIOD", hp: 6, speed: 65, radius: 14, contact: 1, color: "#ff9a4a", kind: "mortar", score: 12, xp: 9, shotCd: 2.1 },
  S: { glyph: "S", name: "SNIPER", hp: 5, speed: 85, radius: 13, contact: 1, color: "#ff5a4a", kind: "sniper", score: 13, xp: 10, shotCd: 1.8 },
  T: { glyph: "T", name: "TURRET", hp: 9, speed: 0, radius: 16, contact: 1, color: "#8b93a7", kind: "turret", score: 12, xp: 9, shotCd: 1.35 },
  X: { glyph: "X", name: "SPLIT", hp: 8, speed: 90, radius: 16, contact: 1, color: "#ffd36a", kind: "split", score: 15, xp: 12 },
  Z: { glyph: "Z", name: "ZETA", hp: 40, speed: 95, radius: 34, contact: 2, color: "#e8edf5", kind: "boss", score: 80, xp: 40, shotCd: 0.9 },
  W: { glyph: "W", name: "WAVE", hp: 55, speed: 70, radius: 38, contact: 2, color: "#7ad7ff", kind: "boss", score: 100, xp: 50, shotCd: 0.75 },
  M: { glyph: "M", name: "MASS", hp: 70, speed: 55, radius: 42, contact: 2, color: "#ffd36a", kind: "boss", score: 120, xp: 60, shotCd: 1.05 },
};

export const CODEX_ORDER = "1234567890ABCDFHKOPSTXZW M".replace(" ", "").split("");

export function wavePlan(n) {
  const t = 1 + n * 0.12;
  if (n % 10 === 0) {
    const boss = n >= 30 ? "M" : n >= 20 ? "W" : "Z";
    return { name: `BOSS  ${boss}`, budget: 0, glyphs: [], elites: [], boss, t };
  }
  if (n % 5 === 0) return { name: "PRINTER", budget: 0, glyphs: [], shop: true, t };
  const tables = [
    { name: "ONES", glyphs: ["1", "1", "2"] },
    { name: "COUNT", glyphs: ["1", "2", "3", "4"] },
    { name: "VOWELS", glyphs: ["A", "A", "1", "2"] },
    { name: "MIXED", glyphs: ["1", "2", "3", "A", "F"] },
    { name: "TYPE", glyphs: ["2", "3", "C", "T"] },
    { name: "RUSH", glyphs: ["A", "F", "D", "2"] },
    { name: "HEAVY", glyphs: ["5", "7", "B", "K"] },
    { name: "PUNCT", glyphs: ["0", "P", "S", "3"] },
    { name: "HIVE", glyphs: ["H", "1", "1", "2", "X"] },
    { name: "STORM", glyphs: ["A", "C", "D", "S", "6", "8"] },
  ];
  const pack = tables[(n - 1) % tables.length];
  const budget = Math.floor(8 + n * 2.4);
  return { name: pack.name, budget, glyphs: pack.glyphs, t };
}

export function skillRank(save, id) {
  return save.skills[id] || 0;
}

export function skillCost(def, rank) {
  return Math.floor(def.cost * (1 + rank * 0.65));
}
