# Gameplay Guide

A plain-language guide to how Penalty Kings actually works.

---

## The match

- **5 rounds** per side (you shoot 5 times, you keep 5 times — roles alternate each turn).
- **Most goals wins.**
- **Tied after 5?** Sudden death — each side takes one more shot per pair; first to score when the other doesn't wins.

---

## Your two jobs

Every turn you are either:

| Role | What you do |
|------|-------------|
| **Shooter** | Aim and kick the ball into the goal |
| **Keeper** | Pick where to dive to make a save |

The HUD shows **"You shoot"** or **"You keep"** at the top.

---

## When you are SHOOTING

### Camera
You see your **player from behind**, ball at the penalty spot, goal ahead.

### Controls
1. **Press** on/near your player (bottom of screen)
2. **Drag upward** toward the goal
3. A **dashed yellow arc** shows where the ball will go
4. **Release** to kick

### Power
- **Short drag** = softer shot
- **Longer drag/hold** = harder shot
- **Too much power** (>90%) can cause a miss (ball goes wide/over)

### Important
- You do **not** tap the goal directly when shooting
- Drag **up** from the player — the game maps your direction to a spot on the goal (hidden 3×3 grid)

---

## When you are KEEPING

### Camera
You see the **goalkeeper from behind**, goal in front, opponent far away at the top.

### Controls
1. Wait ~1 second while the opponent lines up
2. **Tap a zone on the goal** where you want to dive
3. Blue highlights show tappable areas

### Important
- You **tap** the goal — you don't drag
- Different control from shooting (this is a common source of confusion)

---

## After each shot

1. Ball flies, keeper dives
2. Result banner: **GOAL** / **SAVED** / **MISSED**
3. Score updates (`You X – Y AI` or `You X – Y Opp`)
4. Roles **swap** for the next turn

---

## Shot clock

- **8 seconds** per turn (shown as "Clock" top-right)
- If time runs out, the game auto-plays for you (usually center zone, medium power)

---

## Solo vs AI — turn order

| Round | You | AI |
|-------|-----|-----|
| 1 | Shoot | Keep |
| 2 | Keep | Shoot |
| 3 | Shoot | Keep |
| 4 | Keep | Shoot |
| 5 | Shoot | Keep |

---

## Online vs friend

Same rules, but:
- Host shoots first in round 1
- Both players must **Ready** in the lobby before the host clicks **Start Match**
- Server decides all outcomes (you can't fake a goal)

See [Multiplayer](./09-MULTIPLAYER.md) for lobby steps.

---

## Outcomes explained

| Result | Meaning |
|--------|---------|
| **GOAL** | Ball went in; keeper didn't save it |
| **SAVED** | Keeper's dive overlapped the shot zone (within save radius + save roll) |
| **MISSED** | Shot went wide/over (usually very high power) |

See [Scoring Rules](./10-SCORING-RULES.md) for technical details.

---

## Quick cheat sheet

```
SHOOTING:  press → drag UP → release
KEEPING:   wait → TAP goal zone
```
