"use client";

import { useState } from "react";
import { CVUpload } from "@/components/cv-upload";
import { VacancyInput } from "@/components/vacancy-input";
import { AnalysisView } from "@/components/analysis-view";
import { Button } from "@/components/ui/button";
import { runAnalysis, type Analysis } from "@/lib/api";
import { Loader2 } from "lucide-react";

type Step = "input" | "analyzing" | "results";

export default function HomePage() {
  const [step, setStep] = useState<Step>("input");
  const [cvText, setCvText] = useState("");
  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [cvId, setCvId] = useState<number | null>(null);
  const [vacancyText, setVacancyText] = useState("");
  const [vacancySource, setVacancySource] = useState<"text" | "url">("text");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAnalyze = cvText.trim().length > 0 && vacancyText.trim().length > 0;

  async function handleAnalyze() {
    setStep("analyzing");
    setError(null);
    try {
      const result = await runAnalysis({
        cv_text: cvText,
        vacancy_text: vacancyText,
        vacancy_source: vacancySource,
        cv_id: cvId ?? undefined,
      });
      setAnalysis(result);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setStep("input");
    }
  }

  function handleReset() {
    setStep("input");
    setCvText("");
    setCvFilename(null);
    setCvId(null);
    setVacancyText("");
    setAnalysis(null);
    setError(null);
  }

  if (step === "results" && analysis) {
    return <AnalysisView analysis={analysis} onReset={handleReset} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analyze & Optimize Your CV</h1>
        <p className="text-muted-foreground mt-2">
          Upload your CV and provide a job vacancy to get AI-powered optimization
          suggestions.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <CVUpload
          cvText={cvText}
          onCvTextChange={setCvText}
          onFilenameChange={setCvFilename}
          onCvIdChange={setCvId}
        />
        <VacancyInput
          vacancyText={vacancyText}
          onVacancyTextChange={setVacancyText}
          vacancySource={vacancySource}
          onVacancySourceChange={setVacancySource}
        />
      </div>

      <div className="flex justify-center">
        {step === "analyzing" ? (
          <Button disabled size="lg">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing with Gemini...
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={!canAnalyze}
          >
            Analyze & Optimize
          </Button>
        )}
      </div>
    </div>
  );
}
