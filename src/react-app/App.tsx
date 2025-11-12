// src/App.tsx

import { useState } from "react";
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
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>Photo type:</label>
          <label style={{ marginRight: 8 }}>
            <input
              type="radio"
              name="photoType"
              value="face"
              checked={photoType === "face"}
              onChange={() => setPhotoType("face")}
            />{" "}
            Face
          </label>
          <label>
            <input
              type="radio"
              name="photoType"
              value="full"
              checked={photoType === "full"}
              onChange={() => setPhotoType("full")}
            />{" "}
            Full body
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 8 }}>
            Age group:
            <select
              value={ageGroup}
              onChange={(e) =>
                setAgeGroup(e.target.value as typeof ageGroup)
              }
              style={{ marginLeft: 6 }}
            >
              <option value="unspecified">Prefer not to say</option>
              <option value="13-17">13-17</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-49">35-49</option>
              <option value="50+">50+</option>
            </select>
          </label>
          <label style={{ marginLeft: 12 }}>
            Gender:
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as typeof gender)}
              style={{ marginLeft: 6 }}
            >
              <option value="unspecified">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary / Other</option>
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 8, textAlign: "left" }}>
          <div style={{ marginBottom: 6 }}><strong>Focus areas</strong></div>
          {["posture", "expression", "grooming", "outfit", "lighting"].map(
            (k) => (
              <label key={k} style={{ marginRight: 12 }}>
                <input
                  type="checkbox"
                  checked={focusAreas.includes(k)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFocusAreas((prev) => {
                      if (checked) return Array.from(new Set([...prev, k]));
                      return prev.filter((x) => x !== k);
                    });
                  }}
                />{" "}
                {k}
              </label>
            ),
          )}
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 12 }}>
            Tone:
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              style={{ marginLeft: 6 }}
            >
              <option value="friendly">Friendly & supportive</option>
              <option value="neutral">Neutral & concise</option>
            </select>
          </label>
          <label>
            Length:
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as typeof length)}
              style={{ marginLeft: 6 }}
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
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
        <div style={{ marginBottom: 8, textAlign: "left", fontSize: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />{" "}
            I understand this is AI-generated guidance for general appearance
            only — not health, medical, or professional advice.
          </label>
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
