# Pela · ComfyUI assets

Four images, all saved to `web/public/images/<name>.png`. The app uses each PNG when it exists and falls back to the bundled SVG placeholder otherwise.

| Name | Size | Used on |
|------|------|---------|
| `hero` | 1216×896 | Landing hero, sign-in card |
| `pechi` | 1216×832 | Landing, any pet whose breed contains "Malinois" |
| `bella` | 1216×832 | Landing, every other pet |
| `logo` | 1024×1024 | Nav + favicon (shown at 36px, so keep it bold and simple) |

## Fastest path (automated)

With ComfyUI running on `127.0.0.1:8188`:

```powershell
node assets\comfyui\generate.mjs            # all four
node assets\comfyui\generate.mjs hero logo  # just some
$env:SEED=42; node assets\comfyui\generate.mjs pechi   # new variation
$env:CKPT="sd_xl_base_1.0.safetensors"; node assets\comfyui\generate.mjs
```

`generate.mjs` holds the exact prompts and is the source of truth. It loads `workflow_api.json`, swaps in the prompt, size and seed, queues the job, and downloads the result.

## Manual path (ComfyUI canvas)

Workflow: **Settings ⚙ → Enable Dev mode options**, then **Load** `workflow_api.json`. It's a plain SDXL text-to-image graph:

```
CheckpointLoaderSimple ─┬─ MODEL ──────────────────────────► KSampler ─► VAEDecode ─► SaveImage
  Juggernaut XL v9      ├─ CLIP ─► CLIPTextEncode (positive) ─►  ▲   ▲        ▲
                        ├─ CLIP ─► CLIPTextEncode (negative) ─►  │   │        │
                        └─ VAE ──────────────────────────────────┼───┼────────┘
EmptyLatentImage (W×H) ──────────────────────────────────────────┘   │
KSampler: steps 32 · cfg 5.5 · dpmpp_2m · karras · denoise 1.0 · seed 20261007
```

Any SDXL photo checkpoint works (Juggernaut XL, RealVisXL, base SDXL). For SD 1.5, halve the sizes.

### Shared style suffix (append to the three photo prompts)
> soft editorial pet photography, warm cream and fawn color palette, minimalist composition, airy negative space, natural window light, shallow depth of field, gentle film grain, elegant, joyful, high detail fur, 85mm lens

### Photo negative prompt
> text, watermark, logo, signature, frame, blurry, deformed, extra limbs, extra legs, extra tail, bad anatomy, mutated paws, fused dogs, cartoon, illustration, lowres, jpeg artifacts, oversaturated, harsh shadows, cluttered background

### hero: 1216×896 · seed 7
> (exactly two dogs:1.4) sitting side by side, on the left a (small fluffy white mixed-breed dog with brown patches and long floppy ears:1.4), on the right a (Belgian Malinois with fawn coat, black mask and tall upright ears:1.1), both happy with tongues out, cream linen backdrop, soft sage green wall, *+ style suffix*

Negative: `(three dogs:1.5), (identical dogs:1.3), puppies,` *+ photo negative*

Without the count and weights, SDXL "bleeds" the Malinois into every dog and you get three Malinois. If it still happens, try a few seeds, or render Pechi and Bella separately and composite them.

### pechi: 1216×832
> portrait of a young Belgian Malinois dog, alert tall upright ears, short fawn coat with black mask, bright eager eyes, playful head tilt, a tennis ball at its paws, plain warm cream studio backdrop, *+ style suffix*

### bella: 1216×832
> portrait of a sweet medium-sized mixed-breed dog, fluffy cream coat with brown patches, soft floppy ears, pink nose, gentle smile, lying on a blush pink knitted blanket, plain cream backdrop, cozy, *+ style suffix*

### logo: 1024×1024
> minimal flat vector app icon, a single rounded paw print in warm fawn orange (#C8873A) centered on a plain cream background, the two middle toes subtly shaped like one pointed ear and one floppy ear, geometric, clean edges, solid colors, lots of padding, modern brand mark

Negative:
> text, letters, words, watermark, photo, realistic, 3d, gradient, shadow, texture, noise, multiple paws, border, frame, busy, complex details

**Tips**
- SDXL isn't great at logos. Generate 4–8 seeds, pick the cleanest, then trace it in Figma/Illustrator (or run it through a "vectorize" node) for a crisp SVG.
- Using photos of the real Pechi and Bella? Put them into an **IPAdapter (Plus Face)** node between the checkpoint and KSampler at weight ~0.6 and keep the same prompts. The dogs will then actually look like them.
- Palette for colour-matching: cream `#FBF7F1`, ink `#2B2420`, fawn `#C8873A`, sage `#6F8F6A`, blush `#D07B72`.
