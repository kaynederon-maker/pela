// Re-renders Pechi & Bella from real photos so the site shows *them*, styled to match Pela.
// Pipeline per image (all inside ComfyUI):
//   photo → crop → resize → background removal (RMBG-1.4) → composite on Pela backdrop colour
//   → SDXL img2img (denoise ~0.5) + IPAdapter Plus fed with face crops of the same dog → PNG
// Usage: node assets/comfyui/from-photos.mjs [pechi|bella|hero ...]
// Env:   PHOTOS_DIR (default ../../../Pechi and Bella pics), COMFY_URL, CKPT, SEED
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "web", "public", "images");
const PHOTOS = process.env.PHOTOS_DIR ?? join(HERE, "..", "..", "..", "Pechi and Bella pics");
const COMFY = process.env.COMFY_URL ?? "http://127.0.0.1:8188";
const CKPT = process.env.CKPT ?? "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors";
const POLL_MS = 1500;
const TIMEOUT_MS = 15 * 60 * 1000;

const photo = (suffix) => `WhatsApp Image 2026-10-07 at 20.56.${suffix}.jpeg`;

const PECHI =
  "a slim fawn Belgian Malinois mix dog, short smooth tan coat, black mask fading to grey on the muzzle, " +
  "very large upright pointed ears, warm amber eyes, white toes";
const BELLA =
  "a small short-haired tan and white mixed-breed dog, white blaze down the forehead, dark brindle mask around the eyes, " +
  "white chest and white legs, large upright bat ears, big soulful dark eyes";
const STYLE =
  "soft editorial pet photography, seamless paper studio backdrop, soft diffused window light, gentle shadow under the dog, " +
  "minimalist, elegant, warm and joyful, crisp detailed short fur, sharp eyes, 85mm lens, shallow depth of field";
const NEGATIVE =
  "leather sofa, couch, furniture, blanket, room, clutter, text, watermark, logo, frame, blurry, deformed, extra limbs, " +
  "extra ears, extra legs, bad anatomy, mutated paws, long fur, fluffy fur, cartoon, illustration, oversaturated, harsh light";

// crop = [x, y, w, h] in the 1200×1600 source, chosen to match the target aspect ratio.
// refs = face crops of the same dog for IPAdapter (identity), [file, x, y, w, h].
export const ASSETS = {
  pechi: {
    source: photo("10"), crop: [60, 190, 1140, 780], width: 1216, height: 832, backdrop: 0xf6e6d2,
    prompt: `studio portrait of ${PECHI}, resting calmly and looking down to the side, plain warm cream backdrop, ${STYLE}`,
    refs: [[photo("10"), 690, 200, 420, 640], [photo("1142424"), 500, 560, 440, 480], [photo("09"), 260, 180, 440, 480]],
    denoise: 0.5, ipWeight: 0.6, seed: 11,
  },
  bella: {
    source: photo("1133"), crop: [0, 420, 1200, 822], width: 1216, height: 832, backdrop: 0xf8e1de,
    prompt: `studio portrait of ${BELLA}, lying down with one paw stretched forward, looking at the camera, plain soft blush pink backdrop, ${STYLE}`,
    refs: [[photo("1133"), 390, 440, 520, 520], [photo("103"), 650, 380, 340, 330], [photo("124242424"), 230, 520, 280, 300]],
    denoise: 0.5, ipWeight: 0.6, seed: 12,
  },
  hero: {
    source: photo("124242424"), crop: [0, 280, 1200, 884], width: 1216, height: 896, backdrop: 0xeef0e6,
    prompt:
      `(exactly two dogs:1.3) sitting side by side, on the left ${BELLA}, on the right a taller ${PECHI}, ` +
      `both looking content, plain pale sage and cream backdrop, ${STYLE}`,
    refs: [[photo("124242424"), 0, 280, 1200, 884]],
    denoise: 0.45, ipWeight: 0.35, seed: 13,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function comfy(path, init) {
  const res = await fetch(COMFY + path, init);
  if (!res.ok) throw new Error(`ComfyUI ${path} → ${res.status}: ${await res.text()}`);
  return res;
}

const uploaded = new Map();
async function upload(file) {
  if (!uploaded.has(file)) {
    const form = new FormData();
    form.append("image", new Blob([readFileSync(join(PHOTOS, file))]), `pela_${file.replace(/\s+/g, "_")}`);
    form.append("overwrite", "true");
    uploaded.set(file, (await (await comfy("/upload/image", { method: "POST", body: form })).json()).name);
  }
  return uploaded.get(file);
}

/** Builds the API-format graph. Node ids are generated; edges are [id, outputIndex]. */
async function buildGraph(name, a) {
  const g = {};
  let next = 1;
  const node = (class_type, inputs) => {
    const id = String(next++);
    g[id] = { class_type, inputs };
    return id;
  };
  const cropOf = async (file, [x, y, w, h]) =>
    node("ImageCrop", { image: [node("LoadImage", { image: await upload(file) }), 0], x, y, width: w, height: h });

  // 1. Subject: crop → resize → cut out → composite onto the backdrop colour.
  const crop = await cropOf(a.source, a.crop);
  const sized = node("ImageScale", { image: [crop, 0], upscale_method: "lanczos", width: a.width, height: a.height, crop: "center" });
  const cut = node("easy imageRemBg", { images: [sized, 0], rem_mode: "RMBG-1.4", image_output: "Hide", save_prefix: "pela_cut" });
  const backdrop = node("EmptyImage", { width: a.width, height: a.height, batch_size: 1, color: a.backdrop });
  const plate = node("ImageCompositeMasked", { destination: [backdrop, 0], source: [sized, 0], x: 0, y: 0, resize_source: false, mask: [cut, 1] });

  // 2. Identity: IPAdapter Plus on face crops of the same dog.
  const ckpt = node("CheckpointLoaderSimple", { ckpt_name: CKPT });
  let refs;
  for (const [file, ...box] of a.refs) {
    const prepped = node("PrepImageForClipVision", { image: [await cropOf(file, box), 0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0 });
    refs = refs ? node("ImageBatch", { image1: [refs, 0], image2: [prepped, 0] }) : prepped;
  }
  const model = node("IPAdapterAdvanced", {
    model: [ckpt, 0],
    ipadapter: [node("IPAdapterModelLoader", { ipadapter_file: "ip-adapter-plus_sdxl_vit-h.safetensors" }), 0],
    clip_vision: [node("CLIPVisionLoader", { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" }), 0],
    image: [refs, 0],
    weight: a.ipWeight, weight_type: "linear", combine_embeds: "average", start_at: 0, end_at: 1, embeds_scaling: "V only",
  });

  // 3. Refine: img2img over the composite.
  const sampled = node("KSampler", {
    model: [model, 0],
    positive: [node("CLIPTextEncode", { text: a.prompt, clip: [ckpt, 1] }), 0],
    negative: [node("CLIPTextEncode", { text: NEGATIVE, clip: [ckpt, 1] }), 0],
    latent_image: [node("VAEEncode", { pixels: [plate, 0], vae: [ckpt, 2] }), 0],
    seed: Number(process.env.SEED ?? a.seed), steps: 34, cfg: 5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: a.denoise,
  });
  node("SaveImage", { images: [node("VAEDecode", { samples: [sampled, 0], vae: [ckpt, 2] }), 0], filename_prefix: `pela_photo_${name}` });
  return g;
}

async function render(name) {
  const asset = ASSETS[name];
  if (!asset) throw new Error(`Unknown asset "${name}". Choose from: ${Object.keys(ASSETS).join(", ")}`);
  const { prompt_id } = await (
    await comfy("/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: await buildGraph(name, asset), client_id: randomUUID() }),
    })
  ).json();

  const started = Date.now();
  while (Date.now() - started < TIMEOUT_MS) {
    await sleep(POLL_MS);
    const entry = (await (await comfy(`/history/${prompt_id}`)).json())[prompt_id];
    if (entry?.status?.status_str === "error") {
      const msg = entry.status.messages?.find(([kind]) => kind === "execution_error")?.[1]?.exception_message;
      throw new Error(`ComfyUI failed on ${name}: ${msg ?? "see ComfyUI console"}`);
    }
    const image = entry && Object.values(entry.outputs).flatMap((o) => o.images ?? []).find((i) => i.type === "output");
    if (image) {
      const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder, type: image.type });
      mkdirSync(OUT, { recursive: true });
      const dest = join(OUT, `${name}.png`);
      writeFileSync(dest, Buffer.from(await (await comfy(`/view?${qs}`)).arrayBuffer()));
      return dest;
    }
  }
  throw new Error(`Timed out waiting for ${name}`);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ASSETS);
for (const name of names) {
  process.stdout.write(`Rendering ${name} from photos… `);
  try {
    console.log(`saved ${await render(name)}`);
  } catch (err) {
    console.log("failed");
    console.error(err.message);
    process.exitCode = 1;
  }
}
