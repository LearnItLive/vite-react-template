// src/App.tsx

import { useState } from "react";
import * as Label from "@radix-ui/react-label";
import * as RadioGroup from "@radix-ui/react-radio-group";
import * as Select from "@radix-ui/react-select";
import * as Checkbox from "@radix-ui/react-checkbox";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import honoLogo from "./assets/hono.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("unknown");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoType, setPhotoType] = useState<"face" | "full">("face");
  const [ageGroup, setAgeGroup] = useState<
    "unspecified" | "13-17" | "18-24" | "25-34" | "35-49" | "50+"
  >("unspecified");
  const [gender, setGender] = useState<
    "unspecified" | "female" | "male" | "non-binary"
  >("unspecified");
  const [focusAreas, setFocusAreas] = useState<string[]>([
    "posture",
    "expression",
    "grooming",
  ]);
  const [tone, setTone] = useState<"friendly" | "neutral">("friendly");
  const [length, setLength] = useState<"short" | "medium" | "detailed">(
    "medium",
  );
  const [consent, setConsent] = useState(false);

  const handleAnalyze = async () => {
    try {
      setError(null);
      setFeedback("");
      if (!selectedFile) {
        setError("Please select an image file first.");
        return;
      }
      if (!consent) {
        setError("Please confirm consent to receive AI-generated feedback.");
        return;
      }
      setLoading(true);
      const form = new FormData();
      form.append("file", selectedFile);
      form.append("photoType", photoType);
      form.append("ageGroup", ageGroup);
      form.append("gender", gender);
      form.append("focusAreas", JSON.stringify(focusAreas));
      form.append("tone", tone);
      form.append("length", length);
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }
      const data = await res.json();
      const text =
        data?.description ??
        data?.response ??
        data?.output ??
        JSON.stringify(data);
      setFeedback(typeof text === "string" ? text : JSON.stringify(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://hono.dev/" target="_blank">
          <img src={honoLogo} className="logo cloudflare" alt="Hono logo" />
        </a>
        <a href="https://workers.cloudflare.com/" target="_blank">
          <img
            src={cloudflareLogo}
            className="logo cloudflare"
            alt="Cloudflare logo"
          />
        </a>
      </div>
      <h1>Vite + React + Hono + Cloudflare</h1>
      <div style={{ marginBottom: 8, opacity: 0.9 }}>
        <strong>GlowUp Guide</strong> — friendly appearance feedback using Workers AI.
      </div>
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label="increment"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <button
          onClick={() => {
            fetch("/api/")
              .then((res) => res.json() as Promise<{ name: string }>)
              .then((data) => setName(data.name));
          }}
          aria-label="get name"
        >
          Name from API is: {name}
        </button>
        <p>
          Edit <code>worker/index.ts</code> to change the name
        </p>
      </div>
      <div className="card">
        <h2>Image Feedback (Workers AI)</h2>
        <div style={{ marginBottom: 8, textAlign: "left" }}>
          <Label.Root htmlFor="photoType"><strong>Photo type</strong></Label.Root>
          <RadioGroup.Root
            id="photoType"
            value={photoType}
            onValueChange={(v) => setPhotoType(v as typeof photoType)}
            style={{ display: "flex", gap: 12, marginTop: 6 }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <RadioGroup.Item
                value="face"
                aria-label="Face"
                className="rg-item"
              />
              <Label.Root onClick={() => setPhotoType("face")}>Face</Label.Root>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <RadioGroup.Item
                value="full"
                aria-label="Full body"
                className="rg-item"
              />
              <Label.Root onClick={() => setPhotoType("full")}>Full body</Label.Root>
            </div>
          </RadioGroup.Root>
        </div>
        <div style={{ marginBottom: 8, textAlign: "left", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Label.Root><strong>Age group</strong></Label.Root>
            <Select.Root value={ageGroup} onValueChange={(v) => setAgeGroup(v as typeof ageGroup)}>
              <Select.Trigger className="select-trigger" aria-label="Age group">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="select-content">
                  <Select.Viewport>
                    <Select.Item value="unspecified" className="select-item"><Select.ItemText>Prefer not to say</Select.ItemText></Select.Item>
                    <Select.Item value="13-17" className="select-item"><Select.ItemText>13-17</Select.ItemText></Select.Item>
                    <Select.Item value="18-24" className="select-item"><Select.ItemText>18-24</Select.ItemText></Select.Item>
                    <Select.Item value="25-34" className="select-item"><Select.ItemText>25-34</Select.ItemText></Select.Item>
                    <Select.Item value="35-49" className="select-item"><Select.ItemText>35-49</Select.ItemText></Select.Item>
                    <Select.Item value="50+" className="select-item"><Select.ItemText>50+</Select.ItemText></Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
          <div>
            <Label.Root><strong>Gender</strong></Label.Root>
            <Select.Root value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
              <Select.Trigger className="select-trigger" aria-label="Gender">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="select-content">
                  <Select.Viewport>
                    <Select.Item value="unspecified" className="select-item"><Select.ItemText>Prefer not to say</Select.ItemText></Select.Item>
                    <Select.Item value="female" className="select-item"><Select.ItemText>Female</Select.ItemText></Select.Item>
                    <Select.Item value="male" className="select-item"><Select.ItemText>Male</Select.ItemText></Select.Item>
                    <Select.Item value="non-binary" className="select-item"><Select.ItemText>Non-binary / Other</Select.ItemText></Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
        <div style={{ marginBottom: 8, textAlign: "left" }}>
          <div style={{ marginBottom: 6 }}><strong>Focus areas</strong></div>
          {["posture", "expression", "grooming", "outfit", "lighting"].map(
            (k) => (
              <span key={k} style={{ marginRight: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Checkbox.Root
                  checked={focusAreas.includes(k)}
                  onCheckedChange={(checked) => {
                    setFocusAreas((prev) => {
                      if (checked === true) return Array.from(new Set([...prev, k]));
                      return prev.filter((x) => x !== k);
                    });
                  }}
                  className="cb-root"
                  aria-label={k}
                >
                  <Checkbox.Indicator />
                </Checkbox.Root>
                <Label.Root
                  onClick={() =>
                    setFocusAreas((prev) =>
                      prev.includes(k)
                        ? prev.filter((x) => x !== k)
                        : [...prev, k],
                    )
                  }
                >
                  {k}
                </Label.Root>
              </span>
            ),
          )}
        </div>
        <div style={{ marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Label.Root><strong>Tone</strong></Label.Root>
            <Select.Root value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <Select.Trigger className="select-trigger" aria-label="Tone">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="select-content">
                  <Select.Viewport>
                    <Select.Item value="friendly" className="select-item"><Select.ItemText>Friendly & supportive</Select.ItemText></Select.Item>
                    <Select.Item value="neutral" className="select-item"><Select.ItemText>Neutral & concise</Select.ItemText></Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
          <div>
            <Label.Root><strong>Length</strong></Label.Root>
            <Select.Root value={length} onValueChange={(v) => setLength(v as typeof length)}>
              <Select.Trigger className="select-trigger" aria-label="Length">
                <Select.Value />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="select-content">
                  <Select.Viewport>
                    <Select.Item value="short" className="select-item"><Select.ItemText>Short</Select.ItemText></Select.Item>
                    <Select.Item value="medium" className="select-item"><Select.ItemText>Medium</Select.ItemText></Select.Item>
                    <Select.Item value="detailed" className="select-item"><Select.ItemText>Detailed</Select.ItemText></Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setSelectedFile(f || null);
              setFeedback("");
              setError(null);
            }}
            aria-label="select image file"
          />
        </div>
        {selectedFile && (
          <div style={{ marginBottom: 8 }}>
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="preview"
              style={{ maxHeight: 160, borderRadius: 8 }}
              onLoad={(e) => {
                // Revoke object URL after load to avoid memory leaks
                URL.revokeObjectURL((e.target as HTMLImageElement).src);
              }}
            />
          </div>
        )}
        <div style={{ marginBottom: 8, textAlign: "left", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Checkbox.Root
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="cb-root"
            aria-label="consent"
          >
            <Checkbox.Indicator />
          </Checkbox.Root>
          <Label.Root onClick={() => setConsent((v) => !v)}>
            I understand this is AI-generated guidance for general appearance
            only — not health, medical, or professional advice.
          </Label.Root>
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleAnalyze} disabled={loading || !selectedFile}>
            {loading ? "Analyzing..." : "Get Feedback"}
          </button>
        </div>
        {error && <p style={{ color: "#f66" }}>{error}</p>}
        {feedback && (
          <div style={{ marginTop: 12, textAlign: "left" }}>
            <strong>Feedback:</strong>
            <p>{feedback}</p>
          </div>
        )}
      </div>
      <p className="read-the-docs">Click on the logos to learn more</p>
    </>
  );
}

export default App;
