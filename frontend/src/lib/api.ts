const API_BASE = "http://localhost:8000";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// --- CV ---

export async function parseCV(file: File): Promise<{ text: string; filename: string }> {
  const form = new FormData();
  form.append("file", file);
  return request("/api/cv/parse", { method: "POST", body: form });
}

export async function saveCV(data: {
  name: string;
  original_text: string;
  original_filename?: string;
}): Promise<SavedCV> {
  return request("/api/cv/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function listSavedCVs(): Promise<SavedCV[]> {
  return request("/api/cv/saved");
}

export async function getSavedCV(id: number): Promise<SavedCV> {
  return request(`/api/cv/saved/${id}`);
}

export async function deleteSavedCV(id: number): Promise<void> {
  return request(`/api/cv/saved/${id}`, { method: "DELETE" });
}

// --- Vacancy ---

export async function scrapeVacancy(url: string): Promise<{ text: string }> {
  return request("/api/vacancy/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

// --- Analysis ---

export async function runAnalysis(data: {
  cv_text: string;
  vacancy_text: string;
  vacancy_source: string;
  cv_id?: number;
}): Promise<Analysis> {
  return request("/api/analysis/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getAnalysis(id: number): Promise<Analysis> {
  return request(`/api/analysis/${id}`);
}

export async function listAnalyses(): Promise<Analysis[]> {
  return request("/api/analysis/");
}

export async function iterateAnalysis(data: {
  analysis_id: number;
  user_message: string;
}): Promise<IterateResponse> {
  return request("/api/analysis/iterate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getDownloadUrl(analysisId: number): string {
  return `${API_BASE}/api/analysis/${analysisId}/download`;
}

// --- Types ---

export interface SavedCV {
  id: number;
  name: string;
  original_text: string;
  original_filename: string | null;
  created_at: string;
}

export interface Suggestion {
  section: string;
  original: string;
  suggested: string;
  reason: string;
}

export interface Analysis {
  id: number;
  cv_id: number | null;
  cv_text: string;
  vacancy_text: string;
  vacancy_source: string;
  match_score: number | null;
  missing_skills: string[] | null;
  suggestions: Suggestion[] | null;
  optimized_cv: string | null;
  conversation_history: ChatMessage[] | null;
  created_at: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface IterateResponse {
  optimized_cv: string;
  assistant_message: string;
  conversation_history: ChatMessage[];
}
