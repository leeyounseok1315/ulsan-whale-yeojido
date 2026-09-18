export interface VisitRecord {
  spotId: string;
  title: string;
  theme?: string;
  verifiedAt: string;
}

const STORAGE_KEY = "whale-visited:v1";

export function readVisits(): VisitRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVerifiedVisit(record: VisitRecord): VisitRecord[] {
  const visits = readVisits();

  const next = [
    record,
    ...visits.filter((visit) => visit.spotId !== record.spotId),
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return next;
}