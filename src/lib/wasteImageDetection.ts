/**
 * Browser-side waste hints from COCO-SSD object labels (fallback when the YOLO API is unavailable).
 * Maps common detected objects to listing category, title, and hazard level.
 */

export type WasteDetectionResult = {
  category: string;
  suggested_title: string;
  hazard_level: string;
  confidence: number;
  suggested_description: string;
};

const BASE: Omit<WasteDetectionResult, "confidence" | "suggested_description"> = {
  category: "other",
  suggested_title: "Mixed / general waste material",
  hazard_level: "none",
};

/** Builds a listing description from detector output (used for COCO, YOLO API, or manual wiring). */
export function buildSuggestedDescription(opts: {
  title: string;
  category: string;
  hazard_level: string;
  confidence: number;
  /** e.g. COCO class name or YOLO model key */
  primary_label?: string;
  other_labels?: string[];
}): string {
  const pct = Math.min(100, Math.max(0, opts.confidence * 100)).toFixed(0);
  const head = opts.primary_label
    ? `Image detection: "${opts.primary_label}" (${pct}% confidence).`
    : `Estimated match confidence: ${pct}%.`;

  const blocks = [
    head,
    `Suggested listing: ${opts.title}. Category: ${opts.category}. Hazard level: ${opts.hazard_level}.`,
  ];

  const others = opts.other_labels?.filter(Boolean) ?? [];
  if (others.length) {
    blocks.push(`Other objects detected in the image: ${[...new Set(others)].slice(0, 6).join(", ")}.`);
  }

  blocks.push(
    "Please review and edit this text. Add quantity, condition, packaging, contamination, storage, and any regulatory or pickup constraints before publishing.",
  );

  return blocks.join("\n\n");
}

/** COCO class name (lowercase) -> waste listing fields */
const COCO_CLASS_TO_WASTE: Record<string, Omit<WasteDetectionResult, "confidence" | "suggested_description">> = {
  bottle: { category: "plastic", suggested_title: "Plastic bottles / containers", hazard_level: "low" },
  cup: { category: "plastic", suggested_title: "Plastic cups / disposables", hazard_level: "low" },
  "wine glass": { category: "glass", suggested_title: "Glass waste", hazard_level: "low" },
  bowl: { category: "glass", suggested_title: "Glass / ceramic containers", hazard_level: "low" },
  fork: { category: "metal", suggested_title: "Metal utensils / scrap", hazard_level: "low" },
  knife: { category: "metal", suggested_title: "Metal utensils / scrap", hazard_level: "low" },
  spoon: { category: "metal", suggested_title: "Metal utensils / scrap", hazard_level: "low" },
  scissors: { category: "metal", suggested_title: "Metal scrap / tools", hazard_level: "low" },
  laptop: { category: "electronic", suggested_title: "Electronic device / e-waste", hazard_level: "medium" },
  "cell phone": { category: "electronic", suggested_title: "Electronic device / e-waste", hazard_level: "medium" },
  keyboard: { category: "electronic", suggested_title: "Electronic components", hazard_level: "medium" },
  mouse: { category: "electronic", suggested_title: "Electronic peripherals", hazard_level: "low" },
  tv: { category: "electronic", suggested_title: "Electronic display / e-waste", hazard_level: "medium" },
  microwave: { category: "electronic", suggested_title: "Electronic appliance", hazard_level: "medium" },
  oven: { category: "metal", suggested_title: "Metal appliance / scrap", hazard_level: "low" },
  refrigerator: { category: "metal", suggested_title: "Large metal appliance", hazard_level: "medium" },
  toaster: { category: "electronic", suggested_title: "Small appliance", hazard_level: "low" },
  sink: { category: "metal", suggested_title: "Metal fixture / scrap", hazard_level: "low" },
  clock: { category: "electronic", suggested_title: "Electronic / metal scrap", hazard_level: "low" },
  book: { category: "organic", suggested_title: "Paper / cardboard waste", hazard_level: "none" },
  vase: { category: "glass", suggested_title: "Glass / ceramic", hazard_level: "low" },
  "teddy bear": { category: "textile", suggested_title: "Textile / soft waste", hazard_level: "none" },
  backpack: { category: "textile", suggested_title: "Textile / fabric waste", hazard_level: "none" },
  umbrella: { category: "textile", suggested_title: "Mixed material waste", hazard_level: "low" },
  handbag: { category: "textile", suggested_title: "Textile / mixed waste", hazard_level: "low" },
  suitcase: { category: "plastic", suggested_title: "Plastic / mixed containers", hazard_level: "low" },
  frisbee: { category: "plastic", suggested_title: "Plastic waste", hazard_level: "low" },
  skis: { category: "plastic", suggested_title: "Plastic / composite scrap", hazard_level: "low" },
  snowboard: { category: "plastic", suggested_title: "Plastic / composite scrap", hazard_level: "low" },
  surfboard: { category: "plastic", suggested_title: "Plastic / composite scrap", hazard_level: "low" },
  kite: { category: "textile", suggested_title: "Textile / plastic mixed", hazard_level: "low" },
  skateboard: { category: "plastic", suggested_title: "Plastic / metal scrap", hazard_level: "low" },
  "baseball bat": { category: "organic", suggested_title: "Wood / organic scrap", hazard_level: "none" },
  "baseball glove": { category: "textile", suggested_title: "Leather / textile waste", hazard_level: "none" },
  "tennis racket": { category: "plastic", suggested_title: "Plastic / composite scrap", hazard_level: "low" },
  "potted plant": { category: "organic", suggested_title: "Organic / green waste", hazard_level: "none" },
  bed: { category: "textile", suggested_title: "Bulky textile / furniture scrap", hazard_level: "low" },
  "dining table": { category: "organic", suggested_title: "Wood / furniture scrap", hazard_level: "low" },
  toilet: { category: "other", suggested_title: "Sanitary / ceramic waste (handle per regulations)", hazard_level: "medium" },
  "hair drier": { category: "electronic", suggested_title: "Small electronic appliance", hazard_level: "low" },
  toothbrush: { category: "plastic", suggested_title: "Plastic waste", hazard_level: "low" },
  banana: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  apple: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  sandwich: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  orange: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  broccoli: { category: "organic", suggested_title: "Organic green waste", hazard_level: "none" },
  carrot: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  "hot dog": { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  pizza: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  donut: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  cake: { category: "organic", suggested_title: "Organic food waste", hazard_level: "none" },
  chair: { category: "organic", suggested_title: "Wood / furniture scrap", hazard_level: "low" },
  couch: { category: "textile", suggested_title: "Bulky furniture / textile scrap", hazard_level: "low" },
  bench: { category: "metal", suggested_title: "Metal / wood scrap", hazard_level: "low" },
  car: { category: "metal", suggested_title: "Vehicle / metal scrap (industrial)", hazard_level: "medium" },
  motorcycle: { category: "metal", suggested_title: "Vehicle / metal scrap", hazard_level: "medium" },
  bicycle: { category: "metal", suggested_title: "Metal / mixed scrap", hazard_level: "low" },
  airplane: { category: "metal", suggested_title: "Metal / composite scrap", hazard_level: "high" },
  bus: { category: "metal", suggested_title: "Large vehicle scrap", hazard_level: "medium" },
  train: { category: "metal", suggested_title: "Metal scrap", hazard_level: "medium" },
  truck: { category: "metal", suggested_title: "Vehicle / metal scrap", hazard_level: "medium" },
  boat: { category: "metal", suggested_title: "Fiberglass / metal scrap", hazard_level: "medium" },
  "traffic light": { category: "electronic", suggested_title: "Electronic / metal scrap", hazard_level: "medium" },
  "fire hydrant": { category: "metal", suggested_title: "Metal scrap", hazard_level: "low" },
  "stop sign": { category: "metal", suggested_title: "Metal sign scrap", hazard_level: "low" },
  "parking meter": { category: "metal", suggested_title: "Metal / electronic scrap", hazard_level: "low" },
  bird: { category: "organic", suggested_title: "Organic / biological (check local rules)", hazard_level: "medium" },
  cat: { category: "organic", suggested_title: "Organic waste (not typical listing)", hazard_level: "none" },
  dog: { category: "organic", suggested_title: "Organic waste (not typical listing)", hazard_level: "none" },
  horse: { category: "organic", suggested_title: "Organic / agricultural", hazard_level: "low" },
  sheep: { category: "organic", suggested_title: "Organic / agricultural", hazard_level: "low" },
  cow: { category: "organic", suggested_title: "Organic / agricultural", hazard_level: "low" },
  elephant: { category: "organic", suggested_title: "Organic (unusual)", hazard_level: "none" },
  bear: { category: "organic", suggested_title: "Organic (unusual)", hazard_level: "none" },
  zebra: { category: "organic", suggested_title: "Organic (unusual)", hazard_level: "none" },
  giraffe: { category: "organic", suggested_title: "Organic (unusual)", hazard_level: "none" },
  person: { category: "other", suggested_title: "General waste / scene (no specific object)", hazard_level: "none" },
};

function mapCocoClass(className: string): Omit<WasteDetectionResult, "confidence" | "suggested_description"> {
  const key = className.trim().toLowerCase();
  const mapped = COCO_CLASS_TO_WASTE[key];
  return mapped ? { ...BASE, ...mapped } : { ...BASE };
}

let cocoModelPromise: ReturnType<typeof import("@tensorflow-models/coco-ssd").load> | null = null;

function getCocoModel() {
  if (!cocoModelPromise) {
    cocoModelPromise = import("@tensorflow-models/coco-ssd").then((cocoSsd) => cocoSsd.load());
  }
  return cocoModelPromise;
}

/**
 * Runs COCO-SSD in the browser and returns the best waste-related guess.
 */
export async function detectWasteFromImageFile(file: File): Promise<WasteDetectionResult | null> {
  await import("@tensorflow/tfjs");
  const model = await getCocoModel();

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.crossOrigin = "anonymous";

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = url;
    });

    const predictions = await model.detect(img);
    URL.revokeObjectURL(url);

    if (!predictions.length) {
      return null;
    }

    predictions.sort((a, b) => b.score - a.score);
    const top = predictions[0];
    const mapped = mapCocoClass(top.class);
    const otherLabels = predictions.slice(1, 8).map((p) => p.class);
    const suggested_description = buildSuggestedDescription({
      title: mapped.suggested_title,
      category: mapped.category,
      hazard_level: mapped.hazard_level,
      confidence: top.score,
      primary_label: top.class,
      other_labels: otherLabels,
    });
    return {
      ...mapped,
      confidence: top.score,
      suggested_description,
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Browser detection failed");
  }
}
