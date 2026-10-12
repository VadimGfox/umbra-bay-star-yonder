import { useLayoutEffect, useRef, useState } from "react";
import { DarkRentLogo } from "@/components/garage/logo";
import { useGarage } from "@/lib/garage/store";

const SPLASH_MS = 3200;
const SPLASH_SWAP_MS = 1400;

type Dust = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

const LANES = Array.from({ length: 42 }, (_, index) => {
  const side = index < 21 ? -1 : 1;
  const step = index < 21 ? 20 - index : index - 21;
  return {
    angle: side * (1.15 + step * 2.05),
    hue: (index * 23 + 210) % 360,
    delay: -((index * 0.09) % 1.55),
    width: step % 5 === 0 ? 2.4 : 1.15,
  };
});

function makeDust(w: number, h: number): Dust {
  return {
    x: Math.random() * w,
    y: h * (0.35 + Math.random() * 0.65),
    z: 0.15 + Math.random() * 0.85,
    vx: (Math.random() - 0.5) * 0.18,
    vy: -0.04 - Math.random() * 0.12,
    life: Math.random(),
    max: 4 + Math.random() * 6,
  };
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const bootCheck = useGarage((s) => s.bootCheck);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"load" | "venom">("load");

  useLayoutEffect(() => {
    const finish = () => bootCheck();
    const unsub = useGarage.persist.onFinishHydration(finish);
    if (useGarage.persist.hasHydrated()) finish();
    const swap = window.setInterval(() => {
      setPhase((current) => (current === "load" ? "venom" : "load"));
    }, SPLASH_SWAP_MS);
    const done = window.setTimeout(() => onDone(), SPLASH_MS);
    return () => {
      unsub();
      window.clearInterval(swap);
      window.clearTimeout(done);
    };
  }, [bootCheck, onDone]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let raf = 0;
    let dust: Dust[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dust = Array.from({ length: reduced ? 40 : 180 }, () => makeDust(w, h));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const mote of dust) {
        if (!reduced) {
          mote.x += mote.vx * mote.z;
          mote.y += mote.vy * mote.z;
          mote.life += 0.016;
          if (mote.life > mote.max || mote.y < h * 0.28) Object.assign(mote, makeDust(w, h), { life: 0 });
        }
        const fade = Math.sin((mote.life / mote.max) * Math.PI);
        const size = 0.35 + mote.z * 0.7;
        ctx.fillStyle = `rgba(230,230,236,${0.07 * fade * mote.z})`;
        ctx.fillRect(mote.x, mote.y, size, size);
      }
    };

    resize();
    frame();
    window.addEventListener("resize", resize);
    const loop = () => {
      frame();
      raf = window.requestAnimationFrame(loop);
    };
    if (!reduced) raf = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="splash-root">
      <div className="splash-stage" aria-hidden="true">
        <div className="vhs-fog" />
        <div className="vhs-road">
          {LANES.map((lane) => (
            <span
              key={`${lane.angle}-${lane.hue}`}
              className="vhs-lane"
              style={{
                ["--a" as string]: `${lane.angle}deg`,
                ["--h" as string]: String(lane.hue),
                ["--d" as string]: `${lane.delay}s`,
                width: `${lane.width}px`,
              }}
            />
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[2]" aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6">
        <DarkRentLogo stack />
        <div className="splash-pulse-line" aria-hidden="true" />
        <div className="splash-bar mt-7 w-full max-w-sm" aria-hidden="true">
          <div className="splash-bar-track">
            <div className="splash-bar-fill" />
          </div>
        </div>
        <div className="relative mt-7 h-8 w-80">
          <p className={`splash-copy absolute inset-0 text-center text-sm tracking-[0.32em] text-fg ${phase === "load" ? "splash-in" : "splash-out"}`}>
            Загрузка
          </p>
          <p className={`splash-copy absolute inset-0 text-center text-sm tracking-[0.22em] text-muted ${phase === "venom" ? "splash-in" : "splash-out"}`}>
            Powered by Venom
          </p>
        </div>
      </div>
    </div>
  );
}
