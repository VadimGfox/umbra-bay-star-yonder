import { BACKUP_KIND, BACKUP_MARKER, STORAGE_VERSION, type Car } from "./types";
import {
  formatPlate,
  hoursLabel,
  money,
  moscowParts,
  newId,
  normalizeCar,
  parseMoney,
} from "./utils";

export type GarageBackup = {
  kind: typeof BACKUP_KIND;
  app: "Гараж";
  version: number;
  exportedAt: number;
  exportedAtMsk: string;
  summary: string;
  cars: Car[];
};

function downloadBlob(filename: string, contents: string, mime: string) {
  const blob = new Blob([`\uFEFF${contents}`], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function backupFilename(date = new Date()) {
  const t = moscowParts(date);
  return `garage-log-${t.year}-${t.month}-${t.day}.txt`;
}

export function readableLog(cars: Car[], date = new Date()) {
  const t = moscowParts(date);
  const lines = [
    "Выгрузка лога автомобилей",
    `Дата: ${t.day}.${t.month}.${t.year} ${t.hour}:${t.minute} (МСК)`,
    `Автомобилей: ${cars.length}`,
    "Полная копия базы (карточки, фото, история и заработок) сохранена в блоке ниже.",
    "Не удаляйте строку GARAZH-BACKUP — она нужна, чтобы загрузить авто обратно.",
    "",
  ];
  if (cars.length === 0) {
    lines.push("Автомобилей в базе нет.");
    return lines.join("\r\n");
  }
  cars.forEach((car, index) => {
    const trips = typeof car.trips === "number" ? car.trips : (car.logs?.length ?? 0);
    const plate = formatPlate(car.plate, car.region) || "—";
    const official = car.officialPrice == null ? "не заполнено" : money(car.officialPrice);
    lines.push(
      [
        `${index + 1}. ${car.name}`,
        `Госномер: ${plate}`,
        `Цена: ${money(car.price)}`,
        `Госстоимость: ${official}`,
        `Слив по свалке: ${money(car.scrapPrice)}`,
        `Расходы: ${money(car.expenses)}`,
        `За день: ${money(car.earnedToday)}`,
        `За неделю: ${money(car.earnedWeek)}`,
        `За месяц: ${money(car.earnedMonth)}`,
        `Всего: ${money(car.earnedTotal)}`,
        `Выездов: ${trips}`,
        `Часов: ${hoursLabel(car.hours)}`,
      ].join(" | "),
    );
  });
  return lines.join("\r\n");
}

export function buildBackup(cars: Car[], date = new Date()): GarageBackup {
  const t = moscowParts(date);
  return {
    kind: BACKUP_KIND,
    app: "Гараж",
    version: STORAGE_VERSION,
    exportedAt: date.getTime(),
    exportedAtMsk: `${t.day}.${t.month}.${t.year} ${t.hour}:${t.minute}`,
    summary: readableLog(cars, date),
    cars,
  };
}

export function exportGarageLog(cars: Car[]) {
  const backup = buildBackup(cars);
  const body = `${backup.summary}\r\n\r\n${BACKUP_MARKER}\r\n${JSON.stringify(backup)}`;
  downloadBlob(backupFilename(), body, "text/plain");
}

function carsFromUnknown(raw: unknown): Car[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((row) => {
      const car = normalizeCar(row);
      return car ? [car] : [];
    });
  }
  if (typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (obj.kind === BACKUP_KIND && Array.isArray(obj.cars)) return carsFromUnknown(obj.cars);
  if (obj.state && typeof obj.state === "object") {
    const state = obj.state as Record<string, unknown>;
    if (Array.isArray(state.cars)) return carsFromUnknown(state.cars);
  }
  if (Array.isArray(obj.cars)) return carsFromUnknown(obj.cars);
  return [];
}

function parseMoneyField(raw: string) {
  if (!raw || raw === "не заполнено" || raw === "—") return NaN;
  return parseMoney(raw.replace(/руб\.?/gi, ""));
}

function parseHoursField(raw: string) {
  const text = raw.trim();
  if (!text) return 0;
  const hours = text.match(/(\d+(?:[.,]\d+)?)\s*Ч/i);
  const mins = text.match(/(\d+)\s*мин/i);
  const h = hours ? Number(hours[1].replace(",", ".")) : 0;
  const m = mins ? Number(mins[1]) : 0;
  return (Number.isFinite(h) ? h : 0) + (Number.isFinite(m) ? m / 60 : 0);
}

function parsePlateField(raw: string) {
  const cleaned = raw.replace(/—/g, " ").trim();
  if (!cleaned) return { plate: "", region: "" };
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return { plate: parts[0] ?? "", region: parts[parts.length - 1] ?? "" };
  }
  return { plate: cleaned, region: "" };
}

function parseLegacyText(text: string): Car[] {
  const cars: Car[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\d+\.\s+/.test(line) || !line.includes("|")) continue;
    const chunks = line.split("|").map((part) => part.trim());
    const head = chunks[0] ?? "";
    const name = head.replace(/^\s*\d+\.\s+/, "").trim();
    if (!name) continue;
    const fields: Record<string, string> = {};
    for (const chunk of chunks.slice(1)) {
      const idx = chunk.indexOf(":");
      if (idx === -1) continue;
      fields[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1).trim();
    }
    const plateInfo = parsePlateField(fields["Госномер"] ?? "");
    const officialRaw = fields["Госстоимость"];
    const official = officialRaw ? parseMoneyField(officialRaw) : NaN;
    const now = Date.now();
    const car = normalizeCar({
      id: newId(),
      name,
      plate: plateInfo.plate,
      region: plateInfo.region,
      imageData: null,
      price: parseMoneyField(fields["Цена"] ?? "0") || 0,
      scrapPrice: parseMoneyField(fields["Слив по свалке"] ?? "0") || 0,
      officialPrice: Number.isFinite(official) ? official : null,
      expenses: parseMoneyField(fields["Расходы"] ?? "0") || 0,
      hours: parseHoursField(fields["Часов"] ?? "0"),
      earnedToday: parseMoneyField(fields["За день"] ?? "0") || 0,
      earnedWeek: parseMoneyField(fields["За неделю"] ?? "0") || 0,
      earnedMonth: parseMoneyField(fields["За месяц"] ?? "0") || 0,
      earnedTotal: parseMoneyField(fields["Всего"] ?? "0") || 0,
      logs: [],
      createdAt: now,
    });
    if (car) cars.push(car);
  }
  return cars;
}

export function parseBackupText(text: string): Car[] {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return [];

  const marker = trimmed.indexOf(BACKUP_MARKER);
  if (marker !== -1) {
    const jsonPart = trimmed.slice(marker + BACKUP_MARKER.length).trim();
    try {
      const cars = carsFromUnknown(JSON.parse(jsonPart));
      if (cars.length) return cars;
    } catch {
      /* fall through */
    }
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const cars = carsFromUnknown(JSON.parse(trimmed));
      if (cars.length) return cars;
    } catch {
      /* fall through */
    }
  }

  return parseLegacyText(trimmed);
}

export async function parseBackupFile(file: File): Promise<Car[]> {
  const text = await file.text();
  return parseBackupText(text);
}
