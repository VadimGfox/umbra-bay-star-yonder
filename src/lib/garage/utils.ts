import type { Car, RentLog } from "./types";

const TZ = "Europe/Moscow";
const PLATE_LETTERS = "АВЕКМНОРСТУХ";
const LAT_TO_CYR: Record<string, string> = {
  A: "А",
  B: "В",
  E: "Е",
  K: "К",
  M: "М",
  H: "Н",
  O: "О",
  P: "Р",
  C: "С",
  T: "Т",
  Y: "У",
  X: "Х",
};

export type MoscowParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  weekday: string;
  dateKey: string;
  monthKey: string;
};

export function moscowParts(date = new Date()): MoscowParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  return {
    year,
    month,
    day,
    hour: get("hour"),
    minute: get("minute"),
    weekday: get("weekday"),
    dateKey: `${year}-${month}-${day}`,
    monthKey: `${year}-${month}`,
  };
}

export function weekKey(date = new Date()): string {
  const weekday =
    { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[
      moscowParts(date).weekday
    ] ?? 0;
  return moscowParts(new Date(date.getTime() - weekday * 864e5)).dateKey;
}

export function periodKeys(date = new Date()) {
  const t = moscowParts(date);
  return { todayKey: t.dateKey, weekKey: weekKey(date), monthKey: t.monthKey };
}

export function formatDate(at: number) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(at));
}

export function formatTime(at: number) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(at));
}

export function money(value: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0,
  )} руб.`;
}

export function parseMoney(raw: string) {
  const n = Number(String(raw).replace(",", ".").replace(/\s/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export function percent(value: number) {
  const n = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n)}%`;
}

export function hoursLabel(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 Ч";
  if (value < 1) return `${Math.max(1, Math.round(value * 60))} мин`;
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  return m === 0 ? `${h} Ч` : `${h} Ч ${m} мин`;
}

function mapLetter(ch: string) {
  const up = ch.toUpperCase();
  const mapped = LAT_TO_CYR[up] ?? up;
  return PLATE_LETTERS.includes(mapped) ? mapped : "";
}

export function sanitizePlate(raw: string) {
  let letter1 = "";
  let digits = "";
  let letters2 = "";
  for (const ch of raw) {
    if (!letter1) {
      const mapped = mapLetter(ch);
      if (mapped) letter1 = mapped;
      continue;
    }
    if (digits.length < 3) {
      if (/\d/.test(ch)) digits += ch;
      else {
        const mapped = mapLetter(ch);
        if (mapped && digits.length === 3 && letters2.length < 2) letters2 += mapped;
      }
      continue;
    }
    if (letters2.length < 2) {
      const mapped = mapLetter(ch);
      if (mapped) letters2 += mapped;
    }
  }
  return `${letter1}${digits}${letters2}`;
}

export function sanitizeRegion(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 3);
}

export function isPlate(value: string) {
  return new RegExp(`^[${PLATE_LETTERS}]\\d{3}[${PLATE_LETTERS}]{2}$`).test(value);
}

export function isRegion(value: string) {
  return /^\d{2,3}$/.test(value);
}

export function formatPlate(plate: string, region: string) {
  if (!plate && !region) return "";
  return region ? `${plate}  ${region}` : plate;
}

export function newId() {
  return crypto.randomUUID();
}

export function readCarImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > 640 || height > 640) {
        const scale = 640 / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(
        /png|webp/i.test(file.type) || /\.(png|webp)$/i.test(file.name)
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", 0.82),
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

let clickCtx: AudioContext | null = null;

export function playClick() {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    clickCtx ??= new Ctor();
    if (clickCtx.state === "suspended") void clickCtx.resume();
    const osc = clickCtx.createOscillator();
    const gain = clickCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 920;
    gain.gain.setValueAtTime(0.045, clickCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, clickCtx.currentTime + 0.045);
    osc.connect(gain);
    gain.connect(clickCtx.destination);
    osc.start();
    osc.stop(clickCtx.currentTime + 0.05);
  } catch {
    /* ignore */
  }
}

export function refreshCarPeriod(car: Car, date = new Date()): Car {
  const keys = periodKeys(date);
  const next: Car = { ...car, logs: Array.isArray(car.logs) ? car.logs : [] };
  if (car.todayKey !== keys.todayKey) {
    next.earnedToday = 0;
    next.todayKey = keys.todayKey;
  }
  if (car.weekKey !== keys.weekKey) {
    next.earnedWeek = 0;
    next.logs = [];
    next.weekKey = keys.weekKey;
  }
  if (car.monthKey !== keys.monthKey) {
    next.earnedMonth = 0;
    next.monthKey = keys.monthKey;
  }
  return next;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asLog(value: unknown): RentLog | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const amount = asNumber(row.amount, NaN);
  const hours = asNumber(row.hours, NaN);
  const at = asNumber(row.at, NaN);
  if (!Number.isFinite(amount) || !Number.isFinite(hours) || !Number.isFinite(at)) return null;
  return {
    id: typeof row.id === "string" && row.id ? row.id : newId(),
    at,
    hours,
    amount,
    kind: row.kind === "daily" ? "daily" : "hourly",
  };
}

export function normalizeCar(raw: unknown): Car | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (!e.id || !e.name) return null;
  const keys = periodKeys();
  const logs = Array.isArray(e.logs) ? e.logs.flatMap((row) => {
    const log = asLog(row);
    return log ? [log] : [];
  }) : [];
  const car: Car = {
    ...e,
    id: String(e.id),
    name: String(e.name),
    plate: typeof e.plate === "string" ? e.plate : "",
    region: typeof e.region === "string" ? e.region : "",
    imageData: typeof e.imageData === "string" ? e.imageData : null,
    price: asNumber(e.price),
    scrapPrice: asNumber(e.scrapPrice),
    officialPrice:
      typeof e.officialPrice === "number" && Number.isFinite(e.officialPrice)
        ? e.officialPrice
        : null,
    expenses: asNumber(e.expenses),
    hours: asNumber(e.hours),
    earnedToday: asNumber(e.earnedToday),
    earnedWeek: asNumber(e.earnedWeek),
    earnedMonth: asNumber(e.earnedMonth),
    earnedTotal: asNumber(e.earnedTotal),
    todayKey: typeof e.todayKey === "string" ? e.todayKey : keys.todayKey,
    weekKey: typeof e.weekKey === "string" ? e.weekKey : keys.weekKey,
    monthKey: typeof e.monthKey === "string" ? e.monthKey : keys.monthKey,
    logs,
    createdAt: asNumber(e.createdAt, Date.now()),
  };
  return refreshCarPeriod(car);
}

export function paybackRatio(car: Car) {
  return car.scrapPrice <= 0
    ? 0
    : Math.max(0, Math.min(1, car.earnedTotal / car.scrapPrice));
}

export function leftover(car: Car) {
  return Math.max(0, car.price - car.scrapPrice - car.earnedTotal);
}

export function paybackPercent(car: Car) {
  const base = car.price - car.scrapPrice;
  if (base <= 0) return car.earnedTotal > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, (car.earnedTotal / base) * 100));
}

export function reached(earned: number, target: number | null) {
  return target != null && target > 0 && earned >= target;
}

export function filterCars(cars: Car[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return cars;
  const compact = q.replace(/\s+/g, "");
  return cars.filter((car) => {
    const plate = `${car.plate}${car.region}`.toLowerCase();
    return car.name.toLowerCase().includes(q) || plate.includes(compact);
  });
}
