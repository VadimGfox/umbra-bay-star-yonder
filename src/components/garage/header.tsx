import { useRef } from "react";
import { Plus, RotateCcw, Search, Upload } from "lucide-react";
import { CarGlyph } from "@/components/garage/icons";
import { DarkRentLogo } from "@/components/garage/logo";
import { exportGarageLog, parseBackupFile } from "@/lib/garage/backup";
import { useGarage } from "@/lib/garage/store";
import { playClick } from "@/lib/garage/utils";

export function GarageHeader() {
  const count = useGarage((s) => s.cars.length);
  const search = useGarage((s) => s.search);
  const setSearch = useGarage((s) => s.setSearch);
  const openWizard = useGarage((s) => s.openWizard);
  const openReset = useGarage((s) => s.openReset);
  const cars = useGarage((s) => s.cars);
  const pushToast = useGarage((s) => s.pushToast);
  const requestImport = useGarage((s) => s.requestImport);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportLog = () => {
    playClick();
    if (!cars.length) {
      pushToast("В базе нет автомобилей");
      return;
    }
    exportGarageLog(cars);
    pushToast("Лог выгружен");
  };

  const pickImport = () => {
    playClick();
    fileRef.current?.click();
  };

  return (
    <header className="garage-header relative z-10 shrink-0">
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.json,.garazh,application/json,text/plain"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            const imported = await parseBackupFile(file);
            requestImport(imported);
          } catch {
            pushToast("Не удалось прочитать файл", "error");
          }
        }}
      />
      <div className="relative flex flex-col gap-3 px-4 pt-3 pb-3 md:flex-row md:items-center md:gap-4 md:px-5">
        <div className="flex items-center justify-between gap-3 md:contents">
          <div className="flex shrink-0 items-center gap-4">
            <DarkRentLogo size="sm" />
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="tabular-nums">Автомобилей: {count}</span>
              <span className="inline-block size-2 rounded-full bg-primary-hi" title="База онлайн" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 md:hidden">
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
              onClick={pickImport}
            >
              <CarGlyph className="size-3.5" />
              Загрузить авто
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
              onClick={exportLog}
            >
              <Upload className="size-3.5" />
              Выгрузить лог
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
              onClick={() => {
                playClick();
                openReset();
              }}
            >
              <RotateCcw className="size-3.5" />
              Сброс
            </button>
          </div>
        </div>
        <label className="relative hidden min-w-0 w-full sm:block md:ml-2 md:w-52 md:shrink-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <input
            className="field h-10 pl-9"
            placeholder="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Поиск"
          />
        </label>
        <div className="flex justify-center md:pointer-events-none md:absolute md:inset-x-0 md:top-1/2 md:-translate-y-1/2">
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg md:pointer-events-auto"
            onClick={() => {
              playClick();
              openWizard();
            }}
          >
            <Plus className="size-4 shrink-0" strokeWidth={2.5} />
            <span>Новое авто</span>
          </button>
        </div>
        <div className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 items-center gap-4 md:pointer-events-auto md:flex md:right-5">
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
            onClick={pickImport}
          >
            <CarGlyph className="size-3.5" />
            Загрузить авто
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
            onClick={exportLog}
          >
            <Upload className="size-3.5" />
            Выгрузить лог
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
            onClick={() => {
              playClick();
              openReset();
            }}
          >
            <RotateCcw className="size-3.5" />
            Сброс
          </button>
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <label className="relative block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <input
            className="field h-10 pl-9"
            placeholder="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Поиск"
          />
        </label>
      </div>
      <div className="header-pulse-line" aria-hidden="true" />
    </header>
  );
}
