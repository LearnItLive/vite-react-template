import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post("/api/analyze", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    let bytes: number[] | null = null;
    // Optional parameters
    let photoType = "face";
    let ageGroup = "unspecified";
    let gender = "unspecified";
    let focusAreas: string[] = [];
    let tone = "friendly";
    let length = "medium";

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = (formData.get("file") as File) || (formData.get("image") as File);
      if (!file || !(file instanceof File)) {
        return c.json({ error: "Missing 'file' in form-data" }, 400);
      }
      const arrayBuffer = await file.arrayBuffer();
      bytes = [...new Uint8Array(arrayBuffer)];

      photoType = (formData.get("photoType") as string) || photoType;
      // Accept alternate fields per new UI
      const mode = (formData.get("mode") as string) || "";
      if (mode === "full-body") photoType = "full";
      if (mode === "face") photoType = "face";
      ageGroup =
        (formData.get("ageGroup") as string) ||
        (formData.get("ageRange") as string) ||
        ageGroup;
      gender = (formData.get("gender") as string) || gender;
      try {
        const fa = formData.get("focusAreas") as string | null;
        if (fa) focusAreas = JSON.parse(fa);
      } catch {
        focusAreas = [];
      }
      tone = (formData.get("tone") as string) || tone;
      length = (formData.get("length") as string) || length;
    } else {
      // Fallback to raw binary body (application/octet-stream)
      const arrayBuffer = await c.req.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return c.json({ error: "Empty request body" }, 400);
      }
      bytes = [...new Uint8Array(arrayBuffer)];
    }

    // Map length to max tokens
    const maxTokens =
      length === "short" ? 128 : length === "detailed" ? 512 : 256;

    // Build focus text
    const focusText =
      focusAreas && focusAreas.length > 0
        ? `Focus areas: ${focusAreas.join(", ")}.`
        : "Focus on posture, facial expression, grooming, outfit, and lighting/background as applicable.";

    // Tone
    const toneDirective =
      tone === "neutral"
        ? "Respond in a neutral, concise, professional tone."
        : "Respond in a friendly, encouraging, supportive tone.";

    // Persona and safety rules
    const rules = [
      "Be kind and constructive; avoid negative or judgmental language.",
      "Do not guess or infer race, ethnicity, health conditions, disabilities, or socioeconomic status.",
      "When discussing body composition, be gentle and non-judgmental. Focus on how clothing fit, posture, and fitness can affect silhouette and impression. Do not give medical advice.",
      "No medical, legal, or professional advice; general appearance guidance only.",
      "Keep language gender-inclusive and stereotype-free. If gender is unspecified or non-binary, keep feedback gender-neutral.",
      "Offer practical, respectful tips the user can try today.",
    ].join(" ");

    const demographics =
      ageGroup !== "unspecified" || gender !== "unspecified"
        ? `User context: age group ${ageGroup}${
            gender !== "unspecified" ? `, gender ${gender}` : ""
          }.`
        : "User context: age and gender unspecified.";

    const scope =
      photoType === "full"
        ? "This is likely a full-body photo; consider overall posture, outfit coordination, and presence."
        : "This is likely a face/upper-body photo; consider expression, grooming, and framing.";

    const prompt = [
      "You are 'GlowUp Guide', a supportive appearance coach.",
      scope,
      demographics,
      focusText,
      toneDirective,
      rules,
      "Task: Evaluate whether this photo is suitable for a dating profile, rate it from 1-10, and provide concrete, kind feedback on hair, grooming, clothing, posture/expression, and lighting/background.",
      "Important constraints: Do NOT identify real people or compare the subject to specific celebrities. If offering 'vibes' or 'archetypes', keep them non-identifying (e.g., 'clean-cut leading', 'outdoorsy adventurer', 'artsy indie').",
      "If image quality (blurriness, low light, heavy filters) or composition (cropping, cluttered background) affects suitability, mention that briefly.",
      "Output format: Return ONLY a valid JSON object (no markdown, no extra commentary) matching this exact schema:",
      `{
        "overallTier": "A" | "B" | "C",
        "tierLabel": string,
        "summary": string,
        "strengths": { "title": "Strengths", "items": string[] },
        "gentleSuggestions": { "title": "Gentle suggestions", "items": string[] },
        "styleIdeas": { "title": "Style ideas", "items": string[] },
        "suitability": {
          "rating": number,
          "verdict": "use" | "consider" | "avoid",
          "reasons": string[]
        },
        "archetypes": {
          "styleArchetypes": string[],
          "characterVibes": string[]
        },
        "disclaimer": string
      }`,
      "Populate each array with 3-6 concise bullets. Keep the tone supportive and actionable.",
    ].join(" ");

    const ai: any = (c.env as any).AI ?? (c.env as any).ai_image_binding;
    if (!ai || typeof ai.run !== "function") {
      return c.json(
        { error: "Workers AI binding not configured (expected AI or ai_image_binding)" },
        500,
      );
    }
    // Prefer Llama 3.2 Vision with messages format; fallback to LLaVA if unavailable
    let response: any;
    try {
      const visionInput = {
        messages: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image: bytes },
            ],
          },
        ],
        max_tokens: maxTokens,
      };
      response = await ai.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        visionInput,
      );
    } catch (e) {
      console.error("Primary model failed, falling back to llava:", e);
      const fallbackInput = { image: bytes, prompt, max_tokens: maxTokens };
      response = await ai.run("@cf/llava-hf/llava-1.5-7b-hf", fallbackInput);
    }

    // If the model returned JSON as a string, parse and return the object
    const tryParse = (val: unknown) => {
      if (typeof val !== "string") return null;
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    };
    let payload: any = response;
    if (response && typeof response === "object") {
      const candidates = [
        (response as any).output,
        (response as any).response,
        (response as any).description,
      ];
      for (const cnd of candidates) {
        const parsed = tryParse(cnd as any);
        if (parsed && parsed.overallTier && parsed.summary) {
          payload = parsed;
          break;
        }
      }
    }

    return c.json(payload);
  } catch (err) {
    console.error("Analyze error:", err);
    return c.json({ error: "Failed to analyze image" }, 500);
  }
});

export default app;
