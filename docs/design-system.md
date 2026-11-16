# Pela design system: the pet passport, on kraft board

Pela records who a pet is and the care they've had, so the interface borrows from a passport: an ID page with a photo and a machine-readable line, and a book that fills with ink stamps. The page itself is one material, kraft board. Nothing is printed on it in a second colour; everything that matters is pressed into it or sits up on top of it.

Two references shaped it. relevovinco.com, for the single tonal material and the embossed and debossed type. aestudio.studio/goshuin, for moving through records like the pages of a book. Components start from shadcn/ui v4 and are restyled; some motion pieces are adapted from React Bits, and smooth scrolling is Lenis.

## Colour

One hue, in different depths of brown. Stamp inks are the only exception, and they appear only on stamps and care-type chips.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--background` kraft | `#D4B08F` | the board | |
| `--foreground` burnt ink | `#36261A` | body text | 7.2:1 on kraft |
| `--card` | `#DCBD9F` | a lighter sheet laid on the board | 8.2:1 with ink |
| `--muted-foreground` | `#4F3726` | secondary text | 5.4:1 on kraft |
| `--primary` burnish | `#47331F` | main buttons, active states, small accent text | 5.9:1 on kraft |
| `--secondary` | `#47331F` | pressed-in panels (footer, role ticket, closing band) | |
| `--kraft-light` | `#E9C9A6` | text on pressed panels | 7.6:1 |
| `--border` | `#B8916F` | hairlines | |
| `--destructive` | `#7A1712` | delete and retire | 5.3:1 on kraft |
| stamp inks | teal `#2B6468` · fawn `#8E5A2B` · moss `#3E6B4F` · rose `#9E4E44` · ink | care kinds | 3.2 to 3.8:1, so large or bold text only |

A user's accent preference (stored in their profile) swaps the burnish for moss (`#3E6B4F`, small text `#2C4A37`) or rosehip (`#8F3F37`, small text `#6F2E28`). No pure black, no pure white, no cool greys.

## Type

- Gabarito for display: headings in weight 800, uppercase, tracking −0.02em, leading 0.95. `h1` and `h2` with the `display` class are debossed automatically, or embossed when they sit on a pressed panel.
- Instrument Sans for everything you read: body, labels, buttons.
- Instrument Serif italic for one emphasis word per heading. It stays lowercase inside uppercase headings and never sets body copy.
- JetBrains Mono for wallet addresses, IDs, page counters, labels and the passport's machine-readable line. Uppercase labels at 11-12px, tracking 0.12em.
- Scale: hero `clamp(3rem, 7.4vw, 6.4rem)`, H2 `clamp(2.3rem, 4.6vw, 3.8rem)`, H3 1.375rem, body 1.0625rem/1.6, small 0.875rem.

## Depth

The board has three depths, all made with light from the top left.

- `deboss`: text pressed into the board. A light edge below-right and a dark edge above-left.
- `raised`: a sheet sitting on the board (cards, paper panels, outline buttons, the selected item in a list). A lit inner edge, a 1px contact line and a soft shadow underneath.
- `pressed`: a panel pressed down into the board, dark brown with an inner shadow. Text on it is `emboss`, standing up out of it.

Primary buttons are a raised dark-brown block with a hard 2px base; pressing one drops it 2px and removes the shadow. An SVG fractal-noise grain sits over the whole page at 11% (static, `pointer-events: none`), with a soft pool of light in the top right.

## Shape and space

- Radius: controls 14px, cards 22px, dialogs 26px, pills fully round. Stamps are circles, rounded rectangles and an octagon, slightly rotated.
- Spacing on a 4px grid; sections `clamp(5rem, 10vw, 9rem)` apart; content max 1200px; 20px gutters on phones.
- Links in the nav have a dashed underline, like a fold line. The current page gets a solid one that slides between links.

## Moving around: the book

- Contents: a numbered list of the landing chapters, opened from the nav on every page.
- Passports: the pet page has a pager (← Passport 01 / 07 ▾ →). The middle opens a list to jump to any passport, and the arrow keys flip pages unless you're typing or a dialog is open.
- Stamp book: six stamps per page, with Earlier and Older buttons and a page counter. Pages slide in from the direction you turned.
- Roles on the landing page: a numbered list on the left (01 owners, 02 vets and trainers, 03 the desk) picks the ticket shown on the right. Arrow keys move through the list.

## Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | entrances, reveals, route changes, page turns |
| `--ease-press` | `cubic-bezier(.23,1,.32,1)` | presses |
| durations | 140 / 220 / 280-320 / 680 ms | press / hover / state and page turn / reveal |

- Lenis smooth scroll across the site, including in-page `#chapter` links.
- Route change: a 320ms fade with a 12px rise.
- Signature moments: the passport card tilts toward the cursor with a foil glare; stamps land with an ink thud (scale 1.35 → 1, a slight turn, blur to sharp); doodle underlines draw themselves in; the hero passport collects its stamps as you scroll through "How a record is born".
- Small things: buttons press down 1-2px and lose their shadow; the main call to action throws paw-coloured sparks and pulls gently toward a mouse pointer.
- Only transform, opacity, filter and stroke-dashoffset animate. Content is readable without JavaScript.
- Two off switches. The OS `prefers-reduced-motion` setting, and the "Pause motion" button in the corner, which is remembered per browser. Either one stops scroll-linked motion, loops, tilt, magnet, sparks and smooth scrolling, and shows final states.

## Icons and imagery

- Lucide icons at a 1.75px stroke; no emoji as icons. Care kinds: Syringe (vaccination), Bone (meal), Medal (training), Stethoscope (checkup), Bath (grooming), PawPrint (other).
- Photos: the real Pechi and Bella, redrawn in ComfyUI on backdrops that match the board.
- Hand-drawn SVG doodles (squiggle underline, arrow, paw trail) in ink, 2px round strokes.

## Components

Button (primary, ink, outline, ghost, link; 44px tall by default), Input, Textarea and Label (52px fields, mono labels above), Badge (small stamp chips), Dialog (a sheet over a dark blurred backdrop), Tabs (a pill track with an ink thumb), Select, Tooltip (ink, mono), Sonner toasts (paper notes, bottom centre).

## Interaction rules

Touch targets at least 44×44px. A visible focus ring everywhere (2px, the ring colour). Labels above fields, errors directly under them. Every action has a loading and a disabled state. Anything clickable shows a pointer. No sideways scrolling from 360px up. One `h1` per page. Every photo has `alt` text.
