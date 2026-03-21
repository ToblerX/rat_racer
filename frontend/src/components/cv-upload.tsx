"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseCV, listSavedCVs, type SavedCV } from "@/lib/api";
import { Upload, FileText, FolderOpen, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  cvText: string;
  onCvTextChange: (text: string) => void;
  onFilenameChange: (name: string | null) => void;
  onCvIdChange: (id: number | null) => void;
}

export function CVUpload({
  cvText,
  onCvTextChange,
  onFilenameChange,
  onCvIdChange,
}: Props) {
  const [parsing, setParsing] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [savedCvs, setSavedCvs] = useState<SavedCV[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadSavedCvs = useCallback(async () => {
    try {
      const cvs = await listSavedCVs();
      setSavedCvs(cvs);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (dialogOpen) loadSavedCvs();
  }, [dialogOpen, loadSavedCvs]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const result = await parseCV(file);
      onCvTextChange(result.text);
      onFilenameChange(result.filename);
      setFilename(result.filename);
      onCvIdChange(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to parse CV");
    } finally {
      setParsing(false);
    }
  }

  function handleSelectSaved(cv: SavedCV) {
    onCvTextChange(cv.original_text);
    onFilenameChange(cv.original_filename);
    setFilename(cv.original_filename ?? cv.name);
    onCvIdChange(cv.id);
    setDialogOpen(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Your CV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" className="relative" disabled={parsing}>
            {parsing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {parsing ? "Parsing..." : "Upload PDF/DOCX"}
            <input
              type="file"
              accept=".pdf,.docx"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={parsing}
            />
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button variant="outline" />}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Load Saved
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select a Saved CV</DialogTitle>
              </DialogHeader>
              {savedCvs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  No saved CVs yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedCvs.map((cv) => (
                    <button
                      key={cv.id}
                      onClick={() => handleSelectSaved(cv)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{cv.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {cv.original_filename ?? "No file"} &middot;{" "}
                        {new Date(cv.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {filename && (
          <p className="text-xs text-muted-foreground">
            Loaded: {filename}
          </p>
        )}

        <div>
          <Label htmlFor="cv-text">CV Content</Label>
          <Textarea
            id="cv-text"
            placeholder="Upload a file above, load a saved CV, or paste your CV text here..."
            className={`mt-1 font-mono text-xs ${
              expanded
                ? "min-h-[250px]"
                : "min-h-[250px] max-h-[300px] overflow-y-auto [field-sizing:fixed]"
            }`}
            value={cvText}
            onChange={(e) => {
              onCvTextChange(e.target.value);
              onCvIdChange(null);
            }}
          />
          {cvText && (
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
      </CardContent>
    </Card>
  );
}
