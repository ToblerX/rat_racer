"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listAnalyses, getDownloadUrl, type Analysis } from "@/lib/api";
import { Download, History } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAnalyses()
      .then(setAnalyses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analysis History</h1>
        <p className="text-muted-foreground mt-1">
          Past CV analyses and optimizations.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No analyses yet.{" "}
            <Link href="/" className="underline">
              Start your first analysis
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Analysis #{a.id}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-2xl font-bold">
                        {a.match_score ?? "?"}%
                      </span>
                    </div>
                    {a.optimized_cv && (
                      <a href={getDownloadUrl(a.id)} download>
                        <Button variant="outline" size="sm">
                          <Download className="mr-1 h-3 w-3" />
                          DOCX
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {a.vacancy_source === "url" ? "From URL" : "From text"}{" "}
                  &middot;{" "}
                  {new Date(a.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={a.match_score ?? 0} className="h-2" />
                {(a.missing_skills ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(a.missing_skills ?? []).slice(0, 8).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                    {(a.missing_skills ?? []).length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(a.missing_skills ?? []).length - 8} more
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {a.vacancy_text.slice(0, 200)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
