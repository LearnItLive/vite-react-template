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
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return c.json({ error: "Missing 'file' in form-data" }, 400);
      }
      const arrayBuffer = await file.arrayBuffer();
      bytes = [...new Uint8Array(arrayBuffer)];

      photoType = (formData.get("photoType") as string) || photoType;
      ageGroup = (formData.get("ageGroup") as string) || ageGroup;
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
      "Avoid commenting on weight or body size; emphasize posture, presence, grooming, clothing fit, color harmony, and confidence.",
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
      "Provide concise, constructive feedback in 1-2 short paragraphs with 1 actionable next step.",
    ].join(" ");

    const input = { image: bytes, prompt, max_tokens: maxTokens };

    const ai: any = (c.env as any).AI ?? (c.env as any).ai_image_binding;
    if (!ai || typeof ai.run !== "function") {
      return c.json(
        { error: "Workers AI binding not configured (expected AI or ai_image_binding)" },
        500,
      );
    }

    const response = await ai.run(
      "@cf/unum/uform-gen2-qwen-500m",
      input,
    );

    return c.json(response);
  } catch (err) {
    console.error("Analyze error:", err);
    return c.json({ error: "Failed to analyze image" }, 500);
  }
});

export default app;
