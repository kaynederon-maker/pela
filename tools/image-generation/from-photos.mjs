import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "web-app", "public", "images");
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
  "editorial pet photography, seamless warm kraft paper studio backdrop, tan and caramel brown tones, soft directional window light from the left, " +
  "natural soft contact shadow on the paper floor, calm and warm mood, crisp detailed short fur, sharp eyes, 85mm lens, shallow depth of field";
const NEGATIVE =
  "human, person, hand, fingers, jewelry, sofa, couch, leather, cushion, pillow, blanket, furniture, room, window, clutter, harness, straps, " +
  "sticker, cutout, cut-out edges, halo, white background, pink background, green background, grey background, text, watermark, logo, frame, " +
  "blurry, deformed, extra limbs, extra ears, extra legs, bad anatomy, mutated paws, long fur, fluffy fur, cartoon, illustration, oversaturated, harsh light";

export const ASSETS = {
  pechi: {
    source: photo("10"), crop: [0, 260, 1200, 900], width: 1152, height: 864, backdrop: 0xe3c6a4,
    prompt: `studio portrait of ${PECHI}, lying down calmly and looking to the side, on plain warm kraft paper, ${STYLE}`,
    refs: [[photo("10"), 690, 200, 420, 640], [photo("1142424"), 500, 560, 440, 480], [photo("1133333"), 60, 390, 400, 420]],
    erase: [[990, 220, 162, 470], [870, 545, 282, 125]],
    denoise: 0.72, ipWeight: 0.8, seed: 21,
  },
  bella: {
    source: photo("1133"), crop: [0, 420, 1200, 900], width: 1152, height: 864, backdrop: 0xddbd9a,
    prompt: `full body studio portrait of ${BELLA}, lying on a warm kraft paper floor with front paws crossed, head up and looking at the camera, ${STYLE}`,
    refs: [[photo("1133"), 390, 440, 520, 520], [photo("103"), 650, 380, 340, 330], [photo("124242424"), 230, 520, 280, 300]],
    erase: [[770, 130, 382, 190], [700, 20, 160, 80], [775, 300, 377, 110]],
    fromScratch: true, ipWeight: 0.72, seed: 44,
  },
  hero: {
    source: photo("124242424"), crop: [80, 200, 1040, 1337], width: 896, height: 1152, backdrop: 0xd9b793,
    prompt:
      `(exactly two dogs:1.3) sitting side by side on a kraft paper floor, on the left ${BELLA}, on the right a taller ${PECHI}, ` +
      `both looking content, full body, ${STYLE}`,
    refs: [[photo("124242424"), 0, 280, 1200, 884]],
    erase: [[0, 600, 250, 552], [250, 870, 190, 282], [250, 640, 70, 230], [60, 584, 190, 18], [318, 805, 50, 70], [0, 548, 200, 62]],
    denoise: 0.72, ipWeight: 0.6, seed: 23,
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

  const cutout = (image, width, height, erase = []) => {
    const cut = node("easy imageRemBg", { images: [image, 0], rem_mode: "RMBG-1.4", image_output: "Hide", save_prefix: "pela_cut" });
    let mask = node("ThresholdMask", { mask: [cut, 1], value: Number(process.env.MASK_T ?? a.maskThreshold ?? 0.5) });
    for (const [x, y, w, h] of erase) {
      const box = node("SolidMask", { value: 1, width: w, height: h });
      mask = node("MaskComposite", { destination: [mask, 0], source: [box, 0], x, y, operation: "subtract" });
    }
    const backdrop = node("EmptyImage", { width, height, batch_size: 1, color: a.backdrop });
    return node("ImageCompositeMasked", { destination: [backdrop, 0], source: [image, 0], x: 0, y: 0, resize_source: false, mask: [mask, 0] });
  };

  const crop = await cropOf(a.source, a.crop);
  const sized = node("ImageScale", { image: [crop, 0], upscale_method: "lanczos", width: a.width, height: a.height, crop: "center" });
  const plate = cutout(sized, a.width, a.height, a.erase);
  if (process.env.DEBUG_PLATE) {
    node("SaveImage", { images: [plate, 0], filename_prefix: `pela_plate_${name}` });
    return g;
  }

  const ckpt = node("CheckpointLoaderSimple", { ckpt_name: CKPT });
  let refs;
  for (const [file, ...box] of a.refs) {
    const ref = cutout(await cropOf(file, box), box[2], box[3]);
    const prepped = node("PrepImageForClipVision", { image: [ref, 0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0 });
    refs = refs ? node("ImageBatch", { image1: [refs, 0], image2: [prepped, 0] }) : prepped;
  }
  const model = node("IPAdapterAdvanced", {
    model: [ckpt, 0],
    ipadapter: [node("IPAdapterModelLoader", { ipadapter_file: "ip-adapter-plus_sdxl_vit-h.safetensors" }), 0],
    clip_vision: [node("CLIPVisionLoader", { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" }), 0],
    image: [refs, 0],
    weight: Number(process.env.IP_WEIGHT ?? a.ipWeight), weight_type: "linear", combine_embeds: "average", start_at: 0, end_at: 1, embeds_scaling: "V only",
  });

  const sampled = node("KSampler", {
    model: [model, 0],
    positive: [node("CLIPTextEncode", { text: a.prompt, clip: [ckpt, 1] }), 0],
    negative: [node("CLIPTextEncode", { text: NEGATIVE, clip: [ckpt, 1] }), 0],
    latent_image: a.fromScratch
      ? [node("EmptyLatentImage", { width: a.width, height: a.height, batch_size: 1 }), 0]
      : [node("VAEEncode", { pixels: [plate, 0], vae: [ckpt, 2] }), 0],
    seed: Number(process.env.SEED ?? a.seed), steps: 34, cfg: 5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: a.fromScratch ? 1 : Number(process.env.DENOISE ?? a.denoise),
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
      const dest = process.env.DEBUG_PLATE ? join(tmpdir(), `pela_${name}_plate.png`) : join(OUT, `${name}.png`);
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
