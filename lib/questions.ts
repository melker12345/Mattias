/**
 * Shared utilities for dealing with question data.
 * 
 * Questions store `options` and `correct_answer` as JSON strings in the DB
 * (for flexibility with different question types).
 * These helpers centralize the (sometimes messy) parsing.
 */

/** DB JSON/JSONB may be a string or already parsed (Supabase client) */
export function parseQuestionOptions(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function parseCorrectAnswerIndex(raw: unknown): number {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return Number(JSON.parse(raw));
    } catch {
      const n = Number(raw);
      return Number.isNaN(n) ? 0 : n;
    }
  }
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
}

/** Helper to get the raw options field (some places use correctAnswer vs correct_answer) */
export function rawQuestionOptions(q: { options?: unknown } | undefined): unknown {
  return q?.options;
}

export function rawCorrectAnswer(q: { correctAnswer?: unknown; correct_answer?: unknown } | undefined): unknown {
  if (!q) return undefined;
  return q.correctAnswer ?? q.correct_answer;
}
