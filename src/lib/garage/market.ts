import { createServerFn } from "@tanstack/react-start";
import type { ApiServerId } from "./types";

export type MarketVehicle = {
  model: string;
  modelName: string;
  totalCount: number;
  soldCount: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
};

export type MarketSnapshot = {
  serverId: string;
  periodDays: number | null;
  lastUpdated: string | null;
  vehicles: MarketVehicle[];
};

export type MarketResult =
  | { ok: true; data: MarketSnapshot }
  | { ok: false; status: number; message: string };

const WINDOW_MS = 60_000;
const MAX_CALLS = 5;
const recent: number[] = [];

export function marketSlotsLeft(now = Date.now()) {
  const fresh = recent.filter((at) => now - at < WINDOW_MS);
  recent.splice(0, recent.length, ...fresh);
  return MAX_CALLS - fresh.length;
}

export function markMarketCall(now = Date.now()) {
  recent.push(now);
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asVehicle(raw: unknown): MarketVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const modelName = String(row.modelName ?? row.name ?? row.model ?? "").trim();
  if (!modelName) return null;
  return {
    model: String(row.model ?? ""),
    modelName,
    totalCount: num(row.totalCount ?? row.count ?? row.inStock),
    soldCount: num(row.soldCount ?? row.sold),
    averagePrice: num(row.averagePrice ?? row.avgPrice ?? row.recommendedPrice),
    minPrice: num(row.minPrice),
    maxPrice: num(row.maxPrice),
  };
}

export function normalizeMarket(payload: unknown, serverId: string): MarketSnapshot {
  const body = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const list = Array.isArray(body.vehicleStatistics)
    ? body.vehicleStatistics
    : Array.isArray(body.vehicles)
      ? body.vehicles
      : [];
  return {
    serverId: String(body.serverId ?? serverId),
    periodDays: typeof body.periodDays === "number" ? body.periodDays : null,
    lastUpdated: typeof body.lastUpdated === "string" ? body.lastUpdated : null,
    vehicles: list.flatMap((row) => {
      const vehicle = asVehicle(row);
      return vehicle ? [vehicle] : [];
    }),
  };
}

export function foldName(value: string) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "");
}

export function matchVehicle(vehicles: MarketVehicle[], carName: string) {
  const needle = foldName(carName);
  if (!needle) return null;
  const exact = vehicles.find(
    (row) => foldName(row.modelName) === needle || foldName(row.model) === needle,
  );
  if (exact) return exact;
  return (
    vehicles.find((row) => {
      const name = foldName(row.modelName);
      return name.includes(needle) || needle.includes(name);
    }) ?? null
  );
}

function errorMessage(status: number) {
  if (status === 401) return "Ключ не принят. Проверьте API ключ.";
  if (status === 403) return "У этого ключа нет доступа к API.";
  if (status === 429) return "Слишком много запросов. Подождите минуту.";
  if (status >= 500) return "Сервер рынка сейчас недоступен.";
  return "Не удалось получить рынок.";
}

export const fetchMarketplace = createServerFn({ method: "POST" })
  .validator((input: { apiKey: string; serverId: ApiServerId }) => {
    const apiKey = input.apiKey.trim();
    const serverId = input.serverId;
    if (!apiKey) throw new Error("Введите API ключ");
    if (serverId !== "RU1" && serverId !== "RU2" && serverId !== "RU3") {
      throw new Error("Выберите сервер");
    }
    return { apiKey, serverId };
  })
  .handler(async ({ data }): Promise<MarketResult> => {
    const url = `https://api.majestic-rp.ru/v1/ext/marketplace/vehicles/${data.serverId}`;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${data.apiKey}`,
        },
      });
      if (!response.ok) {
        return { ok: false, status: response.status, message: errorMessage(response.status) };
      }
      const json: unknown = await response.json();
      return { ok: true, data: normalizeMarket(json, data.serverId) };
    } catch {
      return { ok: false, status: 0, message: "Нет связи с рынком. Проверьте ключ и сеть." };
    }
  });
