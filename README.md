# Bottles Up!

A 3D conveyor arcade game for the SUJA crew. **Load the bin. Stand the bottles. Catch the bad ones. Find your flow.**

![Bottles Up! artwork](assets/share.jpg)

The short feeder meets a long fixed-speed conveyor at a right angle. Tip the bin just enough for a trickle, regulate the feeder, stand bottles, and inspect their labels, caps, and fill levels before they reach the machine.

## Included

- Station perspective and complete overhead cameras, animated bin loading and tipping, stainless factory scenery, and SUJA bottle models.
- Three-minute ranked shifts, endless mode, and pressure-free practice.
- Four juice varieties, bin-based levels, combos, occasional tipping bottles, congestion, machine penalties, and overflow losses.
- Purple mystery bonuses: timed helper crew, line stop, spare stop card, quality sweep, or bonus points.
- Full Flow: 34 good bottles standing triggers 10 seconds of triple points.
- Touch and desktop controls, a short camera introduction, results screen, original synthesized music and effects, reduced-effects option, app icons, and share artwork.
- Shared SUJA accounts, saved runs, and host challenge seeds through the companion [Game Center](https://github.com/seansommer/sujagamecenter).

**Setup status:** the new SUJA database URL is configured. Firebase Web app `apiKey` and `appId` remain to be supplied. The game is playable as a guest; online account and ranking features require the [hub setup](https://github.com/seansommer/sujagamecenter/blob/main/docs/SETUP.md).

Intended published address: `https://seansommer.github.io/bottlesup/`.

## Run locally

Use Node 22 or newer.

```sh
npm ci
npm test
npm run build
npm run dev -- --host 0.0.0.0
```

The development server serves `dist`; rebuild after editing source. The GitHub Actions workflow builds, tests, and publishes that directory after GitHub Pages is enabled.

## Controls

| Action | Desktop / touch |
| --- | --- |
| Load a bin | L / Load bin |
| Raise or lower the dumper | Hold ↑ or ↓ / hold the matching button |
| Hold the current tilt | Release the raise/lower control |
| Change feeder speed | First conveyor slider |
| Stand a bottle | Click or tap a fallen bottle on the long belt |
| Reject a bottle | R / Reject mode, then tap; or right-click |
| Stop the long conveyor | Space / Stop card |
| Open a bonus | Tap the purple ? |
| Change camera | V / view button |
| Pause | Escape / pause button |

Only the short conveyor has adjustable speed. Stop cards and mystery stops temporarily halt the long conveyor. Loading requires an empty bin and a lowered dumper. Practice does not end from waste and never enters the rankings.

## 3D assets and architecture

The game uses Three.js and genuine mesh assets. Four juice bottles, four crew models, and a bin are supplied as editable `.glb` files in `assets/models`. [Model notes](docs/MODELS.md) explain Blender/Unreal import and regeneration. The browser game does not require Blender or Unreal to run.

`src/simulation.js` is a deterministic, fixed-step rules engine. `src/scene.js` renders the 3D plant; `src/fallback.js` provides a labeled overhead compatibility view when WebGL cannot initialize. `src/main.js` handles input, UI, sound, and community integration. Art uses the user's SUJA product and plant references; uploaded workplace photos and employee images are not published.

See [game design](docs/GAME-DESIGN.md) and [verification](docs/VERIFICATION.md) for scoring, tuning, and current limits.
Bottles Up - Game
