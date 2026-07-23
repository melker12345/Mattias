export interface CourseCategory {
  id: string;
  name: string;
}

// Canonical course categories. `id` is the slug stored on the course,
// `name` is the Swedish label shown to users.
export const COURSE_CATEGORIES: CourseCategory[] = [
  { id: 'arbete-pa-vag', name: 'Arbete på Väg' },
  { id: 'sakerhet-miljo', name: 'Säkerhet & Miljö' },
  { id: 'kompetensutveckling', name: 'Kompetensutveckling' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  COURSE_CATEGORIES.map((c) => [c.id, c.name])
);

// Returns the Swedish display label for a category slug, falling back to the
// raw slug for unknown/legacy categories.
export function categoryLabel(id: string): string {
  return CATEGORY_LABELS[id] ?? id;
}
