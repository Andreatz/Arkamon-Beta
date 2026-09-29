# VFX Asset Strategy

## Goal

Keep Arkamon's battle VFX visually coherent, lightweight and safe to redistribute while
the renderer moves from single GIF overlays to semantic, multi-step VFX recipes.

## Current repository baseline

The existing `public/vfx/moves` library contains PNG sprite sheets and animated GIFs.
The recipe engine must remain backward-compatible with those assets while they are
replaced incrementally.

## Asset quality gate

Before a new external VFX is committed:

1. Verify the original source and license.
2. Prefer CC0/public-domain assets for reusable primitives.
3. Keep a transparent background; do not bake battle backgrounds into effects.
4. Prefer reusable primitives (slash, spark, smoke, ring, flare, trail) over one-off
   full-screen animations.
5. Normalize dimensions and crop unused transparent padding before shipping.
6. Prefer sprite sheets / WebP-ready frame sequences over GIF when timing precision
   or alpha quality matters.
7. Test the asset in `AdminVfxEditor` on both battle sides and at compact viewport size.
8. Record the source below before merging.

## Approved candidate sources

| Source | Useful content | License | Imported |
| --- | --- | --- | --- |
| Kenney Particle Pack — https://kenney.nl/assets/particle-pack | 80 modular 512×512 particles: slashes, sparks, fire, smoke, magic, trails | CC0 | **Yes (selected primitives)** |
| OpenGameArt: 2D Spell Effects — https://opengameart.org/content/2d-spell-effects | 10 elemental/spell effects with transparent PNG frames | CC0 | No |
| OpenGameArt: Fire and Spell Animations — https://opengameart.org/content/fire-and-spell-animations | Transparent 512×512 spell sprite sheets | CC0 | No |
| OpenGameArt: Pixel Art Spells — https://opengameart.org/content/pixel-art-spells | Small editable projectile/beam/shield primitives | CC0 | No |

The pixel-art pack is a lower-priority candidate because its native 16×16 aesthetic may
not match the current high-resolution battle presentation without substantial restyling.

## Recommended first external primitives

The first imported CC0 batch should stay small and composable:

- one clean slash texture;
- one spark texture;
- one smoke texture;
- one magic ring / flare;
- one fire particle;
- one trail.

These should augment recipes rather than replace every existing animation at once.

## Custom procedural VFX

Prefer procedural CSS/Framer effects when they are simple and style-neutral. The first
example is the type-colored impact shockwave in `BattagliaScene`. Procedural effects
have effectively zero asset download cost, can inherit move-type colors and remain easy
to tune globally.

## Formats

- Static primitive: transparent PNG or WebP.
- Precisely timed animation: sprite sheet / frame sequence.
- Decorative animation: animated WebP can be evaluated after browser/Tauri compatibility tests.
- GIF: supported for backward compatibility, but avoid for new production assets when a
  better alpha-capable format is practical.
- Effekseer: reserve evaluation for Supreme/evolution/cinematic effects after the 2D recipe
  system is stable.

## Provenance

When an external asset is actually imported, add a row containing:

- local path;
- original asset name;
- author/source;
- source URL;
- license;
- modifications performed (crop, recolor, resize, frame removal, conversion).


## Imported provenance

The following files were copied byte-for-byte from the public GitHub mirror
`Calinou/kenney-particle-pack`. Their Git blob hashes in Arkamon match the upstream
blob hashes, which makes provenance easy to audit. The upstream pack and its bundled
`LICENSE.txt` identify the work as Kenney's Particle Pack under CC0 1.0 Universal.

| Local path | Upstream original | Upstream blob SHA | License | Modifications |
| --- | --- | --- | --- | --- |
| `public/vfx/primitives/kenney/slash_03.png` | `addons/kenney_particle_pack/slash_03.png` | `31f250ab448fcd8c767a4960c6fbc7105b326fa5` | CC0-1.0 | None |
| `public/vfx/primitives/kenney/spark_04.png` | `addons/kenney_particle_pack/spark_04.png` | `6eaf328696ec8640571a69318b6211223c14224e` | CC0-1.0 | None |
| `public/vfx/primitives/kenney/magic_03.png` | `addons/kenney_particle_pack/magic_03.png` | `47c4a22ff7b104ec9ab8926bd6e68d8709fe7b1a` | CC0-1.0 | None |
| `public/vfx/primitives/kenney/smoke_05.png` | `addons/kenney_particle_pack/smoke_05.png` | `4a77199d4ddab9d6482d8285ed3cd962983d8ffa` | CC0-1.0 | None |

A copy of the upstream license is kept next to the imported files at
`public/vfx/primitives/kenney/LICENSE.txt`.

### Vertical-slice usage

- **Vyrath #1 — Soffio (#1):** neutral projectile/focus/spark recipe.
- **Vyrath #1 — Brezza Profumata (#111):** nature shimmer plus magic focus.
- **Wormaren #13 — Sotterrare (#82):** heavy ground impact plus spark/dust.
- **Wormaren #13 — Scottatura (#192):** fire pulse plus smoke/spark impact.

These recipes deliberately combine existing Arkamon VFX with small CC0 primitives so
the art direction can be evaluated before wholesale asset replacement.
