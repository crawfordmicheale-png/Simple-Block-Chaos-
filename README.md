# BLOCK CHAOS

Top-down run-and-gun. You are a shape. Everything trying to kill you is a **number** or a **letter**.

Numbers *are* their hit points — a `9` takes nine hits from a starter pulse. Letters have jobs: `A` rushes, `C` casts, `S` snipes, `X` splits, `Z`/`W`/`M` are bosses.

Visuals stay flat, geometric, and high-contrast. The depth is in the hands.

## Play

Open `index.html` through a local server (ES modules):

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Controls

| Action | Keyboard | Gamepad | Touch |
| --- | --- | --- | --- |
| Move | WASD | Left stick | Left pad |
| Aim | Mouse | Right stick | Right pad |
| Fire | Click / hold | RT | Hold right pad |
| Dash | Space | A | DASH |
| Slide | Shift | LB | — |
| Special | Q | LT | CAST |
| Precision | Ctrl | — | — |
| Swap weapon | R | Y | — |
| Pause | Esc | Start | II |

Dash has i-frames. Clip a punctuation shot during a dash for a **perfect dodge** (brief slow time). Dash into a wall at an angle to **kick** and keep moving. Slide keeps momentum and shrinks the hurtbox.

## Progression

**In a run**

- Waves escalate through digit packs, letter archetypes, a shop every 5, a boss every 10.
- XP levels you into a 1-of-3 **mutation**.
- Glyphs (`$`) buy shop prints. Weapon pickups (`>`) add guns.

**Between runs**

- Bank **INK**.
- Unlock shapes in **SHAPES**.
- Buy permanent ranks in **PROTOCOL**.
- Fill **INTEL** as you dismantle new glyphs.

## Shapes

- **CIRCLE** — pulse, orbit pips
- **SQUARE** — slug, barrier knockback
- **TRIANGLE** — piercing needles, lance dash
- **DIAMOND** — charge rail, prism split
- **HEX** — close spread, nova
- **STAR** — homing sparks, gravity well
