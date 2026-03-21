"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  iterateAnalysis,
  getDownloadUrl,
  saveCV,
  type Analysis,
  type ChatMessage,
} from "@/lib/api";
import {
  Download,
  RotateCcw,
  Send,
  Loader2,
  Save,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

interface Props {
  analysis: Analysis;
  onReset: () => void;
}

export function AnalysisView({ analysis: initialAnalysis, onReset }: Props) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialAnalysis.conversation_history ?? []
  );
  const [optimizedCv, setOptimizedCv] = useState(
    initialAnalysis.optimized_cv ?? ""
  );
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  const score = analysis.match_score ?? 0;

  function scoreColor() {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  }

  async function handleSendMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMsg },
    ];
    setMessages(newMessages);

    try {
      const result = await iterateAnalysis({
        analysis_id: analysis.id,
        user_message: userMsg,
      });
      setOptimizedCv(result.optimized_cv);
      setMessages(result.conversation_history);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed to process"}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSaveCV() {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      await saveCV({
        name: saveName.trim(),
        original_text: optimizedCv,
        original_filename: undefined,
      });
      setSaveDialogOpen(false);
      setSaveName("");
      alert("CV saved!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analysis Results</h1>
        <div className="flex gap-2">
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger
              render={<Button variant="outline" />}
            >
              <Save className="mr-2 h-4 w-4" />
              Save CV
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Optimized CV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="save-name">Name</Label>
                  <Input
                    id="save-name"
                    placeholder="e.g. My CV - Senior Dev Role"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleSaveCV}
                  disabled={saving || !saveName.trim()}
                  className="w-full"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <a href={getDownloadUrl(analysis.id)} download>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download DOCX
            </Button>
          </a>
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Score + Missing Skills */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Match Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${scoreColor()}`}>
              {score}%
            </div>
            <Progress value={score} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Missing Skills / Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(analysis.missing_skills ?? []).length === 0 ? (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  All key skills covered!
                </span>
              ) : (
                (analysis.missing_skills ?? []).map((skill) => (
                  <Badge key={skill} variant="destructive">
                    {skill}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Section-by-Section Suggestions</h2>
        <span className="text-sm text-muted-foreground">
          AI-suggested rewrites for each section of your CV
        </span>
      </div>

      {/* Individual suggestion cards */}
      {(analysis.suggestions ?? [])
        .filter((s) => s.original?.trim() !== s.suggested?.trim())
        .map((s, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-sm">
                  <Badge variant="outline">{s.section}</Badge>
                </CardTitle>
                <CardDescription className="text-xs text-right">
                  {s.reason}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Original
                  </p>
                  <div className="bg-muted rounded p-3 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {s.original}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-2">
                    Suggested
                  </p>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded p-3 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {s.suggested}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Optimized CV + Chat */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Optimized CV preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Optimized CV</CardTitle>
            <CardDescription>
              This is the full rewritten CV. Use the chat to refine it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
                {optimizedCv}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Iterative chat */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm">Refine with AI</CardTitle>
            <CardDescription>
              Tell the AI how to adjust the optimized CV
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 h-[320px] mb-3">
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded-lg p-3 ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI is thinking...
                  </div>
                )}
              </div>
            </ScrollArea>
            <Separator className="mb-3" />
            <div className="flex gap-2">
              <Textarea
                placeholder="e.g. Make the summary more concise, add more keywords for cloud computing..."
                className="min-h-[60px] text-sm"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
