import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  STORAGE_KEY,
  STORAGE_VERSION,
  type Car,
  type Overlay,
  type RentKind,
  type RentStep,
  type SubModal,
  type Toast,
  type ToastKind,
} from "./types";
import { isPlate, isRegion, newId, normalizeCar, parseMoney, periodKeys, refreshCarPeriod } from "./utils";

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
  wizardStep: number;
  draftName: string;
  draftPlate: string;
  draftRegion: string;
  draftImage: string | null;
  draftPrice: string;
  draftScrap: string;
  detailsId: string | null;
  deleteId: string | null;
  rentId: string | null;
  rentKind: RentKind | null;
  rentStep: RentStep;
  rentDuration: string;
  rentAmount: string;
  draftOfficial: string;
  draftExpense: string;
  draftEarnToday: string;
  draftEarnWeek: string;
  draftEarnMonth: string;
  draftEarnTotal: string;
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
  wizardNext: () => boolean;
  wizardBack: () => void;
  finishWizard: () => boolean;
  openReset: () => void;
  confirmReset: () => void;
  openRent: (id: string) => void;
  setRentKind: (kind: RentKind) => void;
  setRentDuration: (value: string) => void;
  setRentAmount: (value: string) => void;
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
  setDraftExpense: (value: string) => void;
  saveExpense: () => boolean;
  openEditEarn: () => void;
  setDraftEarnToday: (value: string) => void;
  setDraftEarnWeek: (value: string) => void;
  setDraftEarnMonth: (value: string) => void;
  setDraftEarnTotal: (value: string) => void;
  saveEditEarn: () => boolean;
  openClearLog: () => void;
  confirmClearLog: () => void;
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
      wizardStep: 1,
      draftName: "",
      draftPlate: "",
      draftRegion: "",
      draftImage: null,
      draftPrice: "",
      draftScrap: "",
      detailsId: null,
      deleteId: null,
      rentId: null,
      rentKind: null,
      rentStep: "pick",
      rentDuration: "",
      rentAmount: "",
      draftOfficial: "",
      draftExpense: "",
      draftEarnToday: "",
      draftEarnWeek: "",
      draftEarnMonth: "",
      draftEarnTotal: "",
      pendingImport: null,
      toasts: [],
      setSearch: (search) => set({ search }),
      openWizard: () =>
        set({
          overlay: "wizard",
          subModal: "none",
          wizardStep: 1,
          draftName: "",
          draftPlate: "",
          draftRegion: "",
          draftImage: null,
          draftPrice: "",
          draftScrap: "",
        }),
      closeOverlay: () => {
        if (get().subModal !== "none") {
          set({ subModal: "none" });
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
      wizardNext: () => {
        const s = get();
        if (s.wizardStep === 1) {
          if (!s.draftName.trim()) {
            s.pushToast("Введите название авто", "error");
            return false;
          }
          set({ wizardStep: 2 });
          return true;
        }
        if (s.wizardStep === 2) {
          if (!isPlate(s.draftPlate)) {
            s.pushToast("Введите госномер: буква, три цифры, две буквы", "error");
            return false;
          }
          if (!isRegion(s.draftRegion)) {
            s.pushToast("Введите регион (2 или 3 цифры)", "error");
            return false;
          }
          set({ wizardStep: 3 });
          return true;
        }
        if (s.wizardStep === 3) {
          set({ wizardStep: 4 });
          return true;
        }
        return s.finishWizard();
      },
      wizardBack: () => {
        const step = get().wizardStep;
        if (step === 2) set({ wizardStep: 1 });
        else if (step === 3) set({ wizardStep: 2 });
        else if (step === 4) set({ wizardStep: 3 });
      },
      finishWizard: () => {
        const s = get();
        const name = s.draftName.trim();
        if (!name) {
          s.pushToast("Введите название авто", "error");
          return false;
        }
        const keys = periodKeys();
        set({
          cars: [
            {
              id: newId(),
              name,
              plate: s.draftPlate,
              region: s.draftRegion,
              imageData: s.draftImage,
              price: parseMoney(s.draftPrice) || 0,
              scrapPrice: parseMoney(s.draftScrap) || 0,
              officialPrice: null,
              expenses: 0,
              hours: 0,
              earnedToday: 0,
              earnedWeek: 0,
              earnedMonth: 0,
              earnedTotal: 0,
              todayKey: keys.todayKey,
              weekKey: keys.weekKey,
              monthKey: keys.monthKey,
              logs: [],
              createdAt: Date.now(),
            },
            ...s.cars,
          ],
          overlay: "none",
          wizardStep: 1,
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
        set({
          cars: patchCar(get().cars, id, (car) => ({
            ...car,
            hours: car.hours + hours,
            earnedToday: car.earnedToday + amount,
            earnedWeek: car.earnedWeek + amount,
            earnedMonth: car.earnedMonth + amount,
            earnedTotal: car.earnedTotal + amount,
            logs: [
              {
                id: newId(),
                at: Date.now(),
                hours,
                amount,
                kind: s.rentKind ?? "hourly",
              },
              ...car.logs,
            ],
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
      openExpense: () => set({ subModal: "expense", draftExpense: "" }),
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
          cars: patchCar(s.cars, id, (car) => ({
            ...car,
            expenses: car.expenses + value,
            price: car.price + value,
          })),
          subModal: "none",
        });
        get().pushToast("Расход добавлен", "info");
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
        set({
          cars: patchCar(get().cars, id, (car) => ({ ...car, logs: [] })),
          subModal: "none",
        });
        get().pushToast("Лог очищен", "info");
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
      partialize: (state) => ({ cars: state.cars }),
      migrate: (persisted) => {
        const data = (persisted ?? {}) as { cars?: unknown[] };
        return {
          cars: (data.cars ?? []).flatMap((row) => {
            const car = normalizeCar(row);
            return car ? [car] : [];
          }),
        };
      },
      merge: (persisted, current) => {
        const data = (persisted ?? {}) as { cars?: unknown[] };
        return {
          ...current,
          cars: (data.cars ?? []).flatMap((row) => {
            const car = normalizeCar(row);
            return car ? [car] : [];
          }),
        };
      },
    },
  ),
);
