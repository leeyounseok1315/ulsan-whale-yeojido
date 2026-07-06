import { Badge } from "./Badge";

// 시즌 배지 — 고래바다여행선 운항/휴지기 등. 공통 Badge 위에 구축.
export function SeasonBadge({ open, label }: { open: boolean; label: string }) {
  return (
    <Badge tone={open ? "water" : "neutral"} dotColor={open ? "var(--color-water)" : "var(--color-ink-faint)"}>
      {open ? `${label} 중` : `${label} 휴지기`}
    </Badge>
  );
}
