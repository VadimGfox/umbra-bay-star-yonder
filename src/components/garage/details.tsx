import { useRef, type ReactNode } from "react";
import { Camera, Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { MedianPanel } from "@/components/garage/median";
import { RussianPlate } from "@/components/garage/plate";
import { albumPut } from "@/lib/garage/album";
import type { Car } from "@/lib/garage/types";
import { useGarage } from "@/lib/garage/store";
import {
  daysOwned,
  daysWord,
  formatDate,
  formatTime,
  hoursLabel,
  leftover,
  money,
  paybackPercent,
  percent,
  playClick,
  reached,
  readCarImage,
  surplus,
} from "@/lib/garage/utils";

function hueFor(value: number) {
  return value <= 0.5 ? value * 2 * 42 : 42 + (value - 0.5) * 2 * 88;
}

function PaybackBar({ value }: { value: number }) {
  const t = Math.max(0, Math.min(1, value));
  const color = `hsl(${hueFor(t)} 82% 52%)`;
  return (
    <div className="py-3">
      <div className="payback-track" aria-hidden="true">
        <div className="payback-fill" style={{ width: `${Math.max(t > 0 ? 2 : 0, t * 100)}%`, background: color }} />
      </div>
      <p className="mt-2 text-center text-xs tabular-nums text-muted">{percent(t * 100)}</p>
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

function SignStack({ label, onPlus, onMinus }: { label: string; onPlus: () => void; onMinus: () => void }) {
  return (
    <div className="absolute top-2 right-0 flex flex-col gap-1">
      <button
        type="button"
        className="sign-btn"
        aria-label={`Добавить ${label}`}
        onClick={() => {
          playClick();
          onPlus();
        }}
      >
        +
      </button>
      <button
        type="button"
        className="sign-btn"
        aria-label={`Убавить ${label}`}
        onClick={() => {
          playClick();
          onMinus();
        }}
      >
        −
      </button>
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

function InfoRow({ label, value, action }: { label: string; value: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="flex items-center gap-2 font-medium tabular-nums">
        {value}
        {action}
      </dd>
    </div>
  );
}

function WideButton({
  children,
  onClick,
  tone = "ghost",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "ghost" | "quiet";
}) {
  return (
    <button
      type="button"
      className={`btn-fill h-11 w-full text-sm tracking-[0.14em] ${tone === "quiet" ? "btn-quiet" : "btn-ghost"}`}
      onClick={() => {
        playClick();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

export function DetailsOverlay({ car }: { car: Car }) {
  const closeOverlay = useGarage((s) => s.closeOverlay);
  const refreshCar = useGarage((s) => s.refreshCar);
  const openOfficial = useGarage((s) => s.openOfficial);
  const openExpense = useGarage((s) => s.openExpense);
  const openExpenseSub = useGarage((s) => s.openExpenseSub);
  const openRepair = useGarage((s) => s.openRepair);
  const openRepairSub = useGarage((s) => s.openRepairSub);
  const openTariff = useGarage((s) => s.openTariff);
  const openPlate = useGarage((s) => s.openPlate);
  const openMarket = useGarage((s) => s.openMarket);
  const openSell = useGarage((s) => s.openSell);
  const openEditEarn = useGarage((s) => s.openEditEarn);
  const openClearLog = useGarage((s) => s.openClearLog);
  const openRename = useGarage((s) => s.openRename);
  const openOwnedDays = useGarage((s) => s.openOwnedDays);
  const openUndoRent = useGarage((s) => s.openUndoRent);
  const setCarImage = useGarage((s) => s.setCarImage);
  const logRange = useGarage((s) => s.logRange);
  const setLogRange = useGarage((s) => s.setLogRange);
  const pushToast = useGarage((s) => s.pushToast);
  const fileRef = useRef<HTMLInputElement>(null);
  const ratio = paybackPercent(car) / 100;
  const owned = daysOwned(car);
  const extra = surplus(car);
  const activeLogs = logRange === "month" ? (car.monthLogs ?? []) : car.logs;

  return (
    <div className="backdrop-enter backdrop-blurred fixed inset-0 z-40 overflow-hidden">
      <div className="modal-enter mx-auto flex h-full w-full max-w-[74rem] flex-col px-3 py-5 md:px-4">
        <div className="details-board min-h-0 flex-1">
          <section className="details-col">
          <div className="mb-1 flex justify-end">
            <TextAction onClick={() => refreshCar(car.id)}>
              <RotateCcw className="size-3.5" />
              Обновить
            </TextAction>
          </div>
          <PaybackBar value={ratio} />
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
              <p className={`mt-1 text-sm font-medium tabular-nums ${extra > 0 ? "text-primary-hi" : ""}`}>
                {extra > 0 ? `+ ${money(extra)}` : money(leftover(car))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Проценты</p>
              <p className="mt-1 text-sm font-medium tabular-nums">{percent(paybackPercent(car))}</p>
            </div>
          </div>
          <div className="relative border-b border-line py-2.5 pr-12">
            <SignStack label="расход" onPlus={openExpense} onMinus={openExpenseSub} />
            <p className="text-xs text-muted">Расходы</p>
            <p className="mt-1 text-sm font-medium tabular-nums">{money(car.expenses)}</p>
          </div>
          <div className="relative border-b border-line py-2.5 pr-12">
            <SignStack label="ремонт" onPlus={openRepair} onMinus={openRepairSub} />
            <p className="text-xs text-muted">Ремонт</p>
            <p className="mt-1 text-sm font-medium tabular-nums">{money(car.repairs || 0)}</p>
          </div>
          <MedianPanel car={car} />
          </section>
          <div className="pulse-rule" aria-hidden="true" />
          <section className="details-col">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                const data = await readCarImage(file);
                setCarImage(car.id, data);
                void albumPut(car.name, data);
              } catch {
                pushToast("Не удалось прочитать файл", "error");
              }
            }}
          />
          <div className="mb-3 h-36 bg-surface">
            {car.imageData ? (
              <img src={car.imageData} alt="" className="h-full w-full object-contain" />
            ) : (
              <button
                type="button"
                className="flex h-full w-full flex-col items-center justify-center gap-2"
                onClick={() => {
                  playClick();
                  fileRef.current?.click();
                }}
              >
                <Camera className="size-10 text-fg opacity-[0.14]" strokeWidth={1.25} />
                <span className="text-xs tracking-wide text-fg opacity-25">Добавить изображение</span>
              </button>
            )}
          </div>
          <div className="flex items-baseline justify-center gap-2">
            <h3 className="text-center text-base font-semibold">{car.name}</h3>
            <TextAction onClick={openRename}>Изменить</TextAction>
          </div>
          <div className="plate-well mt-3">
            <RussianPlate plate={car.plate} region={car.region} />
          </div>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              className="text-xs text-muted hover:text-fg"
              onClick={() => {
                playClick();
                openPlate();
              }}
            >
              Изменить
            </button>
          </div>
          <dl className="mt-3 space-y-1 text-sm">
            <InfoRow
              label="Во владении"
              value={`${owned} ${daysWord(owned)}`}
              action={<TextAction onClick={openOwnedDays}>Изменить</TextAction>}
            />
            <div className="flex items-center justify-between gap-3 border-b border-line py-2">
              <dt className="text-muted">Тариф</dt>
              <dd>
                <button
                  type="button"
                  className="btn-fill btn-ghost h-8 min-w-28 px-3 text-xs"
                  onClick={() => {
                    playClick();
                    openTariff();
                  }}
                >
                  Подробнее
                </button>
              </dd>
            </div>
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
          <div className="mt-auto flex flex-col gap-2.5 pt-6">
            <WideButton onClick={openUndoRent}>Отменить последнюю аренду</WideButton>
            <WideButton onClick={openMarket}>Рынок авто</WideButton>
            <WideButton onClick={openSell}>Продать авто</WideButton>
            <WideButton onClick={closeOverlay}>Закрыть</WideButton>
          </div>
          </section>
          <div className="pulse-rule" aria-hidden="true" />
          <section className="details-col">
          <div className="mb-2 flex items-center gap-3">
            <button
              type="button"
              className={`text-xs tracking-wide ${logRange === "week" ? "text-fg" : "text-subtle hover:text-muted"}`}
              onClick={() => {
                playClick();
                setLogRange("week");
              }}
            >
              Неделя
            </button>
            <button
              type="button"
              className={`text-xs tracking-wide ${logRange === "month" ? "text-fg" : "text-subtle hover:text-muted"}`}
              onClick={() => {
                playClick();
                setLogRange("month");
              }}
            >
              Месяц
            </button>
            <span className="ml-auto">
              <TextAction onClick={openClearLog}>
                <Trash2 className="size-3.5" />
                Очистить
              </TextAction>
            </span>
          </div>
          <div className="log-box min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-[1.1fr_0.7fr_0.6fr_1fr] gap-x-2 border-b border-line px-2 py-1.5 text-[11px] text-subtle">
              <span>Дата</span>
              <span>Время</span>
              <span>Часы</span>
              <span>Цена</span>
            </div>
            {activeLogs.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-subtle">Пока нет записей</p>
            ) : (
              activeLogs.map((row) => (
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
          </section>
        </div>
      </div>
    </div>
  );
}
