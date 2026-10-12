import { useEffect, useRef } from "react";

type Mote = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

function spawn(w: number, h: number): Mote {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    z: 0.2 + Math.random() * 1,
    vx: (Math.random() - 0.5) * 0.28,
    vy: -0.03 - Math.random() * 0.14,
    life: Math.random(),
    max: 7 + Math.random() * 10,
  };
}

export function AmbientDust() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let motes: Mote[] = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = reduced ? 36 : Math.round(Math.min(220, (w * h) / 9000));
      motes = Array.from({ length: count }, () => spawn(w, h));
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const mote of motes) {
        mote.x += mote.vx * mote.z;
        mote.y += mote.vy * mote.z;
        mote.life += 0.016;
        if (mote.x < -8 || mote.x > w + 8 || mote.y < -8 || mote.life > mote.max) {
          Object.assign(mote, spawn(w, h), { y: h + 4, life: 0 });
        }
        const fade = Math.sin((mote.life / mote.max) * Math.PI);
        const depth = 0.4 + mote.z * 0.6;
        const alpha = 0.42 * fade * depth;
        const size = 0.55 + mote.z * 0.85;
        ctx.beginPath();
        ctx.fillStyle = `rgba(226,226,234,${alpha})`;
        ctx.arc(mote.x, mote.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = window.requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      tick();
      return () => window.removeEventListener("resize", resize);
    }
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[2]" aria-hidden="true" />;
}
