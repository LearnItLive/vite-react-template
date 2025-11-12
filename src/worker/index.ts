import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post("/api/analyze", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    let bytes: number[] | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return c.json({ error: "Missing 'file' in form-data" }, 400);
      }
      const arrayBuffer = await file.arrayBuffer();
      bytes = [...new Uint8Array(arrayBuffer)];
    } else {
      // Fallback to raw binary body (application/octet-stream)
      const arrayBuffer = await c.req.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        return c.json({ error: "Empty request body" }, 400);
      }
      bytes = [...new Uint8Array(arrayBuffer)];
    }

    const input = {
      image: bytes,
      prompt:
        "Provide brief, constructive, kind feedback about the person in this image. Focus on posture, expression, and general presentation. Avoid sensitive judgments.",
      max_tokens: 256,
    };

    const response = await c.env.AI.run(
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
