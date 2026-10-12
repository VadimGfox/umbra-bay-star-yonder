import assert from "node:assert/strict";
import test from "node:test";
import { buildBackup, parseBackupText, readableLog } from "./backup.ts";
import type { Car } from "./types.ts";
import { periodKeys } from "./utils.ts";

function sampleCar(extra: Record<string, unknown> = {}): Car {
  const keys = periodKeys();
  return {
    id: "car-1",
    name: "Horen A4 B5",
    plate: "Р127ХТ",
    region: "125",
    imageData: "data:image/png;base64,AAA",
    price: 1500000,
    scrapPrice: 400000,
    officialPrice: 900000,
    expenses: 25000,
    repairs: 0,
    hourlyRate: 3000,
    dailyRate: 45000,
    hours: 12.5,
    earnedToday: 10000,
    earnedWeek: 40000,
    earnedMonth: 80000,
    earnedTotal: 210000,
    todayKey: keys.todayKey,
    weekKey: keys.weekKey,
    monthKey: keys.monthKey,
    logs: [{ id: "log-1", at: Date.now(), hours: 2, amount: 10000, kind: "hourly" }],
    monthLogs: [{ id: "log-1", at: Date.now(), hours: 2, amount: 10000, kind: "hourly" }],
    createdAt: Date.now(),
    ownedFrom: Date.now(),
    futureColumn: "keep-me",
    ...extra,
  };
}

test("full backup roundtrip restores cars, photos, logs and extra fields", () => {
  const cars = [sampleCar()];
  const backup = buildBackup(cars);
  const text = `${backup.summary}\r\n\r\n===== GARAZH-BACKUP-V1 =====\r\n${JSON.stringify(backup)}`;
  const restored = parseBackupText(text);
  assert.equal(restored.length, 1);
  assert.equal(restored[0]?.name, "Horen A4 B5");
  assert.equal(restored[0]?.imageData, "data:image/png;base64,AAA");
  assert.equal(restored[0]?.logs.length, 1);
  assert.equal(restored[0]?.earnedTotal, 210000);
  assert.equal(restored[0]?.earnedToday, 10000);
  assert.equal(restored[0]?.futureColumn, "keep-me");
});

test("legacy text log still imports basic cards", () => {
  const cars = [sampleCar({ imageData: null, logs: [] })];
  const text = readableLog(cars);
  const restored = parseBackupText(text);
  assert.equal(restored.length, 1);
  assert.equal(restored[0]?.name, "Horen A4 B5");
  assert.equal(restored[0]?.earnedTotal, 210000);
});
