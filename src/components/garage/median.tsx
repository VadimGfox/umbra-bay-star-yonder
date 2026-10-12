import { useEffect, useRef } from "react";
import { Hourglass } from "lucide-react";
import type { Car } from "@/lib/garage/types";
import {
  daysOwned,
  MEDIAN_MIN_DAYS,
  popularityColor,
  popularityMeta,
  popularityScore,
  ratingModel,
  RATING_HINT,
  type RatingRow,
} from "@/lib/garage/utils";

type Vec = [number, number, number];

function rotate(v: Vec, ax: number, ay: number): Vec {
  const [x, y, z] = v;
  const cosY = Math.cos(ay);
  const sinY = Math.sin(ay);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  const cosX = Math.cos(ax);
  const sinX = Math.sin(ax);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  return [x1, y2, z2];
}

function project(v: Vec, cx: number, cy: number, scale: number) {
  const persp = 2.6 / (2.6 - v[2]);
  return [cx + v[0] * scale * persp, cy - v[1] * scale * persp, persp] as const;
}

function drawMedian(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  jelly: number,
  ratings: RatingRow[],
  active: RatingRow,
) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2 + 2;
  const ax = 0.52;
  const ay = 0.72;
  const wobble = Math.sin(jelly * Math.PI * 3.2) * jelly;
  const squashX = 1 + wobble * 0.16;
  const squashY = 1 - wobble * 0.12;

  const byKey = Object.fromEntries(ratings.map((row) => [row.key, row]));
  const arms: Array<{ key: string; v: Vec; color: string; score: number }> = [
    { key: "excellent", v: [-1, 0.15, -0.2], color: byKey.excellent?.color ?? "#3cb85c", score: byKey.excellent?.score ?? 0 },
    { key: "popular", v: [1, 0.2, 0.15], color: byKey.popular?.color ?? "#5aa0d6", score: byKey.popular?.score ?? 0 },
    { key: "average", v: [-0.15, -1, 0.2], color: byKey.average?.color ?? "#c4c4cc", score: byKey.average?.score ?? 0 },
    { key: "terrible", v: [0.2, 0.05, 1], color: byKey.terrible?.color ?? "#e04444", score: byKey.terrible?.score ?? 0 },
  ];

  const top: Vec = [0, 1.05, 0];
  const bot: Vec = [0, -1.05, 0];
  const equator = arms.map((arm) => {
    const len = 0.35 + arm.score * 0.75;
    return {
      ...arm,
      v: [arm.v[0] * len, arm.v[1] * len, arm.v[2] * len] as Vec,
    };
  });

  const faces: Array<[Vec, Vec, Vec, string, number]> = [
    [top, equator[0]!.v, equator[2]!.v, equator[0]!.color, (equator[0]!.score + equator[2]!.score) / 2],
    [top, equator[1]!.v, equator[0]!.v, equator[1]!.color, (equator[1]!.score + equator[0]!.score) / 2],
    [top, equator[3]!.v, equator[1]!.v, equator[3]!.color, (equator[3]!.score + equator[1]!.score) / 2],
    [top, equator[2]!.v, equator[3]!.v, "#889", 0.3],
    [bot, equator[2]!.v, equator[0]!.v, equator[2]!.color, (equator[2]!.score + equator[0]!.score) / 2],
    [bot, equator[0]!.v, equator[1]!.v, equator[0]!.color, 0.35],
    [bot, equator[1]!.v, equator[3]!.v, equator[1]!.color, 0.35],
    [bot, equator[3]!.v, equator[2]!.v, equator[3]!.color, (equator[3]!.score + equator[2]!.score) / 2],
  ];

  const rotFaces = faces
    .map((face) => {
      const a = rotate(face[0], ax, ay);
      const b = rotate(face[1], ax, ay);
      const c = rotate(face[2], ax, ay);
      const z = (a[2] + b[2] + c[2]) / 3;
      return { a, b, c, color: face[3], score: face[4], z };
    })
    .sort((l, r) => l.z - r.z);

  const scale = Math.min(w, h) * 0.34;
  for (const face of rotFaces) {
    const pa = project(face.a, cx, cy, scale);
    const pb = project(face.b, cx, cy, scale);
    const pc = project(face.c, cx, cy, scale);
    const warp = (p: readonly [number, number, number]) =>
      [cx + (p[0] - cx) * squashX, cy + (p[1] - cy) * squashY] as const;
    const a = warp(pa);
    const b = warp(pb);
    const c = warp(pc);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.closePath();
    ctx.fillStyle = hexAlpha(face.color, 0.16 + face.score * 0.28);
    ctx.fill();
    ctx.strokeStyle = hexAlpha(face.color, 0.45 + face.score * 0.35);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const core = rotate([0, 0, 0], ax, ay);
  const p = project(core, cx, cy, scale);
  const glow = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 18);
  glow.addColorStop(0, hexAlpha(active.color, 0.85));
  glow.addColorStop(0.4, hexAlpha(active.color, 0.25));
  glow.addColorStop(1, hexAlpha(active.color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p[0], p[1], 18, 0, Math.PI * 2);
  ctx.fill();
}

function hexAlpha(color: string, a: number) {
  if (color.startsWith("#") && color.length === 7) {
    const n = Number.parseInt(color.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }
  return color;
}

function MedianScene({ car }: { car: Car }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const jelly = useRef(0);
  const { ratings, active } = ratingModel(car);

  useEffect(() => {
    const canvas = ref.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0;
    let w = 220;
    let h = 180;

    const resize = () => {
      w = Math.max(180, wrap.clientWidth);
      h = Math.max(180, wrap.clientHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      if (!reduced) jelly.current = Math.max(0, jelly.current - 0.012);
      const model = ratingModel(car);
      drawMedian(ctx, w, h, reduced ? 0 : jelly.current, model.ratings, model.active);
      raf = window.requestAnimationFrame(tick);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [car]);

  return (
    <div
      ref={wrapRef}
      className="relative min-h-52 w-full flex-1"
      onMouseEnter={() => {
        jelly.current = 1;
      }}
    >
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      {ratings.map((row) => (
        <span
          key={row.key}
          className={`pointer-events-none absolute text-[10px] font-medium tracking-wide ${
            row.key === "excellent"
              ? "top-2 left-2"
              : row.key === "popular"
                ? "top-2 right-2 text-right"
                : row.key === "average"
                  ? "bottom-2 left-2"
                  : "right-2 bottom-2 text-right"
          }`}
          style={{ color: row.color, opacity: row.key === active.key ? 1 : 0.55 }}
        >
          {row.label}
        </span>
      ))}
    </div>
  );
}

function PopularityScale({ car }: { car: Car }) {
  const score = popularityScore(car);
  const meta = popularityMeta(score);
  const color = popularityColor(score);
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-[10px] tracking-wide text-muted">Популярность</p>
        <p className="text-[10px] font-medium" style={{ color }}>
          {meta.label}
        </p>
      </div>
      <div className="popularity-scale">
        <div className="popularity-ticks" aria-hidden="true">
          {Array.from({ length: 21 }, (_, i) => (
            <span key={i} className={i % 5 === 0 ? "major" : "minor"} />
          ))}
        </div>
        <div className="popularity-fill" style={{ width: `${Math.max(4, score * 100)}%`, background: color }} />
      </div>
      <p className="mt-1.5 text-center text-[10px] leading-snug text-subtle">{meta.hint}</p>
    </div>
  );
}

export function MedianPanel({ car }: { car: Car }) {
  const owned = daysOwned(car);
  const ready = owned >= MEDIAN_MIN_DAYS;
  const { active } = ratingModel(car);
  const left = Math.max(0, MEDIAN_MIN_DAYS - owned);

  return (
    <div className="median-frame mt-4 flex min-h-64 w-full flex-1 flex-col">
      {ready ? (
        <>
          <MedianScene car={car} />
          <p className="mt-1 text-center text-sm font-semibold" style={{ color: active.color }}>
            {active.label}
          </p>
          <p className="mt-1 px-1 text-center text-[11px] leading-snug text-subtle">{RATING_HINT[active.key]}</p>
          <PopularityScale car={car} />
        </>
      ) : (
        <div className="flex flex-col items-center px-3 py-6 text-center">
          <Hourglass className="size-8 text-subtle" strokeWidth={1.4} />
          <p className="mt-3 text-sm font-medium text-fg">Медиана пока закрыта</p>
          <p className="mt-2 text-[11px] leading-relaxed text-subtle">
            Для корректной оценки нужно минимум {MEDIAN_MIN_DAYS} дней во владении.
            Сейчас {owned} из {MEDIAN_MIN_DAYS}
            {left ? ` — осталось ${left}.` : "."}
          </p>
        </div>
      )}
    </div>
  );
}
