import { Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Car } from "@/lib/garage/types";
import { useGarage } from "@/lib/garage/store";
import {
  formatDate,
  formatPlate,
  formatTime,
  hoursLabel,
  leftover,
  money,
  paybackPercent,
  paybackRatio,
  percent,
  playClick,
  reached,
} from "@/lib/garage/utils";

const BAR_COUNT = 14;

function hueFor(value: number) {
  return value <= 0.5 ? value * 2 * 42 : 42 + (value - 0.5) * 2 * 88;
}

function PaybackBars({ value }: { value: number }) {
  const t = Math.max(0, Math.min(1, value));
  const filled = t <= 0 ? 0 : t >= 1 ? BAR_COUNT : Math.max(1, Math.round(t * BAR_COUNT));
  const color = `hsl(${hueFor(t)} 82% 48%)`;
  const done = t >= 1;
  return (
    <div className="relative py-2">
      <div className="flex h-16 items-end justify-center gap-1">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            className="h-14 w-2.5 transition-colors duration-500"
            style={{ background: i < filled ? color : "var(--color-ghost)" }}
          />
        ))}
      </div>
      {done ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check className="size-12 text-primary-hi" strokeWidth={3} />
        </div>
      ) : null}
    </div>
  );
}

function CheckMark({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex size-5 shrink-0 items-center justify-center border ${
        on ? "border-primary-hi" : "border-subtle"
      }`}
      aria-hidden="true"
    >
      {on ? <Check className="size-3.5 text-primary-hi" strokeWidth={3} /> : null}
    </span>
  );
}

function TextAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-8 items-center gap-1 text-xs text-muted hover:text-fg"
      onClick={() => {
        playClick();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col md:max-w-sm">
      <h2 className="mb-2 text-xl font-semibold tracking-wide text-fg md:text-2xl">{title}</h2>
      <div className="flex min-h-0 flex-1 flex-col bg-elevated p-4 md:p-5">{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  checked,
  action,
}: {
  label: string;
  value: string;
  checked?: boolean | null;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-line py-2.5">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-xs text-muted">{label}</span>
        {action}
        {checked == null ? null : <CheckMark on={checked} />}
      </div>
      <p className="mt-1 text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

function ratingModel(car: Car) {
  const t = paybackRatio(car);
  const n = paybackPercent(car) / 100;
  const rest = leftover(car);
  const expenseShare = car.price > 0 ? Math.min(1, car.expenses / Math.max(car.price, 1)) : 0;
  const trips = typeof car.trips === "number" ? Number(car.trips) : car.logs.length;
  const logCount = car.logs.length;
  const hours = car.hours;
  const excellent = Math.max(
    0,
    Math.min(1, t * 0.55 + n * 0.35 + (car.earnedTotal > 0 ? 0.1 : 0) - expenseShare * 0.25),
  );
  const popular = Math.max(
    0,
    Math.min(1, Math.min(1, trips / 12) * 0.45 + Math.min(1, logCount / 5) * 0.35 + Math.min(1, hours / 80) * 0.2),
  );
  const terrible = Math.max(
    0,
    Math.min(
      1,
      (1 - t) * 0.35 +
        expenseShare * 0.3 +
        (car.price > 0 ? Math.min(1, rest / car.price) * 0.25 : 0.2) +
        (car.earnedTotal <= 0 && trips === 0 ? 0.2 : 0),
    ),
  );
  const average = Math.max(0, Math.min(1, 1 - Math.abs(0.45 - t) * 1.2 - Math.abs(0.35 - popular) * 0.4));
  const ratings = [
    { key: "excellent", label: "Отличная", color: "#3cb85c", score: excellent },
    { key: "popular", label: "Популярная", color: "#2b82ea", score: popular },
    { key: "average", label: "Средняя", color: "#d4a017", score: average },
    { key: "terrible", label: "Ужасная", color: "#e04444", score: terrible },
  ];
  return { ratings, active: ratings.reduce((a, b) => (b.score > a.score ? b : a)) };
}

function RatingChart({ car }: { car: Car }) {
  const { ratings, active } = ratingModel(car);
  const byKey = Object.fromEntries(ratings.map((row) => [row.key, row]));
  const styleFor = (score: number, key: string) => {
    const lengthBoost = Math.round(score * 28);
    const on = key === active.key;
    return {
      length: 18 + lengthBoost,
      opacity: on ? 1 : 0.35 + score * 0.35,
      thickness: on ? 4 : 2,
      color: byKey[key]?.color ?? "#fff",
    };
  };
  const excellent = styleFor(byKey.excellent?.score ?? 0, "excellent");
  const popular = styleFor(byKey.popular?.score ?? 0, "popular");
  const average = styleFor(byKey.average?.score ?? 0, "average");
  const terrible = styleFor(byKey.terrible?.score ?? 0, "terrible");
  return (
    <div className="mt-4 flex flex-1 flex-col items-center justify-center pt-2">
      <div className="relative" style={{ width: 148, height: 148 }}>
        <svg width={148} height={148} viewBox="0 0 148 148" aria-hidden="true">
          <line
            x1={67}
            y1={67}
            x2={67 - excellent.length * 0.72}
            y2={67 - excellent.length * 0.72}
            stroke={excellent.color}
            strokeWidth={excellent.thickness}
            strokeLinecap="square"
            opacity={excellent.opacity}
          />
          <line
            x1={81}
            y1={67}
            x2={81 + popular.length * 0.72}
            y2={67 - popular.length * 0.72}
            stroke={popular.color}
            strokeWidth={popular.thickness}
            strokeLinecap="square"
            opacity={popular.opacity}
          />
          <line
            x1={67}
            y1={81}
            x2={67 - average.length * 0.72}
            y2={81 + average.length * 0.72}
            stroke={average.color}
            strokeWidth={average.thickness}
            strokeLinecap="square"
            opacity={average.opacity}
          />
          <line
            x1={81}
            y1={81}
            x2={81 + terrible.length * 0.72}
            y2={81 + terrible.length * 0.72}
            stroke={terrible.color}
            strokeWidth={terrible.thickness}
            strokeLinecap="square"
            opacity={terrible.opacity}
          />
          <rect x={67} y={67} width={14} height={14} fill={active.color} stroke={active.color} strokeWidth={2} />
        </svg>
        <span
          className="pointer-events-none absolute top-0 left-0 text-[10px] font-medium"
          style={{ color: byKey.excellent?.color, opacity: active.key === "excellent" ? 1 : 0.55 }}
        >
          Отличная
        </span>
        <span
          className="pointer-events-none absolute top-0 right-0 text-right text-[10px] font-medium"
          style={{ color: byKey.popular?.color, opacity: active.key === "popular" ? 1 : 0.55 }}
        >
          Популярная
        </span>
        <span
          className="pointer-events-none absolute bottom-0 left-0 text-[10px] font-medium"
          style={{ color: byKey.average?.color, opacity: active.key === "average" ? 1 : 0.55 }}
        >
          Средняя
        </span>
        <span
          className="pointer-events-none absolute right-0 bottom-0 text-right text-[10px] font-medium"
          style={{ color: byKey.terrible?.color, opacity: active.key === "terrible" ? 1 : 0.55 }}
        >
          Ужасная
        </span>
      </div>
      <p className="mt-3 text-center text-sm font-semibold" style={{ color: active.color }}>
        {active.label}
      </p>
      <p className="mt-1 max-w-[14rem] text-center text-[11px] leading-snug text-subtle">
        {active.key === "excellent" && "Хорошо окупается — держать в парке."}
        {active.key === "popular" && "Часто уходит в аренду — спрос высокий."}
        {active.key === "average" && "Средние показатели — без явного перекоса."}
        {active.key === "terrible" && "Слабая отдача — стоит подумать о продаже."}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export function DetailsOverlay({ car }: { car: Car }) {
  const closeOverlay = useGarage((s) => s.closeOverlay);
  const refreshCar = useGarage((s) => s.refreshCar);
  const openOfficial = useGarage((s) => s.openOfficial);
  const openExpense = useGarage((s) => s.openExpense);
  const openEditEarn = useGarage((s) => s.openEditEarn);
  const openClearLog = useGarage((s) => s.openClearLog);
  const ratio = paybackRatio(car);
  const plate = formatPlate(car.plate, car.region);

  return (
    <div className="backdrop-enter fixed inset-0 z-40 overflow-hidden bg-overlay">
      <div className="mx-auto flex h-full w-full max-w-[74rem] flex-col justify-center gap-[10px] px-3 py-6 md:flex-row md:items-stretch md:px-4">
        <Column title="Окупаемость">
          <div className="mb-1 flex justify-end">
            <TextAction onClick={() => refreshCar(car.id)}>
              <RotateCcw className="size-3.5" />
              Обновить
            </TextAction>
          </div>
          <PaybackBars value={ratio} />
          <StatRow
            label="Госстоимость"
            value={car.officialPrice == null ? "не заполнено" : money(car.officialPrice)}
            checked={reached(car.earnedTotal, car.officialPrice)}
            action={
              <TextAction onClick={openOfficial}>
                {car.officialPrice == null ? "Заполнить" : "Изменить"}
              </TextAction>
            }
          />
          <StatRow label="Цена" value={money(car.price)} checked={reached(car.earnedTotal, car.price)} />
          <StatRow
            label="Слив по свалке"
            value={money(car.scrapPrice)}
            checked={reached(car.earnedTotal, car.scrapPrice)}
          />
          <div className="grid grid-cols-2 gap-3 border-b border-line py-2.5">
            <div>
              <p className="text-xs text-muted">Разница</p>
              <p className="mt-1 text-sm font-medium tabular-nums">{money(leftover(car))}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Проценты</p>
              <p className="mt-1 text-sm font-medium tabular-nums">{percent(paybackPercent(car))}</p>
            </div>
          </div>
          <StatRow
            label="Расходы"
            value={money(car.expenses)}
            action={
              <TextAction onClick={openExpense}>
                <Plus className="size-3" />
                Добавить
              </TextAction>
            }
          />
          <RatingChart car={car} />
        </Column>
        <Column title="Информация">
          <div className="mb-3 h-36 bg-surface">
            {car.imageData ? (
              <img src={car.imageData} alt="" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-subtle">Нет фото</div>
            )}
          </div>
          <h3 className="text-center text-base font-semibold">{car.name}</h3>
          <dl className="mt-3 space-y-1 text-sm">
            <InfoRow label="Госномер" value={plate || "—"} />
            <InfoRow label="Сегодня" value={money(car.earnedToday)} />
            <InfoRow label="За неделю" value={money(car.earnedWeek)} />
            <InfoRow label="За месяц" value={money(car.earnedMonth)} />
            <InfoRow label="Всего" value={money(car.earnedTotal)} />
          </dl>
          <div className="mt-4 flex justify-center">
            <TextAction onClick={openEditEarn}>
              <Pencil className="size-3.5" />
              Редактировать
            </TextAction>
          </div>
          <div className="mt-auto flex justify-center pt-6">
            <button
              type="button"
              className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
              onClick={() => {
                playClick();
                closeOverlay();
              }}
            >
              Закрыть
            </button>
          </div>
        </Column>
        <Column title="Лог за неделю">
          <div className="mb-2 flex justify-end">
            <TextAction onClick={openClearLog}>
              <Trash2 className="size-3.5" />
              Очистить
            </TextAction>
          </div>
          <div className="log-box min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-[1.1fr_0.7fr_0.6fr_1fr] gap-x-2 border-b border-line px-2 py-1.5 text-[11px] text-subtle">
              <span>Дата</span>
              <span>Время</span>
              <span>Часы</span>
              <span>Цена</span>
            </div>
            {car.logs.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-subtle">Пока нет записей</p>
            ) : (
              car.logs.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.1fr_0.7fr_0.6fr_1fr] gap-x-2 border-b border-line px-2 py-2 text-xs tabular-nums"
                >
                  <span>{formatDate(row.at)}</span>
                  <span>{formatTime(row.at)}</span>
                  <span>{hoursLabel(row.hours)}</span>
                  <span>{money(row.amount)}</span>
                </div>
              ))
            )}
          </div>
        </Column>
      </div>
    </div>
  );
}
