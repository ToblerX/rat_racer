"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listSavedCVs, deleteSavedCV, type SavedCV } from "@/lib/api";
import { FileText, Trash2, Eye } from "lucide-react";

export default function SavedCVsPage() {
  const [cvs, setCvs] = useState<SavedCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCv, setViewCv] = useState<SavedCV | null>(null);

  async function load() {
    setLoading(true);
    try {
      setCvs(await listSavedCVs());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this saved CV?")) return;
    try {
      await deleteSavedCV(id);
      setCvs((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Failed to delete");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Saved CVs</h1>
        <p className="text-muted-foreground mt-1">
          Your saved CV versions for quick reuse.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : cvs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No saved CVs yet. Analyze a CV and save the optimized version to see
            it here.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cvs.map((cv) => (
            <Card key={cv.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {cv.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewCv(cv)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cv.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {cv.original_filename ?? "Manual entry"} &middot; Saved{" "}
                  {new Date(cv.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {cv.original_text.slice(0, 200)}...
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewCv} onOpenChange={() => setViewCv(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewCv?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed p-4">
              {viewCv?.original_text}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
