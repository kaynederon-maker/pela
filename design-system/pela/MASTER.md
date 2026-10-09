# Pela design system: "the pet passport"

Pela records who a pet is and the care they've had, so the interface borrows from a passport: an ID page with a photo and a machine-readable zone, and pages that fill with ink stamps. Everything else stays quiet so those two objects carry the personality.

Sources: shadcn/ui v4 (via MCP, restyled), UI UX Pro Max (UX rules, motion and accessibility checks; its generated orange/blue claymorphism palette was rejected as generic), the Cadence and Hero-Minimal-Motion guides and React Bits / Lenis from the local design repository.

## Color

One working accent. Stamp inks appear only on stamps and care-type chips.

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--background` paper | `#F4EEE3` | page ground, warm, never white | |
| `--foreground` ink | `#1C211E` | text | 14.1:1 |
| `--card` | `#FBF7EF` | raised paper | |
| `--muted-foreground` | `#5C584F` | secondary text | 6.1:1 |
| `--primary` persimmon | `#C2441F` | CTAs, active, focus ring | 4.8:1 with cream text |
| `--primary-ink` | `#A93A19` | persimmon used as small text | ≥4.5:1 |
| `--moss` | `#203329` | dark chapter bands, inverse surfaces | 11.6:1 with paper |
| `--border` | `#DCD2BF` | hairlines | |
| stamp inks | teal `#2B6468` · fawn `#8E5A2B` · persimmon · moss `#3E6B4F` · rose `#9E4E44` · ink | care kinds | ≥4.3:1 (large/bold only) |

User accent preference (profile) swaps `--primary`: fawn → persimmon, sage → `#3E6B4F`, blush → `#B4534A`.
No purple, no cool greys, no pure black or white.

## Type

- **Bricolage Grotesque** (variable, optical size): headings and UI. Headings weight 650–750, tracking −0.035em, leading 0.95–1.05.
- **Instrument Serif** italic: one or two emphasis words per heading, never body copy.
- **JetBrains Mono**: wallet addresses, IDs, block-style labels, the passport MRZ line. Uppercase labels at 11–12px, tracking 0.12em.
- Scale: hero `clamp(3rem, 7.5vw, 6.5rem)`, H2 `clamp(2.25rem, 4.5vw, 3.75rem)`, H3 1.375rem, body 1.0625rem/1.6, small 0.875rem.

## Shape and space

- Radius: controls 14px, cards 22px, dialogs 26px, pills full. Stamps: circles, rounded rectangles and an octagon, slightly rotated.
- Spacing on a 4px grid; sections `clamp(5rem, 10vw, 9rem)`; content max 1200px; 20px mobile gutter.
- Elevation is print, not glow: a 1px border plus a hard offset shadow (`0 2px 0` ink at 8–12%) on interactive paper; soft long shadows only on the passport card and dialogs.
- Texture: an SVG fractal-noise grain over the whole page at 5% opacity (static, `pointer-events: none`).

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | entrances, reveals, route changes |
| `--ease-press` | `cubic-bezier(.23,1,.32,1)` | presses |
| durations | 140 / 220 / 320 / 680 ms | press / hover / state / reveal |

- Lenis smooth scroll site-wide (off under reduced motion).
- Route change: 320ms fade + 12px rise.
- Signature moments: the passport card tilts toward the cursor with a foil glare; stamps land with an ink "thud" (scale 1.35 → 1, slight rotation, blur → sharp); doodle underlines draw in; the hero passport collects its stamps as you scroll through "How a record is born".
- Micro: buttons press down 1px and lose their offset shadow; the primary CTA has paw-colored click sparks and a gentle magnet on pointer devices.
- Animate only transform, opacity, filter and stroke-dashoffset. Content is readable without JS. `prefers-reduced-motion` turns off scroll-linked motion, loops, tilt, magnet and sparks and shows final states.

## Icons and imagery

- Lucide icons (1.75px stroke), never emoji, as UI icons. Care kinds: Syringe (vaccination), Bone (meal), Medal (training), Stethoscope (checkup), Bath (grooming), PawPrint (other).
- Photography: the real Pechi and Bella, regenerated in ComfyUI on paper-colored backdrops (`assets/comfyui/from-photos.mjs`).
- Hand-drawn SVG doodles (squiggle underline, arrow, paw trail) in ink or persimmon, 2px round strokes.

## Components (shadcn v4, restyled)

Button (primary, ink, outline, ghost, link; 44px default), Input/Textarea/Label (52px fields, mono labels above), Badge (as small stamp chips), Dialog (paper sheet, ink scrim with blur), Tabs (pill track with an ink thumb), Select, Tooltip (ink, mono), Sonner toasts (paper notes, bottom center).

## UX rules carried over from UI UX Pro Max

44×44px minimum targets, visible focus everywhere (2px persimmon ring), labels above fields with errors directly below, loading and disabled states on every action, `cursor-pointer` on clickables, no horizontal scroll from 360px up, one `h1` per route, `alt` text on every photo.
