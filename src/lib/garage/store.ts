import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { albumGet, albumPut } from "./album";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  type AcquireKind,
  type ApiServerId,
  type Car,
  type ExpenseSign,
  type ExpenseTarget,
  type LogRange,
  type Overlay,
  type RentKind,
  type RentStep,
  type SubModal,
  type TariffScope,
  type Toast,
  type ToastKind,
  type WizardStepId,
} from "./types";
import {
  applyExpenseDelta,
  applyRepairDelta,
  applyUndoLastRent,
  daysOwned,
  isPlate,
  isRegion,
  newId,
  normalizeCar,
  ownedFromForDays,
  parseMoney,
  periodKeys,
  refreshCarPeriod,
  sellOutcome,
  tariffQuote,
} from "./utils";

const WIZARD_ORDER: WizardStepId[] = [
  "acquire",
  "name",
  "plate",
  "image",
  "buy",
  "official",
  "scrap",
  "tariff",
];

function wizardPath(acquire: AcquireKind | null, imageSkipped: boolean) {
  return WIZARD_ORDER.filter((step) => {
    if (step === "buy" && acquire !== "paid") return false;
    if (step === "image" && imageSkipped) return false;
    return true;
  });
}

function isApiServer(value: unknown): value is ApiServerId {
  return value === "RU1" || value === "RU2" || value === "RU3";
}

const TOAST_MS = 4000;
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

type GarageState = {
  cars: Car[];
  search: string;
  overlay: Overlay;
  subModal: SubModal;
  wizardStep: WizardStepId;
  draftAcquire: AcquireKind | null;
  draftName: string;
  draftPlate: string;
  draftRegion: string;
  draftImage: string | null;
  draftPrice: string;
  draftScrap: string;
  draftHourly: string;
  draftDaily: string;
  imageSkipped: boolean;
  detailsId: string | null;
  deleteId: string | null;
  rentId: string | null;
  rentKind: RentKind | null;
  rentStep: RentStep;
  rentDuration: string;
  rentAmount: string;
  draftOfficial: string;
  draftExpense: string;
  expenseSign: ExpenseSign;
  expenseTarget: ExpenseTarget;
  tariffKind: RentKind;
  tariffScope: TariffScope;
  tariffDraft: string;
  draftSale: string;
  saleNet: number;
  apiKey: string;
  apiServer: ApiServerId | null;
  apiPulse: number;
  draftEarnToday: string;
  draftEarnWeek: string;
  draftEarnMonth: string;
  draftEarnTotal: string;
  draftCarName: string;
  draftOwnedDays: string;
  logRange: LogRange;
  pendingImport: Car[] | null;
  toasts: Toast[];
  setSearch: (value: string) => void;
  openWizard: () => void;
  closeOverlay: () => void;
  setDraftName: (value: string) => void;
  setDraftPlate: (value: string) => void;
  setDraftRegion: (value: string) => void;
  setDraftImage: (value: string | null) => void;
  setDraftPrice: (value: string) => void;
  setDraftScrap: (value: string) => void;
  setDraftAcquire: (value: AcquireKind) => void;
  pickAcquire: (value: AcquireKind) => void;
  wizardNext: () => Promise<boolean>;
  wizardBack: () => void;
  finishWizard: () => boolean;
  openReset: () => void;
  confirmReset: () => void;
  openRent: (id: string) => void;
  setRentKind: (kind: RentKind) => void;
  setRentDuration: (value: string) => void;
  setRentAmount: (value: string) => void;
  pickRentDuration: (value: number) => void;
  fillRentFromTariff: () => boolean;
  rentNext: () => boolean;
  rentBack: () => void;
  openDelete: (id: string) => void;
  confirmDelete: () => void;
  openDetails: (id: string) => void;
  bootCheck: () => void;
  refreshCar: (id: string) => void;
  openOfficial: () => void;
  setDraftOfficial: (value: string) => void;
  saveOfficial: () => boolean;
  openExpense: () => void;
  openExpenseSub: () => void;
  setDraftExpense: (value: string) => void;
  saveExpense: () => boolean;
  openRepair: () => void;
  openRepairSub: () => void;
  openPlate: () => void;
  savePlate: () => boolean;
  openTariff: () => void;
  openTariffEdit: (kind: RentKind, scope: TariffScope) => void;
  setTariffDraft: (value: string) => void;
  saveTariffEdit: () => boolean;
  openSell: () => void;
  setDraftSale: (value: string) => void;
  confirmSell: () => boolean;
  acceptSell: () => void;
  openApi: () => void;
  setApiKey: (value: string) => void;
  selectApiServer: (id: ApiServerId) => void;
  openMarket: () => void;
  openEditEarn: () => void;
  setDraftEarnToday: (value: string) => void;
  setDraftEarnWeek: (value: string) => void;
  setDraftEarnMonth: (value: string) => void;
  setDraftEarnTotal: (value: string) => void;
  saveEditEarn: () => boolean;
  openClearLog: () => void;
  confirmClearLog: () => void;
  setLogRange: (range: LogRange) => void;
  setCarImage: (id: string, imageData: string) => void;
  openRename: () => void;
  setDraftCarName: (value: string) => void;
  saveRename: () => boolean;
  openOwnedDays: () => void;
  setDraftOwnedDays: (value: string) => void;
  saveOwnedDays: () => boolean;
  openUndoRent: () => void;
  confirmUndoRent: () => void;
  requestImport: (cars: Car[]) => void;
  confirmImport: () => void;
  cancelImport: () => void;
  pushToast: (text: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
};

function patchCar(cars: Car[], id: string, fn: (car: Car) => Car) {
  return cars.map((car) => (car.id === id ? fn(refreshCarPeriod(car)) : car));
}

export const useGarage = create<GarageState>()(
  persist(
    (set, get) => ({
      cars: [],
      search: "",
      overlay: "none",
      subModal: "none",
      wizardStep: "acquire",
      draftAcquire: null,
      draftName: "",
      draftPlate: "",
      draftRegion: "",
      draftImage: null,
      draftPrice: "",
      draftScrap: "",
      draftHourly: "",
      draftDaily: "",
      imageSkipped: false,
      detailsId: null,
      deleteId: null,
      rentId: null,
      rentKind: null,
      rentStep: "pick",
      rentDuration: "",
      rentAmount: "",
      draftOfficial: "",
      draftExpense: "",
      expenseSign: 1,
      expenseTarget: "expense",
      tariffKind: "hourly",
      tariffScope: "wizard",
      tariffDraft: "",
      draftSale: "",
      saleNet: 0,
      apiKey: "",
      apiServer: null,
      apiPulse: 0,
      draftEarnToday: "",
      draftEarnWeek: "",
      draftEarnMonth: "",
      draftEarnTotal: "",
      draftCarName: "",
      draftOwnedDays: "",
      logRange: "week",
      pendingImport: null,
      toasts: [],
      setSearch: (search) => set({ search }),
      openWizard: () =>
        set({
          overlay: "wizard",
          subModal: "none",
          wizardStep: "acquire",
          draftAcquire: null,
          draftName: "",
          draftPlate: "",
          draftRegion: "",
          draftImage: null,
          draftPrice: "",
          draftScrap: "",
          draftHourly: "",
          draftDaily: "",
          draftOfficial: "",
          imageSkipped: false,
        }),
      closeOverlay: () => {
        const s = get();
        if (s.subModal === "sell-result") return;
        if (s.subModal === "tariff-edit" && s.tariffScope === "car") {
          set({ subModal: "tariff" });
          return;
        }
        if (s.subModal !== "none") {
          set({ subModal: "none" });
          return;
        }
        if (s.overlay === "market") {
          set({ overlay: "details" });
          return;
        }
        set({
          overlay: "none",
          detailsId: null,
          deleteId: null,
          rentId: null,
          rentKind: null,
          rentStep: "pick",
          pendingImport: null,
        });
      },
      setDraftName: (draftName) => set({ draftName }),
      setDraftPlate: (draftPlate) => set({ draftPlate }),
      setDraftRegion: (draftRegion) => set({ draftRegion }),
      setDraftImage: (draftImage) => set({ draftImage }),
      setDraftPrice: (draftPrice) => set({ draftPrice }),
      setDraftScrap: (draftScrap) => set({ draftScrap }),
      setDraftAcquire: (draftAcquire) => set({ draftAcquire }),
      pickAcquire: (draftAcquire) =>
        set({
          draftAcquire,
          draftPrice: draftAcquire === "free" ? "0" : get().draftPrice,
          wizardStep: "name",
        }),
      wizardNext: async () => {
        const s = get();
        const path = wizardPath(s.draftAcquire, s.imageSkipped);
        const index = path.indexOf(s.wizardStep);
        const go = (wizardStep: WizardStepId, extra: Partial<GarageState> = {}) => {
          set({ wizardStep, ...extra });
          return true;
        };
        if (s.wizardStep === "acquire") {
          if (!s.draftAcquire) {
            s.pushToast("Выберите, бесплатно авто или платно", "error");
            return false;
          }
          return go("name");
        }
        if (s.wizardStep === "name") {
          if (!s.draftName.trim()) {
            s.pushToast("Введите название авто", "error");
            return false;
          }
          return go("plate");
        }
        if (s.wizardStep === "plate") {
          if (!isPlate(s.draftPlate)) {
            s.pushToast("Введите госномер: буква, три цифры, две буквы", "error");
            return false;
          }
          if (!isRegion(s.draftRegion)) {
            s.pushToast("Введите регион (2 или 3 цифры)", "error");
            return false;
          }
          const known = await albumGet(s.draftName);
          if (known) {
            return go(s.draftAcquire === "paid" ? "buy" : "official", {
              draftImage: known,
              imageSkipped: true,
            });
          }
          return go("image", { imageSkipped: false });
        }
        if (s.wizardStep === "image") {
          if (s.draftImage) void albumPut(s.draftName, s.draftImage);
          return go(s.draftAcquire === "paid" ? "buy" : "official");
        }
        if (s.wizardStep === "buy") {
          if (!s.draftPrice.trim() || !Number.isFinite(parseMoney(s.draftPrice))) {
            s.pushToast("Введите, за сколько купили авто", "error");
            return false;
          }
          return go("official");
        }
        if (s.wizardStep === "official") {
          if (!s.draftOfficial.trim() || !Number.isFinite(parseMoney(s.draftOfficial))) {
            s.pushToast("Введите госстоимость", "error");
            return false;
          }
          return go("scrap");
        }
        if (s.wizardStep === "scrap") {
          if (!s.draftScrap.trim() || !Number.isFinite(parseMoney(s.draftScrap))) {
            s.pushToast("Введите цену свалки", "error");
            return false;
          }
          return go("tariff");
        }
        if (index < 0) return false;
        return s.finishWizard();
      },
      wizardBack: () => {
        const s = get();
        const path = wizardPath(s.draftAcquire, s.imageSkipped);
        const index = path.indexOf(s.wizardStep);
        const prev = index > 0 ? path[index - 1] : null;
        if (prev) set({ wizardStep: prev });
      },
      finishWizard: () => {
        const s = get();
        const name = s.draftName.trim();
        if (!name) {
          s.pushToast("Введите название авто", "error");
          return false;
        }
        const hourly = parseMoney(s.draftHourly);
        const daily = parseMoney(s.draftDaily);
        if (!s.draftHourly.trim() || !Number.isFinite(hourly) || !s.draftDaily.trim() || !Number.isFinite(daily)) {
          s.pushToast("Задайте часовой и суточный тариф", "error");
          return false;
        }
        const official = parseMoney(s.draftOfficial);
        const keys = periodKeys();
        const now = Date.now();
        if (s.draftImage) void albumPut(name, s.draftImage);
        set({
          cars: [
            {
              id: newId(),
              name,
              plate: s.draftPlate,
              region: s.draftRegion,
              imageData: s.draftImage,
              price: s.draftAcquire === "free" ? 0 : parseMoney(s.draftPrice) || 0,
              scrapPrice: parseMoney(s.draftScrap) || 0,
              officialPrice: Number.isFinite(official) ? official : null,
              expenses: 0,
              repairs: 0,
              hourlyRate: hourly,
              dailyRate: daily,
              hours: 0,
              earnedToday: 0,
              earnedWeek: 0,
              earnedMonth: 0,
              earnedTotal: 0,
              todayKey: keys.todayKey,
              weekKey: keys.weekKey,
              monthKey: keys.monthKey,
              logs: [],
              monthLogs: [],
              createdAt: now,
              ownedFrom: now,
            },
            ...s.cars,
          ],
          overlay: "none",
          wizardStep: "acquire",
          subModal: "none",
        });
        get().pushToast(`Автомобиль «${name}» добавлен`, "info");
        return true;
      },
      openReset: () => set({ overlay: "reset", subModal: "none" }),
      confirmReset: () => {
        set({ cars: [], overlay: "none" });
        get().pushToast("База данных полностью очищена", "info");
      },
      openRent: (id) =>
        set({
          overlay: "rent",
          subModal: "none",
          rentId: id,
          rentKind: null,
          rentStep: "pick",
          rentDuration: "",
          rentAmount: "",
        }),
      setRentKind: (rentKind) => set({ rentKind, rentStep: "duration", rentDuration: "" }),
      setRentDuration: (rentDuration) => set({ rentDuration }),
      setRentAmount: (rentAmount) => set({ rentAmount }),
      pickRentDuration: (value) => {
        const max = get().rentKind === "daily" ? 7 : 24;
        const n = Math.round(value);
        if (!Number.isFinite(n) || n < 1 || n > max) return;
        set({ rentDuration: String(n), rentStep: "amount", rentAmount: "" });
      },
      fillRentFromTariff: () => {
        const s = get();
        const car = s.cars.find((row) => row.id === s.rentId);
        if (!car || !s.rentKind) return false;
        const duration = Number(String(s.rentDuration).replace(",", ".").replace(/\s/g, ""));
        const quote = tariffQuote(car, s.rentKind, duration);
        if (quote == null) {
          s.pushToast("Тариф для этого типа ещё не задан", "error");
          return false;
        }
        set({ rentAmount: String(quote) });
        return true;
      },
      rentNext: () => {
        const s = get();
        if (s.rentStep === "pick" || !s.rentKind) {
          s.pushToast("Выберите тип аренды", "error");
          return false;
        }
        if (s.rentStep === "duration") {
          const n = Number(String(s.rentDuration).replace(",", ".").replace(/\s/g, ""));
          if (!Number.isFinite(n) || n <= 0) {
            s.pushToast(
              s.rentKind === "daily" ? "Введите количество суток" : "Введите количество часов",
              "error",
            );
            return false;
          }
          set({ rentStep: "amount", rentAmount: "" });
          return true;
        }
        const amount = parseMoney(s.rentAmount);
        if (!s.rentAmount.trim() || !Number.isFinite(amount)) {
          s.pushToast("Введите сумму", "error");
          return false;
        }
        const duration = Number(String(s.rentDuration).replace(",", ".").replace(/\s/g, ""));
        const hours = s.rentKind === "daily" ? duration * 24 : duration;
        const id = s.rentId;
        if (!id) return false;
        const current = get().cars.find((car) => car.id === id);
        const log = {
          id: newId(),
          at: Date.now(),
          hours,
          amount,
          kind: s.rentKind ?? "hourly",
        };
        set({
          cars: patchCar(get().cars, id, (car) => ({
            ...car,
            hours: car.hours + hours,
            earnedToday: car.earnedToday + amount,
            earnedWeek: car.earnedWeek + amount,
            earnedMonth: car.earnedMonth + amount,
            earnedTotal: car.earnedTotal + amount,
            logs: [log, ...car.logs],
            monthLogs: [log, ...(car.monthLogs ?? [])],
          })),
          overlay: "none",
          rentId: null,
          rentKind: null,
          rentStep: "pick",
        });
        if (current) get().pushToast(`«${current.name}» сдан в аренду`, "info");
        return true;
      },
      rentBack: () => {
        const s = get();
        if (s.rentStep === "amount") set({ rentStep: "duration" });
        else if (s.rentStep === "duration") set({ rentStep: "pick", rentKind: null });
        else s.closeOverlay();
      },
      openDelete: (id) => set({ overlay: "delete", deleteId: id, subModal: "none" }),
      confirmDelete: () => {
        const id = get().deleteId;
        const current = get().cars.find((car) => car.id === id);
        set({
          cars: get().cars.filter((car) => car.id !== id),
          overlay: "none",
          deleteId: null,
          detailsId: null,
        });
        if (current) get().pushToast(`«${current.name}» удалён`, "info");
      },
      openDetails: (id) => {
        set({
          cars: get().cars.map((car) => (car.id === id ? refreshCarPeriod(car) : car)),
          overlay: "details",
          detailsId: id,
          subModal: "none",
          logRange: "week",
        });
      },
      bootCheck: () => {
        set({
          cars: get().cars.flatMap((car) => {
            const next = normalizeCar(car);
            return next ? [next] : [];
          }),
        });
      },
      refreshCar: (id) => {
        set({ cars: get().cars.map((car) => (car.id === id ? refreshCarPeriod(car) : car)) });
        get().pushToast("Информация обновлена", "info");
      },
      openOfficial: () => {
        const s = get();
        const car = s.cars.find((row) => row.id === s.detailsId);
        set({
          subModal: "official",
          draftOfficial: car?.officialPrice == null ? "" : String(car.officialPrice),
        });
      },
      setDraftOfficial: (draftOfficial) => set({ draftOfficial }),
      saveOfficial: () => {
        const s = get();
        const value = parseMoney(s.draftOfficial);
        if (!Number.isFinite(value)) {
          s.pushToast("Введите госстоимость", "error");
          return false;
        }
        const id = s.detailsId;
        if (!id) return false;
        set({
          cars: patchCar(s.cars, id, (car) => ({ ...car, officialPrice: value })),
          subModal: "none",
        });
        get().pushToast("Госстоимость сохранена", "info");
        return true;
      },
      openExpense: () =>
        set({ subModal: "expense", draftExpense: "", expenseSign: 1, expenseTarget: "expense" }),
      openExpenseSub: () =>
        set({ subModal: "expense", draftExpense: "", expenseSign: -1, expenseTarget: "expense" }),
      openRepair: () =>
        set({ subModal: "expense", draftExpense: "", expenseSign: 1, expenseTarget: "repair" }),
      openRepairSub: () =>
        set({ subModal: "expense", draftExpense: "", expenseSign: -1, expenseTarget: "repair" }),
      setDraftExpense: (draftExpense) => set({ draftExpense }),
      saveExpense: () => {
        const s = get();
        const value = parseMoney(s.draftExpense);
        if (!Number.isFinite(value) || value <= 0) {
          s.pushToast("Введите сумму расхода", "error");
          return false;
        }
        const id = s.detailsId;
        if (!id) return false;
        set({
          cars: patchCar(s.cars, id, (car) =>
            s.expenseTarget === "repair"
              ? applyRepairDelta(car, value, s.expenseSign)
              : applyExpenseDelta(car, value, s.expenseSign),
          ),
          subModal: "none",
        });
        const repair = s.expenseTarget === "repair";
        get().pushToast(
          s.expenseSign < 0
            ? repair
              ? "Ремонт убавлен"
              : "Расход убавлен"
            : repair
              ? "Ремонт добавлен"
              : "Расход добавлен",
          "info",
        );
        return true;
      },
      openEditEarn: () => {
        const s = get();
        const found = s.cars.find((car) => car.id === s.detailsId);
        if (!found) return;
        const car = refreshCarPeriod(found);
        set({
          subModal: "edit-earn",
          draftEarnToday: String(car.earnedToday),
          draftEarnWeek: String(car.earnedWeek),
          draftEarnMonth: String(car.earnedMonth),
          draftEarnTotal: String(car.earnedTotal),
        });
      },
      setDraftEarnToday: (draftEarnToday) => set({ draftEarnToday }),
      setDraftEarnWeek: (draftEarnWeek) => set({ draftEarnWeek }),
      setDraftEarnMonth: (draftEarnMonth) => set({ draftEarnMonth }),
      setDraftEarnTotal: (draftEarnTotal) => set({ draftEarnTotal }),
      saveEditEarn: () => {
        const s = get();
        const today = parseMoney(s.draftEarnToday);
        const week = parseMoney(s.draftEarnWeek);
        const month = parseMoney(s.draftEarnMonth);
        const total = parseMoney(s.draftEarnTotal);
        if (![today, week, month, total].every(Number.isFinite)) {
          s.pushToast("Введите суммы", "error");
          return false;
        }
        const id = s.detailsId;
        if (!id) return false;
        set({
          cars: patchCar(s.cars, id, (car) => ({
            ...car,
            earnedToday: today,
            earnedWeek: week,
            earnedMonth: month,
            earnedTotal: total,
          })),
          subModal: "none",
        });
        get().pushToast("Заработок обновлён", "info");
        return true;
      },
      openClearLog: () => set({ subModal: "clear-log" }),
      confirmClearLog: () => {
        const id = get().detailsId;
        if (!id) return;
        const range = get().logRange;
        set({
          cars: patchCar(get().cars, id, (car) =>
            range === "month" ? { ...car, monthLogs: [] } : { ...car, logs: [] },
          ),
          subModal: "none",
        });
        get().pushToast(range === "month" ? "Месячный лог очищен" : "Недельный лог очищен", "info");
      },
      setLogRange: (logRange) => set({ logRange }),
      setCarImage: (id, imageData) => {
        set({
          cars: patchCar(get().cars, id, (car) => ({ ...car, imageData })),
        });
        get().pushToast("Изображение сохранено", "info");
      },
      openRename: () => {
        const s = get();
        const car = s.cars.find((row) => row.id === s.detailsId);
        set({ subModal: "rename", draftCarName: car?.name ?? "" });
      },
      setDraftCarName: (draftCarName) => set({ draftCarName }),
      saveRename: () => {
        const s = get();
        const name = s.draftCarName.trim();
        if (!name) {
          s.pushToast("Введите название авто", "error");
          return false;
        }
        const id = s.detailsId;
        if (!id) return false;
        set({
          cars: patchCar(s.cars, id, (car) => ({ ...car, name })),
          subModal: "none",
        });
        get().pushToast("Название обновлено", "info");
        return true;
      },
      openOwnedDays: () => {
        const s = get();
        const car = s.cars.find((row) => row.id === s.detailsId);
        if (!car) return;
        set({ subModal: "owned-days", draftOwnedDays: String(daysOwned(car)) });
      },
      setDraftOwnedDays: (draftOwnedDays) => set({ draftOwnedDays }),
      saveOwnedDays: () => {
        const s = get();
        const n = Number(String(s.draftOwnedDays).replace(",", ".").replace(/\s/g, ""));
        if (!Number.isFinite(n) || n < 1) {
          s.pushToast("Введите количество дней", "error");
          return false;
        }
        const id = s.detailsId;
        if (!id) return false;
        set({
          cars: patchCar(s.cars, id, (car) => ({
            ...car,
            ownedFrom: ownedFromForDays(Math.floor(n)),
          })),
          subModal: "none",
        });
        get().pushToast("Срок владения обновлён", "info");
        return true;
      },
      openPlate: () => {
        const s = get();
        const car = s.cars.find((row) => row.id === s.detailsId);
        set({ subModal: "plate", draftPlate: car?.plate ?? "", draftRegion: car?.region ?? "" });
      },
      savePlate: () => {
        const s = get();
        if (!isPlate(s.draftPlate)) {
          s.pushToast("Введите госномер: буква, три цифры, две буквы", "error");
          return false;
        }
        if (!isRegion(s.draftRegion)) {
          s.pushToast("Введите регион (2 или 3 цифры)", "error");
          return false;
        }
        const id = s.detailsId;
        if (!id) return false;
        set({
          cars: patchCar(s.cars, id, (car) => ({
            ...car,
            plate: s.draftPlate,
            region: s.draftRegion,
          })),
          subModal: "none",
        });
        get().pushToast("Госномер обновлён", "info");
        return true;
      },
      openTariff: () => set({ subModal: "tariff" }),
      openTariffEdit: (tariffKind, tariffScope) => {
        const s = get();
        if (tariffScope === "wizard") {
          set({
            subModal: "tariff-edit",
            tariffKind,
            tariffScope,
            tariffDraft: tariffKind === "daily" ? s.draftDaily : s.draftHourly,
          });
          return;
        }
        const car = s.cars.find((row) => row.id === s.detailsId);
        const current = tariffKind === "daily" ? car?.dailyRate : car?.hourlyRate;
        set({
          subModal: "tariff-edit",
          tariffKind,
          tariffScope,
          tariffDraft: current == null ? "" : String(current),
        });
      },
      setTariffDraft: (tariffDraft) => set({ tariffDraft }),
      saveTariffEdit: () => {
        const s = get();
        const value = parseMoney(s.tariffDraft);
        if (!s.tariffDraft.trim() || !Number.isFinite(value)) {
          s.pushToast("Введите тариф", "error");
          return false;
        }
        if (s.tariffScope === "wizard") {
          set({
            subModal: "none",
            draftHourly: s.tariffKind === "hourly" ? String(value) : s.draftHourly,
            draftDaily: s.tariffKind === "daily" ? String(value) : s.draftDaily,
          });
          return true;
        }
        const id = s.detailsId;
        if (!id) return false;
        set({
          cars: patchCar(s.cars, id, (car) => ({
            ...car,
            hourlyRate: s.tariffKind === "hourly" ? value : car.hourlyRate,
            dailyRate: s.tariffKind === "daily" ? value : car.dailyRate,
          })),
          subModal: "tariff",
        });
        get().pushToast("Тариф сохранён", "info");
        return true;
      },
      openSell: () => set({ subModal: "sell-ask", draftSale: "" }),
      setDraftSale: (draftSale) => set({ draftSale }),
      confirmSell: () => {
        const s = get();
        const sale = parseMoney(s.draftSale);
        if (!s.draftSale.trim() || !Number.isFinite(sale)) {
          s.pushToast("Введите, за сколько продали", "error");
          return false;
        }
        const car = s.cars.find((row) => row.id === s.detailsId);
        if (!car) return false;
        set({
          overlay: "none",
          subModal: "sell-result",
          saleNet: sellOutcome(car, sale).net,
        });
        return true;
      },
      acceptSell: () => {
        const id = get().detailsId;
        const current = get().cars.find((car) => car.id === id);
        set({
          cars: get().cars.filter((car) => car.id !== id),
          overlay: "none",
          subModal: "none",
          detailsId: null,
          deleteId: null,
        });
        if (current) get().pushToast(`«${current.name}» продан и убран из базы`, "info");
      },
      openApi: () => set({ overlay: "api", subModal: "none" }),
      setApiKey: (apiKey) => set({ apiKey }),
      selectApiServer: (apiServer) => set({ apiServer, apiPulse: Date.now() }),
      openMarket: () => set({ overlay: "market" }),
      openUndoRent: () => set({ subModal: "undo-rent" }),
      confirmUndoRent: () => {
        const id = get().detailsId;
        if (!id) return;
        const found = get().cars.find((car) => car.id === id);
        if (!found) return;
        const { car, undone } = applyUndoLastRent(found);
        if (!undone) {
          get().pushToast("Последней аренды нет", "error");
          set({ subModal: "none" });
          return;
        }
        set({
          cars: get().cars.map((row) => (row.id === id ? car : row)),
          subModal: "none",
        });
        get().pushToast("Последняя аренда отменена", "info");
      },
      requestImport: (cars) => {
        if (!cars.length) {
          get().pushToast("В файле нет автомобилей", "error");
          return;
        }
        if (get().cars.length === 0) {
          set({ cars, overlay: "none", pendingImport: null });
          get().pushToast(`Загружено автомобилей: ${cars.length}`, "info");
          return;
        }
        set({ overlay: "import-confirm", subModal: "none", pendingImport: cars });
      },
      confirmImport: () => {
        const cars = get().pendingImport ?? [];
        set({
          cars,
          overlay: "none",
          pendingImport: null,
          detailsId: null,
          deleteId: null,
        });
        get().pushToast(`Загружено автомобилей: ${cars.length}`, "info");
      },
      cancelImport: () => set({ overlay: "none", pendingImport: null }),
      pushToast: (text, kind = "info") => {
        const id = newId();
        set({ toasts: [...get().toasts.slice(-2), { id, text, kind }] });
        if (typeof window !== "undefined") {
          window.setTimeout(() => get().dismissToast(id), TOAST_MS);
        }
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => (typeof window === "undefined" ? noopStorage : localStorage)),
      partialize: (state) => ({
        cars: state.cars,
        apiKey: state.apiKey,
        apiServer: state.apiServer,
      }),
      migrate: (persisted) => {
        const data = (persisted ?? {}) as {
          cars?: unknown[];
          apiKey?: unknown;
          apiServer?: unknown;
        };
        return {
          cars: (data.cars ?? []).flatMap((row) => {
            const car = normalizeCar(row);
            return car ? [car] : [];
          }),
          apiKey: typeof data.apiKey === "string" ? data.apiKey : "",
          apiServer: isApiServer(data.apiServer) ? data.apiServer : null,
        };
      },
      merge: (persisted, current) => {
        const data = (persisted ?? {}) as {
          cars?: unknown[];
          apiKey?: unknown;
          apiServer?: unknown;
        };
        return {
          ...current,
          cars: (data.cars ?? []).flatMap((row) => {
            const car = normalizeCar(row);
            return car ? [car] : [];
          }),
          apiKey: typeof data.apiKey === "string" ? data.apiKey : "",
          apiServer: isApiServer(data.apiServer) ? data.apiServer : null,
        };
      },
    },
  ),
);
