"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scrapeVacancy } from "@/lib/api";
import { Briefcase, Globe, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  vacancyText: string;
  onVacancyTextChange: (text: string) => void;
  vacancySource: "text" | "url";
  onVacancySourceChange: (source: "text" | "url") => void;
}

export function VacancyInput({
  vacancyText,
  onVacancyTextChange,
  vacancySource,
  onVacancySourceChange,
}: Props) {
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleScrape() {
    if (!url.trim()) return;
    setScraping(true);
    try {
      const result = await scrapeVacancy(url);
      onVacancyTextChange(result.text);
      onVacancySourceChange("url");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to scrape URL");
    } finally {
      setScraping(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Job Vacancy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="text"
          onValueChange={(v) => onVacancySourceChange(v as "text" | "url")}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-3">
            <div>
              <Label htmlFor="vacancy-url">Job Posting URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="vacancy-url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button
                  onClick={handleScrape}
                  disabled={scraping || !url.trim()}
                  variant="outline"
                >
                  {scraping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {vacancyText && (
              <div>
                <Label>Extracted Text (editable)</Label>
                <Textarea
                  className={`mt-1 font-mono text-xs ${
                    expanded
                      ? "min-h-[200px]"
                      : "min-h-[200px] max-h-[300px] overflow-y-auto [field-sizing:fixed]"
                  }`}
                  value={vacancyText}
                  onChange={(e) => onVacancyTextChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
                >
                  {expanded ? (
                    <>Collapse <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>Expand <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="text">
            <div>
              <Label htmlFor="vacancy-text">Vacancy Description</Label>
              <Textarea
                id="vacancy-text"
                placeholder="Paste the job description here..."
                className={`mt-1 font-mono text-xs ${
                  expanded
                    ? "min-h-[250px]"
                    : "min-h-[250px] max-h-[300px] overflow-y-auto [field-sizing:fixed]"
                }`}
                value={vacancyText}
                onChange={(e) => {
                  onVacancyTextChange(e.target.value);
                  onVacancySourceChange("text");
                }}
              />
              {vacancyText && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1 flex w-full items-center justify-center gap-1 rounded-md border py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
                >
                  {expanded ? (
                    <>Collapse <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>Expand <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
