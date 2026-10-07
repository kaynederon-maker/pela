// Renders Pela's images through a local ComfyUI and drops them into web/public/images/.
// Usage: node assets/comfyui/generate.mjs [name ...]     (names: hero pechi bella logo; default all)
// Env:   COMFY_URL (default http://127.0.0.1:8188), CKPT (checkpoint filename), SEED
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "web", "public", "images");
const COMFY = process.env.COMFY_URL ?? "http://127.0.0.1:8188";
const POLL_MS = 1500;
const TIMEOUT_MS = 10 * 60 * 1000;

const STYLE =
  "soft editorial pet photography, warm cream and fawn color palette, minimalist composition, airy negative space, " +
  "natural window light, shallow depth of field, gentle film grain, elegant, joyful, high detail fur, 85mm lens";
const NEGATIVE_PHOTO =
  "text, watermark, logo, signature, frame, blurry, deformed, extra limbs, extra legs, extra tail, bad anatomy, " +
  "mutated paws, fused dogs, cartoon, illustration, lowres, jpeg artifacts, oversaturated, harsh shadows, cluttered background";

export const ASSETS = {
  hero: {
    width: 1216, height: 896, seed: 7,
    // (word:weight) emphasis + an explicit count stops SDXL from cloning the Malinois into every dog.
    prompt:
      "(exactly two dogs:1.4) sitting side by side, on the left a (small fluffy white mixed-breed dog with brown patches " +
      "and long floppy ears:1.4), on the right a (Belgian Malinois with fawn coat, black mask and tall upright ears:1.1), " +
      "both happy with tongues out, cream linen backdrop, soft sage green wall, " + STYLE,
    negative: "(three dogs:1.5), (identical dogs:1.3), puppies, " + NEGATIVE_PHOTO,
  },
  pechi: {
    width: 1216, height: 832,
    prompt:
      "portrait of a young Belgian Malinois dog, alert tall upright ears, short fawn coat with black mask, bright eager eyes, " +
      "playful head tilt, a tennis ball at its paws, plain warm cream studio backdrop, " + STYLE,
    negative: NEGATIVE_PHOTO,
  },
  bella: {
    width: 1216, height: 832,
    prompt:
      "portrait of a sweet medium-sized mixed-breed dog, fluffy cream coat with brown patches, soft floppy ears, pink nose, " +
      "gentle smile, lying on a blush pink knitted blanket, plain cream backdrop, cozy, " + STYLE,
    negative: NEGATIVE_PHOTO,
  },
  logo: {
    width: 1024, height: 1024,
    prompt:
      "minimal flat vector app icon, a single rounded paw print in warm fawn orange (#C8873A) centered on a plain cream " +
      "background, the two middle toes subtly shaped like one pointed ear and one floppy ear, geometric, clean edges, " +
      "solid colors, lots of padding, modern brand mark",
    negative:
      "text, letters, words, watermark, photo, realistic, 3d, gradient, shadow, texture, noise, multiple paws, border, frame, " +
      "busy, complex details",
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function comfy(path, init) {
  const res = await fetch(COMFY + path, init);
  if (!res.ok) throw new Error(`ComfyUI ${path} → ${res.status}: ${await res.text()}`);
  return res;
}

function buildWorkflow(name, spec) {
  const wf = JSON.parse(readFileSync(join(HERE, "workflow_api.json"), "utf8"));
  if (process.env.CKPT) wf["4"].inputs.ckpt_name = process.env.CKPT;
  Object.assign(wf["5"].inputs, { width: spec.width, height: spec.height });
  wf["6"].inputs.text = spec.prompt;
  wf["7"].inputs.text = spec.negative;
  wf["3"].inputs.seed = Number(process.env.SEED ?? spec.seed ?? 20261007);
  wf["9"].inputs.filename_prefix = `pela_${name}`;
  return wf;
}

async function render(name) {
  const spec = ASSETS[name];
  if (!spec) throw new Error(`Unknown asset "${name}". Choose from: ${Object.keys(ASSETS).join(", ")}`);
  const { prompt_id } = await (
    await comfy("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: buildWorkflow(name, spec), client_id: randomUUID() }),
    })
  ).json();

  const started = Date.now();
  while (Date.now() - started < TIMEOUT_MS) {
    await sleep(POLL_MS);
    const entry = (await (await comfy(`/history/${prompt_id}`)).json())[prompt_id];
    if (entry?.status?.status_str === "error") throw new Error(`ComfyUI failed on ${name}`);
    const image = entry && Object.values(entry.outputs).flatMap((o) => o.images ?? [])[0];
    if (image) {
      const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder, type: image.type });
      const bytes = Buffer.from(await (await comfy(`/view?${qs}`)).arrayBuffer());
      mkdirSync(OUT, { recursive: true });
      writeFileSync(join(OUT, `${name}.png`), bytes);
      return join(OUT, `${name}.png`);
    }
  }
  throw new Error(`Timed out waiting for ${name}`);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ASSETS);
for (const name of names) {
  process.stdout.write(`Rendering ${name}… `);
  try {
    console.log(`saved ${await render(name)}`);
  } catch (err) {
    console.log("failed");
    console.error(err.message);
    process.exitCode = 1;
  }
}
