import React, { useState } from "react";
import "./App.css";
import { Tabs, RadioGroup } from "radix-ui";
import { SparklesIcon, CameraIcon } from "@radix-ui/react-icons";

export type AnalysisMode = "face" | "full-body";

interface AnalysisSection {
  title: string;
  items: string[];
}

interface AnalysisResult {
  overallTier: "A" | "B" | "C";
  tierLabel: string;
  summary: string;
  strengths: AnalysisSection;
  gentleSuggestions: AnalysisSection;
  styleIdeas: AnalysisSection;
}

const initialResult: AnalysisResult | null = null;

const App: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>("face");
  const [gender, setGender] = useState<string>("unspecified");
  const [ageRange, setAgeRange] = useState<string>("25-34");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(initialResult);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const next = event.target.files?.[0];
    setFile(next ?? null);
  };

  const coerceResult = (json: any): AnalysisResult => {
    if (
      json &&
      json.overallTier &&
      json.tierLabel &&
      json.summary &&
      json.strengths &&
      json.gentleSuggestions &&
      json.styleIdeas
    ) {
      return json as AnalysisResult;
    }
    const text =
      json?.description ?? json?.response ?? json?.output ?? String(json);
    return {
      overallTier: "B",
      tierLabel: "Solid, with standout features",
      summary: typeof text === "string" ? text : JSON.stringify(text),
      strengths: { title: "Strengths", items: [] },
      gentleSuggestions: { title: "Gentle suggestions", items: [] },
      styleIdeas: { title: "Style ideas", items: [] },
    };
  };

  const handleAnalyze = async () => {
    setError(null);
    setResult(initialResult);

    if (!file) {
      setError("Please add a clear photo (face or full body) to analyze.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mode", mode);
      formData.append("gender", gender);
      formData.append("ageRange", ageRange);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Analysis failed. Please try another photo.");
      }

      const json = await res.json();
      setResult(coerceResult(json));
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong running the analysis. Please try again in a moment.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="AppRoot">
      <main className="AppShell">
        <section>
          <div className="AppHeroHighlight">
            <SparklesIcon width={14} height={14} />
            Gentle appearance coaching — AI-assisted
          </div>
          <h1 className="AppHeroTitle">
            Understand your look, without the harshness.
          </h1>
          <p className="AppHeroBody">
            Upload a photo and get kind, objective-style feedback on things you
            can celebrate and areas you can refine — posture, grooming, style,
            and more.
          </p>
          <ul className="AppHeroList">
            <li>• Focus on strengths first.</li>
            <li>• Concrete ideas you can act on.</li>
            <li>• No insults or harsh scoring — ever.</li>
          </ul>
          <div className="AppHeroBadgeRow">
            <span className="AppHeroBadge">
              Private — photos never shared with others
            </span>
            <span className="AppHeroBadge">Powered by Cloudflare Workers AI</span>
          </div>
        </section>

        <section>
          <div className="Card" style={{ marginBottom: 12 }}>
            <div className="CardTitleRow">
              <div>
                <div className="CardKicker">Step 1 · Upload</div>
                <div className="CardTitle">Choose what to analyze</div>
              </div>
              <span className="SecondaryPill">
                <CameraIcon width={12} height={12} /> Face or full body
              </span>
            </div>

            <Tabs.Root
              className="TabsRoot"
              value={mode}
              onValueChange={(val) => setMode(val as AnalysisMode)}
            >
              <Tabs.List className="TabsList" aria-label="What to analyze">
                <Tabs.Trigger className="TabsTrigger" value="face">
                  Face focus
                </Tabs.Trigger>
                <Tabs.Trigger className="TabsTrigger" value="full-body">
                  Full body
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content className="TabsContent" value="face">
                <p className="CardSub">
                  Use a clear, well-lit photo where your face is mostly straight
                  toward the camera.
                </p>
              </Tabs.Content>
              <Tabs.Content className="TabsContent" value="full-body">
                <p className="CardSub">
                  Use a photo where your full body is visible — this helps with
                  posture, proportion, and outfit feedback.
                </p>
              </Tabs.Content>
            </Tabs.Root>

            <div className="FormGrid">
              <label className="FieldLabel">
                Photo
                <input
                  className="FileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>

              <div>
                <span className="FieldLabel">How should we tailor feedback?</span>
                <div className="RadioRow">
                  <RadioGroup.Root
                    className="RadioRow"
                    value={gender}
                    onValueChange={setGender}
                    aria-label="Presentation"
                  >
                    <RadioChip value="woman" label="Feminine" />
                    <RadioChip value="man" label="Masculine" />
                    <RadioChip value="nonbinary" label="Androgynous / other" />
                    <RadioChip value="unspecified" label="No preference" />
                  </RadioGroup.Root>
                </div>
                <p className="FieldHelp">
                  This only influences style suggestions, not your “score”.
                </p>
              </div>

              <label className="FieldLabel">
                Age range
                <select
                  className="SelectTrigger"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                >
                  <option value="18-24">18–24</option>
                  <option value="25-34">25–34</option>
                  <option value="35-44">35–44</option>
                  <option value="45-54">45–54</option>
                  <option value="55+">55+</option>
                </select>
              </label>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button
                type="button"
                className="PrimaryButton"
                onClick={handleAnalyze}
                disabled={isLoading}
              >
                {isLoading ? "Analyzing gently…" : "Run analysis"}
              </button>
              <div className="FieldHelp">
                We focus on small, realistic changes — not perfection.
              </div>
            </div>

            {error && (
              <p
                className="FieldHelp"
                style={{ marginTop: 8, background: "var(--app-danger-soft)", padding: 6, borderRadius: 10 }}
              >
                {error}
              </p>
            )}

            {isLoading && (
              <div className="LoadingRow" style={{ marginTop: 8 }}>
                <span className="LoadingDot" />
                <span className="LoadingDot" />
                <span className="LoadingDot" />
                <span>Looking for strengths and gentle ideas…</span>
              </div>
            )}
          </div>

          <div className="Card">
            <div className="CardTitleRow">
              <div>
                <div className="CardKicker">Step 2 · Feedback</div>
                <div className="CardTitle">Your appearance snapshot</div>
              </div>
            </div>

            <ResultsView result={result} mode={mode} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;

interface RadioChipProps {
  value: string;
  label: string;
}

const RadioChip: React.FC<RadioChipProps> = ({ value, label }) => {
  return (
    <RadioGroup.Item className="RadioChip" value={value}>
      <span className="RadioDot">
        <span className="RadioDotInner" />
      </span>
      <span>{label}</span>
    </RadioGroup.Item>
  );
};

interface ResultsViewProps {
  result: AnalysisResult | null;
  mode: AnalysisMode;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, mode }) => {
  if (!result) {
    return (
      <div className="ResultEmpty">
        Upload a photo and run the analysis to see strengths, soft tiering, and
        realistic improvement ideas tailored to your{" "}
        {mode === "face" ? "face" : "full-body"} photo.
      </div>
    );
  }

  const tierClass =
    result.overallTier === "A"
      ? "TierTag"
      : result.overallTier === "B"
        ? "TierTag TierTag--neutral"
        : "TierTag TierTag--soft";

  return (
    <div className="ResultPanel">
      <div className="ResultBadgeRow">
        <span className={tierClass}>
          Tier {result.overallTier}: {result.tierLabel}
        </span>
      </div>
      <p className="CardSub" style={{ marginTop: 6 }}>
        {result.summary}
      </p>

      <ResultSection section={result.strengths} />
      <ResultSection section={result.gentleSuggestions} />
      <ResultSection section={result.styleIdeas} />
    </div>
  );
};

interface ResultSectionProps {
  section: AnalysisSection;
}

const ResultSection: React.FC<ResultSectionProps> = ({ section }) => {
  if (!section.items.length) return null;

  return (
    <div>
      <div className="ResultSectionTitle">{section.title}</div>
      <ul className="ResultList">
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};


