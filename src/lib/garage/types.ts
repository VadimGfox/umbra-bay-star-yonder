export type RentKind = "hourly" | "daily";
export type AcquireKind = "free" | "paid";
export type ApiServerId = "RU1" | "RU2" | "RU3";
export type WizardStepId =
  | "acquire"
  | "name"
  | "plate"
  | "image"
  | "buy"
  | "official"
  | "scrap"
  | "tariff";
export type Overlay =
  | "none"
  | "wizard"
  | "reset"
  | "delete"
  | "details"
  | "rent"
  | "import-confirm"
  | "api"
  | "market";
export type SubModal =
  | "none"
  | "official"
  | "expense"
  | "edit-earn"
  | "clear-log"
  | "rename"
  | "owned-days"
  | "undo-rent"
  | "plate"
  | "tariff"
  | "tariff-edit"
  | "sell-ask"
  | "sell-result";
export type ToastKind = "info" | "error";
export type RentStep = "pick" | "duration" | "amount";
export type LogRange = "week" | "month";
export type ExpenseSign = 1 | -1;
export type ExpenseTarget = "expense" | "repair";
export type TariffScope = "wizard" | "car";

export type RentLog = {
  id: string;
  at: number;
  hours: number;
  amount: number;
  kind: RentKind;
};

export type Car = {
  id: string;
  name: string;
  plate: string;
  region: string;
  imageData: string | null;
  price: number;
  scrapPrice: number;
  officialPrice: number | null;
  expenses: number;
  repairs: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  hours: number;
  earnedToday: number;
  earnedWeek: number;
  earnedMonth: number;
  earnedTotal: number;
  todayKey: string;
  weekKey: string;
  monthKey: string;
  logs: RentLog[];
  monthLogs: RentLog[];
  createdAt: number;
  ownedFrom: number;
  /** Kept so future fields in saved data survive updates. */
  [key: string]: unknown;
};

export type Toast = {
  id: string;
  text: string;
  kind: ToastKind;
};

export const API_SERVERS: Record<ApiServerId, string> = {
  RU1: "Арбатский",
  RU2: "Тверской",
  RU3: "Кутузовский",
};

export const STORAGE_KEY = "garage-db-v1";
export const STORAGE_VERSION = 6;
export const BACKUP_KIND = "garazh-backup";
export const BACKUP_MARKER = "===== GARAZH-BACKUP-V1 =====";
export const APP_NAME = "Dark Rent";
