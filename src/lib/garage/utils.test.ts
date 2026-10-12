import assert from "node:assert/strict";
import test from "node:test";
import type { Car } from "./types.ts";
import {
  applyExpenseDelta,
  applyUndoLastRent,
  daysOwned,
  daysWord,
  latestRent,
  normalizeCar,
  ownedFromForDays,
  popularityScore,
  splitPlate,
} from "./utils.ts";

function car(extra: Record<string, unknown> = {}): Car {
  const now = Date.UTC(2026, 9, 2);
  const normalized = normalizeCar({
    id: "c1",
    name: "Camry",
    plate: "А123АА",
    region: "777",
    imageData: null,
    price: 100000,
    scrapPrice: 20000,
    officialPrice: null,
    expenses: 5000,
    hours: 10,
    earnedToday: 1000,
    earnedWeek: 3000,
    earnedMonth: 8000,
    earnedTotal: 12000,
    logs: [{ id: "l1", at: now, hours: 2, amount: 1000, kind: "hourly" }],
    monthLogs: [{ id: "l1", at: now, hours: 2, amount: 1000, kind: "hourly" }],
    createdAt: now,
    ownedFrom: now,
    ...extra,
  });
  assert.ok(normalized);
  return normalized;
}

test("splitPlate reads letter-digits-letters", () => {
  assert.deepEqual(splitPlate("Р127ХТ"), { letter: "Р", digits: "127", letters: "ХТ" });
});

test("daysOwned is 1 on the same Moscow day and grows by calendar day", () => {
  const ownedFrom = Date.UTC(2026, 9, 1);
  const same = car({ ownedFrom, createdAt: ownedFrom });
  assert.equal(daysOwned(same, new Date("2026-10-01T12:00:00+03:00")), 1);
  assert.equal(daysOwned(same, new Date("2026-10-07T12:00:00+03:00")), 7);
});

test("ownedFromForDays then daysOwned roundtrips", () => {
  const date = new Date("2026-10-02T18:00:00+03:00");
  const from = ownedFromForDays(7, date);
  const sample = car({ ownedFrom: from, createdAt: from });
  assert.equal(daysOwned(sample, date), 7);
});

test("daysWord uses Russian plural forms", () => {
  assert.equal(daysWord(1), "день");
  assert.equal(daysWord(2), "дня");
  assert.equal(daysWord(5), "дней");
  assert.equal(daysWord(21), "день");
});

test("undo last rent removes money, hours and both logs", () => {
  const { car: next, undone } = applyUndoLastRent(car());
  assert.ok(undone);
  assert.equal(next.logs.length, 0);
  assert.equal(next.monthLogs.length, 0);
  assert.equal(next.earnedTotal, 11000);
  assert.equal(next.hours, 8);
  assert.equal(latestRent(next), null);
});

test("expense subtract cannot go below zero", () => {
  const next = applyExpenseDelta(car(), 8000, -1);
  assert.equal(next.expenses, 0);
  assert.equal(next.price, 92000);
});

test("popularity is higher with recent dense rentals", () => {
  const now = Date.now();
  const logs = Array.from({ length: 8 }, (_, i) => ({
    id: `r${i}`,
    at: now - i * 3600_000,
    hours: 4,
    amount: 2000,
    kind: "hourly" as const,
  }));
  const busy = car({ logs, monthLogs: logs, hours: 32 });
  const idle = car({ logs: [], monthLogs: [], hours: 0 });
  assert.ok(popularityScore(busy) > popularityScore(idle));
});
