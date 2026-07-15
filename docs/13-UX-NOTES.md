# UX Notes

Known confusion points, design decisions, and improvement ideas from playtesting.

---

## Why players get confused

### 1. Different controls per role

| Role | Input |
|------|-------|
| Shooter | **Drag up** from player |
| Keeper | **Tap** goal zone |

There is no on-screen reminder that controls change when the role switches.

### 2. Camera switches every turn

- **Shooter view:** behind your player, goal ahead
- **Keeper view:** behind the goal, keeper in front

The entire screen layout changes when roles swap. Easy to disorient.

### 3. Hidden aim grid when shooting

The goal uses a 3×3 zone grid internally, but:
- **Shooting:** no visible grid — only a trajectory arc
- **Keeping:** blue dive zones are visible

Players don't know they're aiming at invisible zones.

### 4. Drag direction not obvious

Shooting requires dragging **upward** from the penalty spot. Dragging sideways or tapping the goal does nothing useful.

Hint text ("Drag toward goal · Release to shoot") is small and at the top.

### 5. Keeper wait period

When AI shoots, there's ~0.8s before dive zones become active (`opponentAimTimer` in `state.ts`). During this time tapping does nothing — feels unresponsive.

### 6. Power is invisible

Power is determined by how long you hold the drag, but there's no clear power meter during the drag (only a meter appears in some phases).

---

## What works well

- Trajectory preview arc gives good feedback when dragging correctly
- Humanoid characters make roles clearer than the original block shapes
- Shot clock creates urgency
- GOAL / SAVED / MISSED banners are clear
- Dual camera gives appropriate perspective per role (when understood)

---

## Bugs fixed during development

| Bug | Cause | Fix |
|-----|-------|-----|
| Game stuck after every shot | `resetBall()` called every frame in game loop | Only reset when ball not active |
| Instant zone lock confusing | Click jumped straight to power phase | Changed to drag-release single gesture |
| Camera lerp jitter | Layout interpolating every frame | Instant camera cut on role change |

---

## Suggested improvements (not yet implemented)

### High impact

1. **Big on-screen action prompt** — "DRAG UP TO SHOOT" / "TAP TO DIVE" centered on canvas, not just HUD
2. **Visible goal targets when shooting** — show 9 zones or at least L/C/R hints
3. **Consistent camera** — one angle for both roles
4. **Unified input** — tap target on goal for both shoot and keep (shooter picks zone, keeper picks zone)
5. **Power bar during drag** — show power filling as you hold

### Medium impact

6. Tutorial overlay on first match
7. Keeper phase: show "Opponent lining up…" countdown
8. Haptic feedback on mobile
9. Replay camera on goals

### Low impact

10. Net ripple animation on goals
11. Crowd ambience toggle
12. Player names in online mode

---

## Current HUD hints

From `MatchHUD.tsx`:

| State | Hint shown |
|-------|------------|
| Shooter + AIM | "Drag toward goal · Release to shoot" |
| Keeper + AIM | "Tap where to dive" |
| SHOOT | "…" |
| RESOLVE | GOAL / SAVED / MISSED |

---

## Related docs

- [Gameplay Guide](./04-GAMEPLAY.md) — full player instructions
- [Client Package](./05-CLIENT.md) — input and rendering code paths
- [Development Phases](./02-PHASES.md) — Phase 1.5 UX redesign history
