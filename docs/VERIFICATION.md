# Verification — 17 September 2026

Local production builds completed for both repositories. The simulation and community unit suites passed: **13 gameplay tests and 4 community tests**. The Firebase Realtime Database emulator passed **25 access tests** for the new SUJA-only rules.

The access suite covers profile creation, private profile/directory separation, self-promotion prevention, master protection, recipient matching, mailbox privacy, host challenge permissions, immutable own scores, basic score plausibility, practice exclusion, closed challenges, and master score moderation. Fixtures stayed in the local emulator; no real profiles, messages, or scores were created.

Browser checks confirmed the game menu, starting a guest shift, loading, feeder input, reject mode, stop-card use, and pause. The game also starts at a 390px phone layout. The hub home, empty Hall of Fame, player cards, and 390px phone layout were checked without fabricating player data.

## Remaining live checks

The provided database URL is wired into both apps. The new Firebase Web app `apiKey` and `appId` are not yet available, so real cross-app sign-in, production score saves, messages, and master setup cannot be verified until those are configured and Anonymous Authentication and the new rules are enabled.

The cloud preview browser explicitly disables WebGL. Its checks exercised the labeled 2D compatibility renderer. The Three.js build and nine GLB model files are present, but final 3D appearance, camera framing, touch hit accuracy, and frame rate still need a hardware-accelerated desktop/phone pass. The richer promotional artwork should not be mistaken for an in-game screenshot.

No Blender or Unreal connection was available. Editable models are included for those tools, while this playable release runs in the browser.

Scores are client-reported with database validation and master moderation. They are not server-verified replays. Identity deliberately preserves the original email + nickname flow and is not verified-email authentication.

GitHub Pages deployment additionally requires the repository's Pages source to be enabled. See the SUJA hub setup guide for the exact steps; a build passing does not establish that the public site is live.
