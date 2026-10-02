export type RentKind = "hourly" | "daily";
export type Overlay =
  | "none"
  | "wizard"
  | "reset"
  | "delete"
  | "details"
  | "rent"
  | "import-confirm";
export type SubModal = "none" | "official" | "expense" | "edit-earn" | "clear-log";
export type ToastKind = "info" | "error";
export type RentStep = "pick" | "duration" | "amount";

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
  hours: number;
  earnedToday: number;
  earnedWeek: number;
  earnedMonth: number;
  earnedTotal: number;
  todayKey: string;
  weekKey: string;
  monthKey: string;
  logs: RentLog[];
  createdAt: number;
  /** Kept so future fields in saved data survive updates. */
  [key: string]: unknown;
};

export type Toast = {
  id: string;
  text: string;
  kind: ToastKind;
};

export const STORAGE_KEY = "garage-db-v1";
export const STORAGE_VERSION = 5;
export const BACKUP_KIND = "garazh-backup";
export const BACKUP_MARKER = "===== GARAZH-BACKUP-V1 =====";
