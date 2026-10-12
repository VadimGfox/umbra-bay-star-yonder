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

export function splitPlate(plate: string) {
  const match = plate.match(new RegExp(`^([${PLATE_LETTERS}])(\\d{3})([${PLATE_LETTERS}]{2})$`));
  if (match) {
    return { letter: match[1] ?? "", digits: match[2] ?? "", letters: match[3] ?? "" };
  }
  return {
    letter: plate.slice(0, 1),
    digits: plate.slice(1, 4),
    letters: plate.slice(4, 6),
  };
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

function asLogs(value: unknown): RentLog[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    const log = asLog(row);
    return log ? [log] : [];
  });
}

export function refreshCarPeriod(car: Car, date = new Date()): Car {
  const keys = periodKeys(date);
  const next: Car = {
    ...car,
    logs: Array.isArray(car.logs) ? car.logs : [],
    monthLogs: Array.isArray(car.monthLogs) ? car.monthLogs : [],
  };
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
    next.monthLogs = [];
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
  const logs = asLogs(e.logs);
  const monthLogs = asLogs(e.monthLogs);
  const createdAt = asNumber(e.createdAt, Date.now());
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
    repairs: asNumber(e.repairs),
    hourlyRate:
      typeof e.hourlyRate === "number" && Number.isFinite(e.hourlyRate) ? e.hourlyRate : null,
    dailyRate: typeof e.dailyRate === "number" && Number.isFinite(e.dailyRate) ? e.dailyRate : null,
    hours: asNumber(e.hours),
    earnedToday: asNumber(e.earnedToday),
    earnedWeek: asNumber(e.earnedWeek),
    earnedMonth: asNumber(e.earnedMonth),
    earnedTotal: asNumber(e.earnedTotal),
    todayKey: typeof e.todayKey === "string" ? e.todayKey : keys.todayKey,
    weekKey: typeof e.weekKey === "string" ? e.weekKey : keys.weekKey,
    monthKey: typeof e.monthKey === "string" ? e.monthKey : keys.monthKey,
    logs,
    monthLogs: monthLogs.length ? monthLogs : logs,
    createdAt,
    ownedFrom: asNumber(e.ownedFrom, createdAt),
  };
  return refreshCarPeriod(car);
}

export function repairsOf(car: Car) {
  return Number.isFinite(car.repairs) ? Math.max(0, car.repairs) : 0;
}

/** What still has to be earned back: purchase + repairs − scrap. */
export function obligation(car: Car) {
  return car.price + repairsOf(car) - car.scrapPrice;
}

export function paybackRatio(car: Car) {
  return car.scrapPrice <= 0 ? 0 : Math.max(0, Math.min(1, car.earnedTotal / car.scrapPrice));
}

export function leftover(car: Car) {
  return Math.max(0, obligation(car) - car.earnedTotal);
}

export function surplus(car: Car) {
  const base = obligation(car);
  if (base <= 0) return Math.max(0, car.earnedTotal);
  return Math.max(0, car.earnedTotal - base);
}

export function paybackPercent(car: Car) {
  const base = obligation(car);
  if (base <= 0) return car.earnedTotal > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, (car.earnedTotal / base) * 100));
}

export function sellOutcome(car: Car, salePrice: number) {
  const net = salePrice + car.earnedTotal - car.price - repairsOf(car);
  return { net, loss: net < 0 };
}

export function compactMoney(value: number) {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    const text = Math.abs(m) >= 10 ? String(Math.round(m)) : trimNum(m);
    return `${text} млн`;
  }
  if (Math.abs(n) >= 10_000) return `${trimNum(n / 1000)}т`;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

function trimNum(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded).replace(".", ",");
}

export function rateChip(amount: number, unit: "час" | "день") {
  return `${compactMoney(amount)} ₽ / ${unit}`;
}

export function tariffQuote(car: Car, kind: "hourly" | "daily", duration: number) {
  const rate = kind === "daily" ? car.dailyRate : car.hourlyRate;
  if (rate == null || !Number.isFinite(rate)) return null;
  return Math.round(rate * duration);
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

export function dateKeyToMs(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year || 1970, (month || 1) - 1, day || 1);
}

export function daysOwned(car: Car, date = new Date()) {
  const from = Number.isFinite(car.ownedFrom) ? car.ownedFrom : car.createdAt;
  const fromKey = moscowParts(new Date(from)).dateKey;
  const nowKey = moscowParts(date).dateKey;
  const diff = Math.floor((dateKeyToMs(nowKey) - dateKeyToMs(fromKey)) / 864e5);
  return Math.max(1, diff + 1);
}

export function ownedFromForDays(days: number, date = new Date()) {
  const n = Math.max(1, Math.floor(days));
  const nowKey = moscowParts(date).dateKey;
  return dateKeyToMs(nowKey) - (n - 1) * 864e5;
}

export function daysWord(n: number) {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return "дней";
  if (d === 1) return "день";
  if (d >= 2 && d <= 4) return "дня";
  return "дней";
}

export function uniqueLogs(car: Car): RentLog[] {
  const seen = new Set<string>();
  const out: RentLog[] = [];
  for (const row of [...(car.monthLogs ?? []), ...(car.logs ?? [])]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

export function latestRent(car: Car): RentLog | null {
  const all = uniqueLogs(car);
  if (!all.length) return null;
  return all.reduce((best, row) => (row.at > best.at ? row : best));
}

export function applyUndoLastRent(car: Car, date = new Date()): { car: Car; undone: RentLog | null } {
  const log = latestRent(car);
  if (!log) return { car, undone: null };
  const keys = periodKeys(date);
  const logKeys = periodKeys(new Date(log.at));
  return {
    undone: log,
    car: {
      ...car,
      hours: Math.max(0, car.hours - log.hours),
      earnedToday:
        logKeys.todayKey === keys.todayKey ? Math.max(0, car.earnedToday - log.amount) : car.earnedToday,
      earnedWeek:
        logKeys.weekKey === keys.weekKey ? Math.max(0, car.earnedWeek - log.amount) : car.earnedWeek,
      earnedMonth:
        logKeys.monthKey === keys.monthKey ? Math.max(0, car.earnedMonth - log.amount) : car.earnedMonth,
      earnedTotal: Math.max(0, car.earnedTotal - log.amount),
      logs: car.logs.filter((row) => row.id !== log.id),
      monthLogs: (car.monthLogs ?? []).filter((row) => row.id !== log.id),
    },
  };
}

export function applyExpenseDelta(car: Car, amount: number, sign: 1 | -1): Car {
  const delta = amount * sign;
  return {
    ...car,
    expenses: Math.max(0, car.expenses + delta),
    price: Math.max(0, car.price + delta),
  };
}

export function applyRepairDelta(car: Car, amount: number, sign: 1 | -1): Car {
  return {
    ...car,
    repairs: Math.max(0, repairsOf(car) + amount * sign),
  };
}

export type RatingKey = "excellent" | "popular" | "average" | "terrible";

export type RatingRow = {
  key: RatingKey;
  label: string;
  color: string;
  score: number;
};

export function ratingModel(car: Car) {
  const t = paybackRatio(car);
  const n = paybackPercent(car) / 100;
  const rest = leftover(car);
  const expenseShare = car.price > 0 ? Math.min(1, car.expenses / Math.max(car.price, 1)) : 0;
  const trips = typeof car.trips === "number" ? Number(car.trips) : uniqueLogs(car).length;
  const logCount = uniqueLogs(car).length;
  const hours = car.hours;
  const excellent = Math.max(
    0,
    Math.min(1, t * 0.55 + n * 0.35 + (car.earnedTotal > 0 ? 0.1 : 0) - expenseShare * 0.25),
  );
  const popular = Math.max(
    0,
    Math.min(1, Math.min(1, trips / 12) * 0.45 + Math.min(1, logCount / 5) * 0.35 + Math.min(1, hours / 80) * 0.2),
  );
  const terrible = Math.max(
    0,
    Math.min(
      1,
      (1 - t) * 0.35 +
        expenseShare * 0.3 +
        (car.price > 0 ? Math.min(1, rest / car.price) * 0.25 : 0.2) +
        (car.earnedTotal <= 0 && trips === 0 ? 0.2 : 0),
    ),
  );
  const average = Math.max(0, Math.min(1, 1 - Math.abs(0.45 - t) * 1.2 - Math.abs(0.35 - popular) * 0.4));
  const ratings: RatingRow[] = [
    { key: "excellent", label: "Отличная", color: "#3cb85c", score: excellent },
    { key: "popular", label: "Популярная", color: "#5aa0d6", score: popular },
    { key: "average", label: "Средняя", color: "#c4c4cc", score: average },
    { key: "terrible", label: "Ужасная", color: "#e04444", score: terrible },
  ];
  return { ratings, active: ratings.reduce((a, b) => (b.score > a.score ? b : a)) };
}

export const RATING_HINT: Record<RatingKey, string> = {
  excellent: "Машина закрывает вложения быстро — держать и крутить.",
  popular: "Парк её разбирает. Спрос держится, простои короткие.",
  average: "Рабочая лошадка без перекоса: ни простоя, ни ажиотажа.",
  terrible: "Слабая отдача и долгий простой. Имеет смысл пересмотреть цену или продать.",
};

export function popularityScore(car: Car, date = new Date()) {
  const now = date.getTime();
  const weekAgo = now - 7 * 864e5;
  const recent = uniqueLogs(car).filter((row) => row.at >= weekAgo);
  const trips = recent.length;
  const hours = recent.reduce((sum, row) => sum + row.hours, 0);
  const last = recent.reduce((best, row) => (row.at > best ? row.at : best), 0);
  const recency = last ? Math.max(0, 1 - (now - last) / (5 * 864e5)) : 0;
  const tripScore = Math.min(1, trips / 9);
  const hourScore = Math.min(1, hours / 36);
  return Math.max(0, Math.min(1, tripScore * 0.5 + hourScore * 0.35 + recency * 0.15));
}

export function popularityMeta(score: number) {
  if (score < 0.18) return { label: "Непопулярная", hint: "Редко уходит. Спрос почти стоит." };
  if (score < 0.38) return { label: "Слабый спрос", hint: "Берут нерегулярно — шкала ещё холодная." };
  if (score < 0.58) return { label: "Рабочий ритм", hint: "Стабильные выезды без перегрева." };
  if (score < 0.8) return { label: "Высокий спрос", hint: "Часто в аренде, простои короткие." };
  return { label: "Пик популярности", hint: "Машину разбирают. Это верх шкалы." };
}

export function popularityColor(score: number) {
  const stops: Array<[number, [number, number, number]]> = [
    [0, [90, 12, 12]],
    [0.22, [196, 43, 43]],
    [0.42, [214, 96, 28]],
    [0.62, [214, 176, 48]],
    [0.82, [96, 176, 72]],
    [1, [44, 168, 78]],
  ];
  const t = Math.max(0, Math.min(1, score));
  let i = 0;
  while (i < stops.length - 1 && t > stops[i + 1]![0]) i += 1;
  const a = stops[i]!;
  const b = stops[Math.min(i + 1, stops.length - 1)]!;
  const span = b[0] - a[0] || 1;
  const u = (t - a[0]) / span;
  const rgb = a[1].map((ch, idx) => Math.round(ch + (b[1][idx]! - ch) * u));
  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
}

export const MEDIAN_MIN_DAYS = 7;
