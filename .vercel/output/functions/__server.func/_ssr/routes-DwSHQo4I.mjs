import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as RotateCcw, c as Clock, i as Search, l as Check, o as Plus, r as Trash2, s as Pencil, t as Upload, u as Car } from "../_libs/lucide-react.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DwSHQo4I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STORAGE_KEY = "garage-db-v1";
var BACKUP_KIND = "garazh-backup";
var BACKUP_MARKER = "===== GARAZH-BACKUP-V1 =====";
var TZ = "Europe/Moscow";
var PLATE_LETTERS = "АВЕКМНОРСТУХ";
var LAT_TO_CYR = {
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
	X: "Х"
};
function moscowParts(date = /* @__PURE__ */ new Date()) {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		weekday: "short",
		hourCycle: "h23"
	}).formatToParts(date);
	const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
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
		monthKey: `${year}-${month}`
	};
}
function weekKey(date = /* @__PURE__ */ new Date()) {
	const weekday = {
		Mon: 0,
		Tue: 1,
		Wed: 2,
		Thu: 3,
		Fri: 4,
		Sat: 5,
		Sun: 6
	}[moscowParts(date).weekday] ?? 0;
	return moscowParts(/* @__PURE__ */ new Date(date.getTime() - weekday * 864e5)).dateKey;
}
function periodKeys(date = /* @__PURE__ */ new Date()) {
	const t = moscowParts(date);
	return {
		todayKey: t.dateKey,
		weekKey: weekKey(date),
		monthKey: t.monthKey
	};
}
function formatDate(at) {
	return new Intl.DateTimeFormat("ru-RU", {
		timeZone: TZ,
		day: "2-digit",
		month: "2-digit",
		year: "numeric"
	}).format(new Date(at));
}
function formatTime(at) {
	return new Intl.DateTimeFormat("ru-RU", {
		timeZone: TZ,
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).format(new Date(at));
}
function money(value) {
	return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)} руб.`;
}
function parseMoney(raw) {
	const n = Number(String(raw).replace(",", ".").replace(/\s/g, ""));
	return Number.isFinite(n) && n >= 0 ? n : NaN;
}
function percent(value) {
	const n = Number.isFinite(value) ? Math.max(0, value) : 0;
	return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n)}%`;
}
function hoursLabel(value) {
	if (!Number.isFinite(value) || value <= 0) return "0 Ч";
	if (value < 1) return `${Math.max(1, Math.round(value * 60))} мин`;
	const h = Math.floor(value);
	const m = Math.round((value - h) * 60);
	return m === 0 ? `${h} Ч` : `${h} Ч ${m} мин`;
}
function mapLetter(ch) {
	const up = ch.toUpperCase();
	const mapped = LAT_TO_CYR[up] ?? up;
	return PLATE_LETTERS.includes(mapped) ? mapped : "";
}
function sanitizePlate(raw) {
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
function sanitizeRegion(raw) {
	return raw.replace(/\D/g, "").slice(0, 3);
}
function isPlate(value) {
	return new RegExp(`^[${PLATE_LETTERS}]\\d{3}[${PLATE_LETTERS}]{2}$`).test(value);
}
function isRegion(value) {
	return /^\d{2,3}$/.test(value);
}
function formatPlate(plate, region) {
	if (!plate && !region) return "";
	return region ? `${plate}  ${region}` : plate;
}
function newId() {
	return crypto.randomUUID();
}
function readCarImage(file) {
	return new Promise((resolve, reject) => {
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
				reject(/* @__PURE__ */ new Error("canvas"));
				return;
			}
			ctx.clearRect(0, 0, width, height);
			ctx.drawImage(img, 0, 0, width, height);
			URL.revokeObjectURL(url);
			resolve(/png|webp/i.test(file.type) || /\.(png|webp)$/i.test(file.name) ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", .82));
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(/* @__PURE__ */ new Error("image"));
		};
		img.src = url;
	});
}
var clickCtx = null;
function playClick() {
	try {
		const Ctor = window.AudioContext || window.webkitAudioContext;
		if (!Ctor) return;
		clickCtx ??= new Ctor();
		if (clickCtx.state === "suspended") clickCtx.resume();
		const osc = clickCtx.createOscillator();
		const gain = clickCtx.createGain();
		osc.type = "square";
		osc.frequency.value = 920;
		gain.gain.setValueAtTime(.045, clickCtx.currentTime);
		gain.gain.exponentialRampToValueAtTime(.001, clickCtx.currentTime + .045);
		osc.connect(gain);
		gain.connect(clickCtx.destination);
		osc.start();
		osc.stop(clickCtx.currentTime + .05);
	} catch {}
}
function refreshCarPeriod(car, date = /* @__PURE__ */ new Date()) {
	const keys = periodKeys(date);
	const next = {
		...car,
		logs: Array.isArray(car.logs) ? car.logs : []
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
		next.monthKey = keys.monthKey;
	}
	return next;
}
function asNumber(value, fallback = 0) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function asLog(value) {
	if (!value || typeof value !== "object") return null;
	const row = value;
	const amount = asNumber(row.amount, NaN);
	const hours = asNumber(row.hours, NaN);
	const at = asNumber(row.at, NaN);
	if (!Number.isFinite(amount) || !Number.isFinite(hours) || !Number.isFinite(at)) return null;
	return {
		id: typeof row.id === "string" && row.id ? row.id : newId(),
		at,
		hours,
		amount,
		kind: row.kind === "daily" ? "daily" : "hourly"
	};
}
function normalizeCar(raw) {
	if (!raw || typeof raw !== "object") return null;
	const e = raw;
	if (!e.id || !e.name) return null;
	const keys = periodKeys();
	const logs = Array.isArray(e.logs) ? e.logs.flatMap((row) => {
		const log = asLog(row);
		return log ? [log] : [];
	}) : [];
	return refreshCarPeriod({
		...e,
		id: String(e.id),
		name: String(e.name),
		plate: typeof e.plate === "string" ? e.plate : "",
		region: typeof e.region === "string" ? e.region : "",
		imageData: typeof e.imageData === "string" ? e.imageData : null,
		price: asNumber(e.price),
		scrapPrice: asNumber(e.scrapPrice),
		officialPrice: typeof e.officialPrice === "number" && Number.isFinite(e.officialPrice) ? e.officialPrice : null,
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
		createdAt: asNumber(e.createdAt, Date.now())
	});
}
function paybackRatio(car) {
	return car.scrapPrice <= 0 ? 0 : Math.max(0, Math.min(1, car.earnedTotal / car.scrapPrice));
}
function leftover(car) {
	return Math.max(0, car.price - car.scrapPrice - car.earnedTotal);
}
function paybackPercent(car) {
	const base = car.price - car.scrapPrice;
	if (base <= 0) return car.earnedTotal > 0 ? 100 : 0;
	return Math.max(0, Math.min(100, car.earnedTotal / base * 100));
}
function reached(earned, target) {
	return target != null && target > 0 && earned >= target;
}
function filterCars(cars, query) {
	const q = query.trim().toLowerCase();
	if (!q) return cars;
	const compact = q.replace(/\s+/g, "");
	return cars.filter((car) => {
		const plate = `${car.plate}${car.region}`.toLowerCase();
		return car.name.toLowerCase().includes(q) || plate.includes(compact);
	});
}
var TOAST_MS = 4e3;
var noopStorage = {
	getItem: () => null,
	setItem: () => {},
	removeItem: () => {}
};
function patchCar(cars, id, fn) {
	return cars.map((car) => car.id === id ? fn(refreshCarPeriod(car)) : car);
}
var useGarage = create()(persist((set, get) => ({
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
	openWizard: () => set({
		overlay: "wizard",
		subModal: "none",
		wizardStep: 1,
		draftName: "",
		draftPlate: "",
		draftRegion: "",
		draftImage: null,
		draftPrice: "",
		draftScrap: ""
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
			pendingImport: null
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
			cars: [{
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
				createdAt: Date.now()
			}, ...s.cars],
			overlay: "none",
			wizardStep: 1
		});
		get().pushToast(`Автомобиль «${name}» добавлен`, "info");
		return true;
	},
	openReset: () => set({
		overlay: "reset",
		subModal: "none"
	}),
	confirmReset: () => {
		set({
			cars: [],
			overlay: "none"
		});
		get().pushToast("База данных полностью очищена", "info");
	},
	openRent: (id) => set({
		overlay: "rent",
		subModal: "none",
		rentId: id,
		rentKind: null,
		rentStep: "pick",
		rentDuration: "",
		rentAmount: ""
	}),
	setRentKind: (rentKind) => set({
		rentKind,
		rentStep: "duration",
		rentDuration: ""
	}),
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
				s.pushToast(s.rentKind === "daily" ? "Введите количество суток" : "Введите количество часов", "error");
				return false;
			}
			set({
				rentStep: "amount",
				rentAmount: ""
			});
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
				logs: [{
					id: newId(),
					at: Date.now(),
					hours,
					amount,
					kind: s.rentKind ?? "hourly"
				}, ...car.logs]
			})),
			overlay: "none",
			rentId: null,
			rentKind: null,
			rentStep: "pick"
		});
		if (current) get().pushToast(`«${current.name}» сдан в аренду`, "info");
		return true;
	},
	rentBack: () => {
		const s = get();
		if (s.rentStep === "amount") set({ rentStep: "duration" });
		else if (s.rentStep === "duration") set({
			rentStep: "pick",
			rentKind: null
		});
		else s.closeOverlay();
	},
	openDelete: (id) => set({
		overlay: "delete",
		deleteId: id,
		subModal: "none"
	}),
	confirmDelete: () => {
		const id = get().deleteId;
		const current = get().cars.find((car) => car.id === id);
		set({
			cars: get().cars.filter((car) => car.id !== id),
			overlay: "none",
			deleteId: null,
			detailsId: null
		});
		if (current) get().pushToast(`«${current.name}» удалён`, "info");
	},
	openDetails: (id) => {
		set({
			cars: get().cars.map((car) => car.id === id ? refreshCarPeriod(car) : car),
			overlay: "details",
			detailsId: id,
			subModal: "none"
		});
	},
	bootCheck: () => {
		set({ cars: get().cars.flatMap((car) => {
			const next = normalizeCar(car);
			return next ? [next] : [];
		}) });
	},
	refreshCar: (id) => {
		set({ cars: get().cars.map((car) => car.id === id ? refreshCarPeriod(car) : car) });
		get().pushToast("Информация обновлена", "info");
	},
	openOfficial: () => {
		const s = get();
		const car = s.cars.find((row) => row.id === s.detailsId);
		set({
			subModal: "official",
			draftOfficial: car?.officialPrice == null ? "" : String(car.officialPrice)
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
			cars: patchCar(s.cars, id, (car) => ({
				...car,
				officialPrice: value
			})),
			subModal: "none"
		});
		get().pushToast("Госстоимость сохранена", "info");
		return true;
	},
	openExpense: () => set({
		subModal: "expense",
		draftExpense: ""
	}),
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
				price: car.price + value
			})),
			subModal: "none"
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
			draftEarnTotal: String(car.earnedTotal)
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
		if (![
			today,
			week,
			month,
			total
		].every(Number.isFinite)) {
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
				earnedTotal: total
			})),
			subModal: "none"
		});
		get().pushToast("Заработок обновлён", "info");
		return true;
	},
	openClearLog: () => set({ subModal: "clear-log" }),
	confirmClearLog: () => {
		const id = get().detailsId;
		if (!id) return;
		set({
			cars: patchCar(get().cars, id, (car) => ({
				...car,
				logs: []
			})),
			subModal: "none"
		});
		get().pushToast("Лог очищен", "info");
	},
	requestImport: (cars) => {
		if (!cars.length) {
			get().pushToast("В файле нет автомобилей", "error");
			return;
		}
		if (get().cars.length === 0) {
			set({
				cars,
				overlay: "none",
				pendingImport: null
			});
			get().pushToast(`Загружено автомобилей: ${cars.length}`, "info");
			return;
		}
		set({
			overlay: "import-confirm",
			subModal: "none",
			pendingImport: cars
		});
	},
	confirmImport: () => {
		const cars = get().pendingImport ?? [];
		set({
			cars,
			overlay: "none",
			pendingImport: null,
			detailsId: null,
			deleteId: null
		});
		get().pushToast(`Загружено автомобилей: ${cars.length}`, "info");
	},
	cancelImport: () => set({
		overlay: "none",
		pendingImport: null
	}),
	pushToast: (text, kind = "info") => {
		const id = newId();
		set({ toasts: [...get().toasts.slice(-2), {
			id,
			text,
			kind
		}] });
		if (typeof window !== "undefined") window.setTimeout(() => get().dismissToast(id), TOAST_MS);
	},
	dismissToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
}), {
	name: STORAGE_KEY,
	version: 5,
	storage: createJSONStorage(() => typeof window === "undefined" ? noopStorage : localStorage),
	partialize: (state) => ({ cars: state.cars }),
	migrate: (persisted) => {
		return { cars: ((persisted ?? {}).cars ?? []).flatMap((row) => {
			const car = normalizeCar(row);
			return car ? [car] : [];
		}) };
	},
	merge: (persisted, current) => {
		const data = persisted ?? {};
		return {
			...current,
			cars: (data.cars ?? []).flatMap((row) => {
				const car = normalizeCar(row);
				return car ? [car] : [];
			})
		};
	}
}));
function CarCard({ car }) {
	const openRent = useGarage((s) => s.openRent);
	const openDelete = useGarage((s) => s.openDelete);
	const openDetails = useGarage((s) => s.openDetails);
	const plate = formatPlate(car.plate, car.region);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex w-44 shrink-0 flex-col overflow-hidden bg-surface shadow-[var(--shadow-border)] md:w-48",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "tabular-nums",
					children: hoursLabel(car.hours)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-28 bg-surface md:h-32",
				children: car.imageData ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: car.imageData,
					alt: car.name,
					className: "h-full w-full object-contain",
					draggable: false
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-full items-center justify-center text-xs text-subtle",
					children: "Нет фото"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-2.5 pt-2 pb-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "truncate text-sm font-semibold text-fg",
					children: car.name
				}), plate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 truncate text-xs tracking-wide text-muted tabular-nums",
					children: plate
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "card-action",
				onClick: () => {
					playClick();
					openRent(car.id);
				},
				children: "Сдать в аренду"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "card-action",
				onClick: () => {
					playClick();
					openDetails(car.id);
				},
				children: "Подробнее"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "card-action",
				onClick: () => {
					playClick();
					openDelete(car.id);
				},
				children: "Удалить"
			})
		]
	});
}
function CarGlyph({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.8",
		strokeLinejoin: "round",
		strokeLinecap: "round",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 14.5h1.15c.28 1.35 1.48 2.35 2.9 2.35s2.62-1 2.9-2.35h4.2c.28 1.35 1.48 2.35 2.9 2.35s2.62-1 2.9-2.35H21v-3.05l-2.15-3.95h-5.2L11.4 5.5H7.15L5.05 11.5H3z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "7.05",
				cy: "16.85",
				r: "1.15",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16.95",
				cy: "16.85",
				r: "1.15",
				fill: "currentColor",
				stroke: "none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5.2 11.5h13.1" })
		]
	});
}
function downloadBlob(filename, contents, mime) {
	const blob = new Blob([`\uFEFF${contents}`], { type: `${mime};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function backupFilename(date = /* @__PURE__ */ new Date()) {
	const t = moscowParts(date);
	return `garage-log-${t.year}-${t.month}-${t.day}.txt`;
}
function readableLog(cars, date = /* @__PURE__ */ new Date()) {
	const t = moscowParts(date);
	const lines = [
		"Выгрузка лога автомобилей",
		`Дата: ${t.day}.${t.month}.${t.year} ${t.hour}:${t.minute} (МСК)`,
		`Автомобилей: ${cars.length}`,
		"Полная копия базы (карточки, фото, история и заработок) сохранена в блоке ниже.",
		"Не удаляйте строку GARAZH-BACKUP — она нужна, чтобы загрузить авто обратно.",
		""
	];
	if (cars.length === 0) {
		lines.push("Автомобилей в базе нет.");
		return lines.join("\r\n");
	}
	cars.forEach((car, index) => {
		const trips = typeof car.trips === "number" ? car.trips : car.logs?.length ?? 0;
		const plate = formatPlate(car.plate, car.region) || "—";
		const official = car.officialPrice == null ? "не заполнено" : money(car.officialPrice);
		lines.push([
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
			`Часов: ${hoursLabel(car.hours)}`
		].join(" | "));
	});
	return lines.join("\r\n");
}
function buildBackup(cars, date = /* @__PURE__ */ new Date()) {
	const t = moscowParts(date);
	return {
		kind: BACKUP_KIND,
		app: "Гараж",
		version: 5,
		exportedAt: date.getTime(),
		exportedAtMsk: `${t.day}.${t.month}.${t.year} ${t.hour}:${t.minute}`,
		summary: readableLog(cars, date),
		cars
	};
}
function exportGarageLog(cars) {
	const backup = buildBackup(cars);
	const body = `${backup.summary}\r\n\r\n${BACKUP_MARKER}\r\n${JSON.stringify(backup)}`;
	downloadBlob(backupFilename(), body, "text/plain");
}
function carsFromUnknown(raw) {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw.flatMap((row) => {
		const car = normalizeCar(row);
		return car ? [car] : [];
	});
	if (typeof raw !== "object") return [];
	const obj = raw;
	if (obj.kind === "garazh-backup" && Array.isArray(obj.cars)) return carsFromUnknown(obj.cars);
	if (obj.state && typeof obj.state === "object") {
		const state = obj.state;
		if (Array.isArray(state.cars)) return carsFromUnknown(state.cars);
	}
	if (Array.isArray(obj.cars)) return carsFromUnknown(obj.cars);
	return [];
}
function parseMoneyField(raw) {
	if (!raw || raw === "не заполнено" || raw === "—") return NaN;
	return parseMoney(raw.replace(/руб\.?/gi, ""));
}
function parseHoursField(raw) {
	const text = raw.trim();
	if (!text) return 0;
	const hours = text.match(/(\d+(?:[.,]\d+)?)\s*Ч/i);
	const mins = text.match(/(\d+)\s*мин/i);
	const h = hours ? Number(hours[1].replace(",", ".")) : 0;
	const m = mins ? Number(mins[1]) : 0;
	return (Number.isFinite(h) ? h : 0) + (Number.isFinite(m) ? m / 60 : 0);
}
function parsePlateField(raw) {
	const cleaned = raw.replace(/—/g, " ").trim();
	if (!cleaned) return {
		plate: "",
		region: ""
	};
	const parts = cleaned.split(/\s+/);
	if (parts.length >= 2) return {
		plate: parts[0] ?? "",
		region: parts[parts.length - 1] ?? ""
	};
	return {
		plate: cleaned,
		region: ""
	};
}
function parseLegacyText(text) {
	const cars = [];
	for (const line of text.split(/\r?\n/)) {
		if (!/^\s*\d+\.\s+/.test(line) || !line.includes("|")) continue;
		const chunks = line.split("|").map((part) => part.trim());
		const name = (chunks[0] ?? "").replace(/^\s*\d+\.\s+/, "").trim();
		if (!name) continue;
		const fields = {};
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
			createdAt: now
		});
		if (car) cars.push(car);
	}
	return cars;
}
function parseBackupText(text) {
	const trimmed = text.replace(/^\uFEFF/, "").trim();
	if (!trimmed) return [];
	const marker = trimmed.indexOf(BACKUP_MARKER);
	if (marker !== -1) {
		const jsonPart = trimmed.slice(marker + BACKUP_MARKER.length).trim();
		try {
			const cars = carsFromUnknown(JSON.parse(jsonPart));
			if (cars.length) return cars;
		} catch {}
	}
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) try {
		const cars = carsFromUnknown(JSON.parse(trimmed));
		if (cars.length) return cars;
	} catch {}
	return parseLegacyText(trimmed);
}
async function parseBackupFile(file) {
	return parseBackupText(await file.text());
}
function GarageHeader() {
	const count = useGarage((s) => s.cars.length);
	const search = useGarage((s) => s.search);
	const setSearch = useGarage((s) => s.setSearch);
	const openWizard = useGarage((s) => s.openWizard);
	const openReset = useGarage((s) => s.openReset);
	const cars = useGarage((s) => s.cars);
	const pushToast = useGarage((s) => s.pushToast);
	const requestImport = useGarage((s) => s.requestImport);
	const fileRef = (0, import_react.useRef)(null);
	const exportLog = () => {
		playClick();
		exportGarageLog(cars);
		pushToast(cars.length ? "Лог выгружен" : "В базе нет автомобилей");
	};
	const pickImport = () => {
		playClick();
		fileRef.current?.click();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "shrink-0 border-b border-line",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: ".txt,.json,.garazh,application/json,text/plain",
				className: "hidden",
				onChange: async (event) => {
					const file = event.target.files?.[0];
					event.target.value = "";
					if (!file) return;
					try {
						const imported = await parseBackupFile(file);
						requestImport(imported);
					} catch {
						pushToast("Не удалось прочитать файл", "error");
					}
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col gap-3 px-4 pt-3 pb-3 md:flex-row md:items-center md:gap-4 md:px-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 md:contents",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2 text-sm text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: ["Автомобилей: ", count]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-block size-2 rounded-full bg-primary-hi",
								title: "База онлайн"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-3 md:hidden",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg",
									onClick: pickImport,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarGlyph, { className: "size-3.5" }), "Загрузить авто"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg",
									onClick: exportLog,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }), "Выгрузить лог"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg",
									onClick: () => {
										playClick();
										openReset();
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Сброс"]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "relative hidden min-w-0 w-full sm:block md:w-56 md:shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field h-10 pl-9",
							placeholder: "Поиск",
							value: search,
							onChange: (event) => setSearch(event.target.value),
							"aria-label": "Поиск"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center md:pointer-events-none md:absolute md:inset-x-0 md:top-1/2 md:-translate-y-1/2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg md:pointer-events-auto",
							onClick: () => {
								playClick();
								openWizard();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "size-4 shrink-0",
								strokeWidth: 2.5
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Новое авто" })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 items-center gap-4 md:pointer-events-auto md:flex md:right-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg",
								onClick: pickImport,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarGlyph, { className: "size-3.5" }), "Загрузить авто"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg",
								onClick: exportLog,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }), "Выгрузить лог"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg",
								onClick: () => {
									playClick();
									openReset();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Сброс"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pb-3 sm:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "relative block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "field h-10 pl-9",
						placeholder: "Поиск",
						value: search,
						onChange: (event) => setSearch(event.target.value),
						"aria-label": "Поиск"
					})]
				})
			})
		]
	});
}
var BAR_COUNT = 14;
function hueFor(value) {
	return value <= .5 ? value * 2 * 42 : 42 + (value - .5) * 2 * 88;
}
function PaybackBars({ value }) {
	const t = Math.max(0, Math.min(1, value));
	const filled = t <= 0 ? 0 : t >= 1 ? BAR_COUNT : Math.max(1, Math.round(t * BAR_COUNT));
	const color = `hsl(${hueFor(t)} 82% 48%)`;
	const done = t >= 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-16 items-end justify-center gap-1",
			children: Array.from({ length: BAR_COUNT }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-14 w-2.5 transition-colors duration-500",
				style: { background: i < filled ? color : "var(--color-ghost)" }
			}, i))
		}), done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
				className: "size-12 text-primary-hi",
				strokeWidth: 3
			})
		}) : null]
	});
}
function CheckMark({ on }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex size-5 shrink-0 items-center justify-center border ${on ? "border-primary-hi" : "border-subtle"}`,
		"aria-hidden": "true",
		children: on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
			className: "size-3.5 text-primary-hi",
			strokeWidth: 3
		}) : null
	});
}
function TextAction({ children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "inline-flex min-h-8 items-center gap-1 text-xs text-muted hover:text-fg",
		onClick: () => {
			playClick();
			onClick();
		},
		children
	});
}
function Column({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-w-0 flex-1 flex-col md:max-w-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 text-xl font-semibold tracking-wide text-fg md:text-2xl",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-0 flex-1 flex-col bg-elevated p-4 md:p-5",
			children
		})]
	});
}
function StatRow({ label, value, checked, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-line py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "min-w-0 flex-1 text-xs text-muted",
					children: label
				}),
				action,
				checked == null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckMark, { on: checked })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm font-medium tabular-nums",
			children: value
		})]
	});
}
function ratingModel(car) {
	const t = paybackRatio(car);
	const n = paybackPercent(car) / 100;
	const rest = leftover(car);
	const expenseShare = car.price > 0 ? Math.min(1, car.expenses / Math.max(car.price, 1)) : 0;
	const trips = typeof car.trips === "number" ? Number(car.trips) : car.logs.length;
	const logCount = car.logs.length;
	const hours = car.hours;
	const excellent = Math.max(0, Math.min(1, t * .55 + n * .35 + (car.earnedTotal > 0 ? .1 : 0) - expenseShare * .25));
	const popular = Math.max(0, Math.min(1, Math.min(1, trips / 12) * .45 + Math.min(1, logCount / 5) * .35 + Math.min(1, hours / 80) * .2));
	const terrible = Math.max(0, Math.min(1, (1 - t) * .35 + expenseShare * .3 + (car.price > 0 ? Math.min(1, rest / car.price) * .25 : .2) + (car.earnedTotal <= 0 && trips === 0 ? .2 : 0)));
	const average = Math.max(0, Math.min(1, 1 - Math.abs(.45 - t) * 1.2 - Math.abs(.35 - popular) * .4));
	const ratings = [
		{
			key: "excellent",
			label: "Отличная",
			color: "#3cb85c",
			score: excellent
		},
		{
			key: "popular",
			label: "Популярная",
			color: "#2b82ea",
			score: popular
		},
		{
			key: "average",
			label: "Средняя",
			color: "#d4a017",
			score: average
		},
		{
			key: "terrible",
			label: "Ужасная",
			color: "#e04444",
			score: terrible
		}
	];
	return {
		ratings,
		active: ratings.reduce((a, b) => b.score > a.score ? b : a)
	};
}
function RatingChart({ car }) {
	const { ratings, active } = ratingModel(car);
	const byKey = Object.fromEntries(ratings.map((row) => [row.key, row]));
	const styleFor = (score, key) => {
		const lengthBoost = Math.round(score * 28);
		const on = key === active.key;
		return {
			length: 18 + lengthBoost,
			opacity: on ? 1 : .35 + score * .35,
			thickness: on ? 4 : 2,
			color: byKey[key]?.color ?? "#fff"
		};
	};
	const excellent = styleFor(byKey.excellent?.score ?? 0, "excellent");
	const popular = styleFor(byKey.popular?.score ?? 0, "popular");
	const average = styleFor(byKey.average?.score ?? 0, "average");
	const terrible = styleFor(byKey.terrible?.score ?? 0, "terrible");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex flex-1 flex-col items-center justify-center pt-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				style: {
					width: 148,
					height: 148
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						width: 148,
						height: 148,
						viewBox: "0 0 148 148",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: 67,
								y1: 67,
								x2: 67 - excellent.length * .72,
								y2: 67 - excellent.length * .72,
								stroke: excellent.color,
								strokeWidth: excellent.thickness,
								strokeLinecap: "square",
								opacity: excellent.opacity
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: 81,
								y1: 67,
								x2: 81 + popular.length * .72,
								y2: 67 - popular.length * .72,
								stroke: popular.color,
								strokeWidth: popular.thickness,
								strokeLinecap: "square",
								opacity: popular.opacity
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: 67,
								y1: 81,
								x2: 67 - average.length * .72,
								y2: 81 + average.length * .72,
								stroke: average.color,
								strokeWidth: average.thickness,
								strokeLinecap: "square",
								opacity: average.opacity
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: 81,
								y1: 81,
								x2: 81 + terrible.length * .72,
								y2: 81 + terrible.length * .72,
								stroke: terrible.color,
								strokeWidth: terrible.thickness,
								strokeLinecap: "square",
								opacity: terrible.opacity
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
								x: 67,
								y: 67,
								width: 14,
								height: 14,
								fill: active.color,
								stroke: active.color,
								strokeWidth: 2
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute top-0 left-0 text-[10px] font-medium",
						style: {
							color: byKey.excellent?.color,
							opacity: active.key === "excellent" ? 1 : .55
						},
						children: "Отличная"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute top-0 right-0 text-right text-[10px] font-medium",
						style: {
							color: byKey.popular?.color,
							opacity: active.key === "popular" ? 1 : .55
						},
						children: "Популярная"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute bottom-0 left-0 text-[10px] font-medium",
						style: {
							color: byKey.average?.color,
							opacity: active.key === "average" ? 1 : .55
						},
						children: "Средняя"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute right-0 bottom-0 text-right text-[10px] font-medium",
						style: {
							color: byKey.terrible?.color,
							opacity: active.key === "terrible" ? 1 : .55
						},
						children: "Ужасная"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-sm font-semibold",
				style: { color: active.color },
				children: active.label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 max-w-[14rem] text-center text-[11px] leading-snug text-subtle",
				children: [
					active.key === "excellent" && "Хорошо окупается — держать в парке.",
					active.key === "popular" && "Часто уходит в аренду — спрос высокий.",
					active.key === "average" && "Средние показатели — без явного перекоса.",
					active.key === "terrible" && "Слабая отдача — стоит подумать о продаже."
				]
			})
		]
	});
}
function InfoRow({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between gap-4 border-b border-line py-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-medium tabular-nums",
			children: value
		})]
	});
}
function DetailsOverlay({ car }) {
	const closeOverlay = useGarage((s) => s.closeOverlay);
	const refreshCar = useGarage((s) => s.refreshCar);
	const openOfficial = useGarage((s) => s.openOfficial);
	const openExpense = useGarage((s) => s.openExpense);
	const openEditEarn = useGarage((s) => s.openEditEarn);
	const openClearLog = useGarage((s) => s.openClearLog);
	const ratio = paybackRatio(car);
	const plate = formatPlate(car.plate, car.region);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "backdrop-enter fixed inset-0 z-40 overflow-hidden bg-overlay",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-full w-full max-w-[74rem] flex-col justify-center gap-[10px] px-3 py-6 md:flex-row md:items-stretch md:px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Column, {
					title: "Окупаемость",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-1 flex justify-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TextAction, {
								onClick: () => refreshCar(car.id),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Обновить"]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaybackBars, { value: ratio }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
							label: "Госстоимость",
							value: car.officialPrice == null ? "не заполнено" : money(car.officialPrice),
							checked: reached(car.earnedTotal, car.officialPrice),
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextAction, {
								onClick: openOfficial,
								children: car.officialPrice == null ? "Заполнить" : "Изменить"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
							label: "Цена",
							value: money(car.price),
							checked: reached(car.earnedTotal, car.price)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
							label: "Слив по свалке",
							value: money(car.scrapPrice),
							checked: reached(car.earnedTotal, car.scrapPrice)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 border-b border-line py-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "Разница"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-medium tabular-nums",
								children: money(leftover(car))
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "Проценты"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-medium tabular-nums",
								children: percent(paybackPercent(car))
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatRow, {
							label: "Расходы",
							value: money(car.expenses),
							action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TextAction, {
								onClick: openExpense,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3" }), "Добавить"]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RatingChart, { car })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Column, {
					title: "Информация",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-3 h-36 bg-surface",
							children: car.imageData ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: car.imageData,
								alt: "",
								className: "h-full w-full object-contain"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-full items-center justify-center text-sm text-subtle",
								children: "Нет фото"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-center text-base font-semibold",
							children: car.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
							className: "mt-3 space-y-1 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "Госномер",
									value: plate || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "Сегодня",
									value: money(car.earnedToday)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "За неделю",
									value: money(car.earnedWeek)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "За месяц",
									value: money(car.earnedMonth)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
									label: "Всего",
									value: money(car.earnedTotal)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TextAction, {
								onClick: openEditEarn,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Редактировать"]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-auto flex justify-center pt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
								onClick: () => {
									playClick();
									closeOverlay();
								},
								children: "Закрыть"
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Column, {
					title: "Лог за неделю",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TextAction, {
							onClick: openClearLog,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "Очистить"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "log-box min-h-0 flex-1 overflow-y-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[1.1fr_0.7fr_0.6fr_1fr] gap-x-2 border-b border-line px-2 py-1.5 text-[11px] text-subtle",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Дата" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Время" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Часы" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Цена" })
							]
						}), car.logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-2 py-6 text-center text-xs text-subtle",
							children: "Пока нет записей"
						}) : car.logs.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[1.1fr_0.7fr_0.6fr_1fr] gap-x-2 border-b border-line px-2 py-2 text-xs tabular-nums",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatDate(row.at) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTime(row.at) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hoursLabel(row.hours) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: money(row.amount) })
							]
						}, row.id))]
					})]
				})
			]
		})
	});
}
function Modal({ children, wide, layer }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `backdrop-enter fixed inset-0 flex items-center justify-center bg-overlay p-4 ${layer === "sub" ? "z-50" : "z-40"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `modal-enter w-full bg-elevated px-8 py-8 ${wide ? "max-w-md" : "max-w-sm"}`,
			role: "dialog",
			"aria-modal": "true",
			children
		})
	});
}
function ModalActions({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-8 flex flex-wrap items-center justify-center gap-4",
		children
	});
}
function RentOverlay() {
	const rentKind = useGarage((s) => s.rentKind);
	const rentStep = useGarage((s) => s.rentStep);
	const rentDuration = useGarage((s) => s.rentDuration);
	const rentAmount = useGarage((s) => s.rentAmount);
	const setRentKind = useGarage((s) => s.setRentKind);
	const setRentDuration = useGarage((s) => s.setRentDuration);
	const setRentAmount = useGarage((s) => s.setRentAmount);
	const rentNext = useGarage((s) => s.rentNext);
	const rentBack = useGarage((s) => s.rentBack);
	const closeOverlay = useGarage((s) => s.closeOverlay);
	if (rentStep === "pick") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: "Сдать в аренду"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-col gap-3 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "btn-fill btn-ghost h-24 flex-1 flex-col gap-2 px-4 text-sm",
					onClick: () => {
						playClick();
						setRentKind("hourly");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
						className: "size-7 text-fg",
						strokeWidth: 1.6
					}), "Почасовая"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "btn-fill btn-ghost h-24 flex-1 flex-col gap-2 px-4 text-sm",
					onClick: () => {
						playClick();
						setRentKind("daily");
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
						className: "size-7 text-fg",
						strokeWidth: 1.6
					}), "Посуточная"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModalActions, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					closeOverlay();
				},
				children: "Отмена"
			}) })
		]
	});
	if (rentStep === "duration") {
		const daily = rentKind === "daily";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: daily ? "На сколько суток ушла машина?" : "На сколько часов ушла машина?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto mt-6 w-full max-w-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					autoFocus: true,
					inputMode: "numeric",
					placeholder: daily ? "1" : "2",
					value: rentDuration,
					onChange: (event) => setRentDuration(event.target.value),
					onKeyDown: (event) => {
						if (event.key === "Enter") {
							playClick();
							rentNext();
						}
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-green h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					rentNext();
				},
				children: "Далее"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					rentBack();
				},
				children: "Назад"
			})] })
		] });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-center text-lg font-semibold",
			children: "За сколько ушла машина?"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-6 w-full max-w-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				autoFocus: true,
				inputMode: "decimal",
				placeholder: "0",
				value: rentAmount,
				onChange: (event) => setRentAmount(event.target.value),
				onKeyDown: (event) => {
					if (event.key === "Enter") {
						playClick();
						rentNext();
					}
				}
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-right text-xs text-subtle",
				children: "руб."
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "btn-fill btn-green h-11 min-w-32 px-6 text-sm",
			onClick: () => {
				playClick();
				rentNext();
			},
			children: "Далее"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
			onClick: () => {
				playClick();
				rentBack();
			},
			children: "Назад"
		})] })
	] });
}
function SubModals() {
	const subModal = useGarage((s) => s.subModal);
	const closeOverlay = useGarage((s) => s.closeOverlay);
	const draftOfficial = useGarage((s) => s.draftOfficial);
	const setDraftOfficial = useGarage((s) => s.setDraftOfficial);
	const saveOfficial = useGarage((s) => s.saveOfficial);
	const draftExpense = useGarage((s) => s.draftExpense);
	const setDraftExpense = useGarage((s) => s.setDraftExpense);
	const saveExpense = useGarage((s) => s.saveExpense);
	const draftEarnToday = useGarage((s) => s.draftEarnToday);
	const draftEarnWeek = useGarage((s) => s.draftEarnWeek);
	const draftEarnMonth = useGarage((s) => s.draftEarnMonth);
	const draftEarnTotal = useGarage((s) => s.draftEarnTotal);
	const setDraftEarnToday = useGarage((s) => s.setDraftEarnToday);
	const setDraftEarnWeek = useGarage((s) => s.setDraftEarnWeek);
	const setDraftEarnMonth = useGarage((s) => s.setDraftEarnMonth);
	const setDraftEarnTotal = useGarage((s) => s.setDraftEarnTotal);
	const saveEditEarn = useGarage((s) => s.saveEditEarn);
	const confirmClearLog = useGarage((s) => s.confirmClearLog);
	if (subModal === "official") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		layer: "sub",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: "Введите госстоимость"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-6 w-full max-w-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					autoFocus: true,
					inputMode: "decimal",
					placeholder: "0",
					value: draftOfficial,
					onChange: (event) => setDraftOfficial(event.target.value),
					onKeyDown: (event) => {
						if (event.key === "Enter") {
							playClick();
							saveOfficial();
						}
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-right text-xs text-subtle",
					children: "руб."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-green h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					saveOfficial();
				},
				children: "Далее"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					closeOverlay();
				},
				children: "Отмена"
			})] })
		]
	});
	if (subModal === "expense") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		layer: "sub",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: "Добавить расходы"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-6 w-full max-w-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					autoFocus: true,
					inputMode: "decimal",
					placeholder: "0",
					value: draftExpense,
					onChange: (event) => setDraftExpense(event.target.value),
					onKeyDown: (event) => {
						if (event.key === "Enter") {
							playClick();
							saveExpense();
						}
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-right text-xs text-subtle",
					children: "руб."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-green h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					saveExpense();
				},
				children: "Далее"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					closeOverlay();
				},
				children: "Отмена"
			})] })
		]
	});
	if (subModal === "edit-earn") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		layer: "sub",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: "Редактировать"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto mt-6 w-full max-w-xs space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs text-muted",
							children: "Сегодня"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							inputMode: "decimal",
							value: draftEarnToday,
							onChange: (event) => setDraftEarnToday(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs text-muted",
							children: "За неделю"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							inputMode: "decimal",
							value: draftEarnWeek,
							onChange: (event) => setDraftEarnWeek(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs text-muted",
							children: "За месяц"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							inputMode: "decimal",
							value: draftEarnMonth,
							onChange: (event) => setDraftEarnMonth(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1.5 block text-xs text-muted",
							children: "Всего"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							inputMode: "decimal",
							value: draftEarnTotal,
							onChange: (event) => setDraftEarnTotal(event.target.value)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-green h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					saveEditEarn();
				},
				children: "Далее"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
				onClick: () => {
					playClick();
					closeOverlay();
				},
				children: "Отмена"
			})] })
		]
	});
	if (subModal === "clear-log") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
		layer: "sub",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: "Очистить лог?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-sm leading-relaxed text-muted",
				children: "Вы уверены, что хотите очистить лог за неделю?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-red h-11 min-w-36 px-5 text-sm",
				onClick: () => {
					playClick();
					confirmClearLog();
				},
				children: "Очистить"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-5 text-sm",
				onClick: () => {
					playClick();
					closeOverlay();
				},
				children: "Отмена"
			})] })
		]
	});
	return null;
}
function GarageOverlays() {
	const overlay = useGarage((s) => s.overlay);
	const subModal = useGarage((s) => s.subModal);
	const wizardStep = useGarage((s) => s.wizardStep);
	const draftName = useGarage((s) => s.draftName);
	const draftPlate = useGarage((s) => s.draftPlate);
	const draftRegion = useGarage((s) => s.draftRegion);
	const draftImage = useGarage((s) => s.draftImage);
	const draftPrice = useGarage((s) => s.draftPrice);
	const draftScrap = useGarage((s) => s.draftScrap);
	const detailsId = useGarage((s) => s.detailsId);
	const deleteId = useGarage((s) => s.deleteId);
	const cars = useGarage((s) => s.cars);
	const pendingImport = useGarage((s) => s.pendingImport);
	const setDraftName = useGarage((s) => s.setDraftName);
	const setDraftPlate = useGarage((s) => s.setDraftPlate);
	const setDraftRegion = useGarage((s) => s.setDraftRegion);
	const setDraftImage = useGarage((s) => s.setDraftImage);
	const setDraftPrice = useGarage((s) => s.setDraftPrice);
	const setDraftScrap = useGarage((s) => s.setDraftScrap);
	const wizardNext = useGarage((s) => s.wizardNext);
	const wizardBack = useGarage((s) => s.wizardBack);
	const closeOverlay = useGarage((s) => s.closeOverlay);
	const confirmReset = useGarage((s) => s.confirmReset);
	const confirmDelete = useGarage((s) => s.confirmDelete);
	const confirmImport = useGarage((s) => s.confirmImport);
	const cancelImport = useGarage((s) => s.cancelImport);
	const pushToast = useGarage((s) => s.pushToast);
	const fileRef = (0, import_react.useRef)(null);
	const detailsCar = cars.find((car) => car.id === detailsId);
	const deleteCar = cars.find((car) => car.id === deleteId);
	(0, import_react.useEffect)(() => {
		if (overlay === "none" && subModal === "none") return;
		function onKey(event) {
			if (event.key === "Escape") {
				playClick();
				closeOverlay();
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		overlay,
		subModal,
		closeOverlay
	]);
	async function pickImage(file) {
		if (!file) return;
		try {
			const data = await readCarImage(file);
			setDraftImage(data);
			pushToast("Изображение выбрано", "info");
		} catch {
			pushToast("Не удалось прочитать файл", "error");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		overlay === "reset" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: "Сбросить весь учёт?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-center text-sm leading-relaxed text-muted",
				children: [
					"Все автомобили будут удалены безвозвратно.",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"База данных станет пустой."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-red h-11 min-w-36 px-5 text-sm",
				onClick: () => {
					playClick();
					confirmReset();
				},
				children: "Да, сбросить"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-5 text-sm",
				onClick: () => {
					playClick();
					closeOverlay();
				},
				children: "Отмена"
			})] })
		] }) : null,
		overlay === "import-confirm" && pendingImport ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
			wide: true,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-center text-lg font-semibold",
					children: "Загрузить автомобили?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-center text-sm leading-relaxed text-muted",
					children: [
						"Текущие карточки будут заменены данными из файла.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"Будет загружено автомобилей: ",
						pendingImport.length,
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-fill btn-green h-11 min-w-36 px-5 text-sm",
					onClick: () => {
						playClick();
						confirmImport();
					},
					children: "Загрузить"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-fill btn-ghost h-11 min-w-32 px-5 text-sm",
					onClick: () => {
						playClick();
						cancelImport();
					},
					children: "Отмена"
				})] })
			]
		}) : null,
		overlay === "delete" && deleteCar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-center text-lg font-semibold",
				children: "Удалить автомобиль?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-center text-sm leading-relaxed text-muted",
				children: [
					"«",
					deleteCar.name,
					"» будет удалён безвозвратно."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-red h-11 min-w-36 px-5 text-sm",
				onClick: () => {
					playClick();
					confirmDelete();
				},
				children: "Удалить"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-fill btn-ghost h-11 min-w-32 px-5 text-sm",
				onClick: () => {
					playClick();
					closeOverlay();
				},
				children: "Отмена"
			})] })
		] }) : null,
		overlay === "details" && detailsCar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailsOverlay, { car: detailsCar }) : null,
		overlay === "rent" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RentOverlay, {}) : null,
		subModal === "none" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubModals, {}),
		overlay === "wizard" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
			wide: true,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-3 text-center text-xs tracking-wide text-subtle tabular-nums",
					children: [
						"Шаг ",
						wizardStep,
						" из 4"
					]
				}),
				wizardStep === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-center text-lg font-semibold",
						children: "Введите название авто"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mt-6 w-full max-w-xs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							autoFocus: true,
							placeholder: "Например: Toyota Camry",
							value: draftName,
							onChange: (event) => setDraftName(event.target.value),
							onKeyDown: (event) => {
								if (event.key === "Enter") {
									playClick();
									wizardNext();
								}
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-green h-11 min-w-32 px-6 text-sm",
						onClick: () => {
							playClick();
							wizardNext();
						},
						children: "Далее"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
						onClick: () => {
							playClick();
							closeOverlay();
						},
						children: "Отмена"
					})] })
				] }) : null,
				wizardStep === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-center text-lg font-semibold",
						children: "Госномер"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto mt-6 flex w-full max-w-sm items-end justify-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1.5 block text-xs text-muted",
								children: "Номер"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field font-semibold tracking-[0.18em]",
								autoFocus: true,
								placeholder: "А123АА",
								value: draftPlate,
								maxLength: 6,
								onChange: (event) => setDraftPlate(sanitizePlate(event.target.value)),
								onKeyDown: (event) => {
									if (event.key === "Enter") {
										playClick();
										wizardNext();
									}
								},
								"aria-label": "Госномер"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block w-[4.75rem] shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1.5 block text-xs text-muted",
								children: "Регион"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field px-2 text-center font-semibold tabular-nums",
								inputMode: "numeric",
								placeholder: "777",
								value: draftRegion,
								maxLength: 3,
								onChange: (event) => setDraftRegion(sanitizeRegion(event.target.value)),
								onKeyDown: (event) => {
									if (event.key === "Enter") {
										playClick();
										wizardNext();
									}
								},
								"aria-label": "Регион"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-green h-11 min-w-28 px-5 text-sm",
						onClick: () => {
							playClick();
							wizardNext();
						},
						children: "Далее"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-ghost h-11 min-w-28 px-5 text-sm",
						onClick: () => {
							playClick();
							wizardBack();
						},
						children: "Назад"
					})] })
				] }) : null,
				wizardStep === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-center text-lg font-semibold",
						children: "Выберите изображение для авто"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-center text-xs text-muted",
						children: ["Текущее: ", draftImage ? "файл выбран" : "не выбрано"]
					}),
					draftImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mt-4 h-28 w-full max-w-xs overflow-hidden bg-surface",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: draftImage,
							alt: "",
							className: "h-full w-full object-contain"
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileRef,
							type: "file",
							accept: "image/png,image/jpeg,image/webp,image/bmp",
							className: "hidden",
							onChange: (event) => {
								const file = event.target.files?.[0];
								event.target.value = "";
								pickImage(file);
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-fill btn-ghost h-11 min-w-40 px-6 text-sm",
							onClick: () => {
								playClick();
								fileRef.current?.click();
							},
							children: "Открыть файл"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-green h-11 min-w-28 px-5 text-sm",
						onClick: () => {
							playClick();
							wizardNext();
						},
						children: "Далее"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-ghost h-11 min-w-28 px-5 text-sm",
						onClick: () => {
							playClick();
							wizardBack();
						},
						children: "Назад"
					})] })
				] }) : null,
				wizardStep === 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-center text-lg font-semibold",
						children: "Стоимость авто"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto mt-6 w-full max-w-xs space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1.5 block text-xs text-muted",
								children: "Цена"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								inputMode: "decimal",
								placeholder: "0",
								value: draftPrice,
								onChange: (event) => setDraftPrice(event.target.value)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mb-1.5 block text-xs text-muted",
								children: "Слив по свалке"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "field",
								inputMode: "decimal",
								placeholder: "0",
								value: draftScrap,
								onChange: (event) => setDraftScrap(event.target.value)
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalActions, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-green h-11 min-w-32 px-6 text-sm",
						onClick: () => {
							playClick();
							wizardNext();
						},
						children: "Готово"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-fill btn-ghost h-11 min-w-32 px-6 text-sm",
						onClick: () => {
							playClick();
							wizardBack();
						},
						children: "Назад"
					})] })
				] }) : null
			]
		}) : null
	] });
}
function GarageToasts() {
	const toasts = useGarage((s) => s.toasts);
	if (toasts.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed right-4 bottom-4 z-50 flex w-max max-w-xs flex-col-reverse gap-2",
		children: toasts.map((toast) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `pointer-events-auto px-6 py-4 text-center text-sm text-fg ${toast.kind === "error" ? "bg-toast-err" : "bg-toast"}`,
			children: toast.text
		}, toast.id))
	});
}
var SPLASH_MS = 2400;
var SPLASH_SWAP_MS = 1200;
function SplashScreen({ onDone }) {
	const bootCheck = useGarage((s) => s.bootCheck);
	const [phase, setPhase] = (0, import_react.useState)("load");
	(0, import_react.useEffect)(() => {
		const finish = () => bootCheck();
		const unsub = useGarage.persist.onFinishHydration(finish);
		if (useGarage.persist.hasHydrated()) finish();
		const swap = window.setInterval(() => {
			setPhase((current) => current === "load" ? "venom" : "load");
		}, SPLASH_SWAP_MS);
		const done = window.setTimeout(() => onDone(), SPLASH_MS);
		return () => {
			unsub();
			window.clearInterval(swap);
			window.clearTimeout(done);
		};
	}, [bootCheck, onDone]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col items-center justify-center bg-bg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "splash-ring",
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mt-8 h-8 w-72",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `splash-copy absolute inset-0 text-center text-sm tracking-[0.28em] text-fg ${phase === "load" ? "splash-in" : "splash-out"}`,
				children: "Загрузка"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `splash-copy absolute inset-0 text-center text-sm tracking-[0.22em] text-fg ${phase === "venom" ? "splash-in" : "splash-out"}`,
				children: "Powered by Venom"
			})]
		})]
	});
}
function GarageShell() {
	const cars = useGarage((s) => s.cars);
	const search = useGarage((s) => s.search);
	const openWizard = useGarage((s) => s.openWizard);
	const visible = filterCars(cars, search);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GarageHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex min-h-0 flex-1 flex-col px-3 pt-4 pb-28 md:px-5 md:pt-4",
				children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-1 flex-col items-center justify-center px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, {
							className: "mb-4 size-10 text-subtle",
							strokeWidth: 1.5
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-sm text-center text-sm leading-relaxed text-muted",
							children: search.trim() ? "Ничего не найдено." : "Пока нет автомобилей. Нажмите «Новое авто», чтобы добавить."
						}),
						search.trim() ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-fill btn-green mt-6 h-11 min-w-48 px-6 text-sm",
							onClick: () => {
								playClick();
								openWizard();
							},
							children: "Новое авто"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex w-full max-w-[74rem] flex-wrap justify-center gap-x-4 gap-y-5",
					children: visible.map((car) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarCard, { car }, car.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GarageOverlays, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GarageToasts, {})
		]
	});
}
function GarageApp() {
	const [ready, setReady] = (0, import_react.useState)(false);
	const onDone = (0, import_react.useCallback)(() => setReady(true), []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SplashScreen, { onDone });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GarageShell, {});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GarageApp, {});
}
//#endregion
export { Home as component };
