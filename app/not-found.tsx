import { ButtonLink } from "@/components/ui/Button";
import { PetroglyphWhale } from "@/components/ui/PetroglyphWhale";

export default function NotFound() {
  return (
    <main className="paper-grain flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <PetroglyphWhale className="h-24 w-auto opacity-40" strokeWidth={2.4} />
      <p className="mt-6 font-mono text-xs tracking-[0.3em] text-seal">輿地圖</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">여지도 밖으로 헤엄쳐 나갔어요</h1>
      <p className="mt-2 text-ink-soft">찾으시는 길이 이 지도에는 없네요.</p>
      <ButtonLink href="/" className="mt-8">
        여지도로 돌아가기
      </ButtonLink>
    </main>
  );
}
