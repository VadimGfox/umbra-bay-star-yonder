import { useEffect, type ReactNode } from "react";
import { Clock } from "lucide-react";
import { ApiPanel } from "@/components/garage/api-panel";
import { DetailsOverlay } from "@/components/garage/details";
import { MarketPanel } from "@/components/garage/market-panel";
import { WizardModal } from "@/components/garage/wizard-modal";
import { useGarage } from "@/lib/garage/store";
import { money, playClick, sanitizePlate, sanitizeRegion } from "@/lib/garage/utils";

function Modal({
  children,
  wide,
  roomy,
  layer,
  blur,
}: {
  children: ReactNode;
  wide?: boolean;
  roomy?: boolean;
  layer?: "sub" | "main";
  blur?: boolean;
}) {
  const width = roomy ? "max-w-xl" : wide ? "max-w-md" : "max-w-sm";
  return (
    <div
      className={`backdrop-enter fixed inset-0 flex items-center justify-center p-4 ${
        layer === "sub" ? "z-50" : "z-40"
      } ${blur ? "backdrop-blurred" : "backdrop-plain"}`}
    >
      <div className={`modal-enter w-full bg-elevated px-8 py-8 ${width}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

function ModalActions({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex flex-wrap items-center justify-center gap-4">{children}</div>;
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

  if (rentStep === "pick") {
    return (
      <Modal wide blur>
        <h2 className="text-center text-lg font-semibold">Сдать в аренду</h2>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-fill btn-ghost h-24 flex-1 flex-col gap-2 px-4 text-sm"
            onClick={() => {
              playClick();
              setRentKind("hourly");
            }}
          >
            <Clock className="size-7 text-fg" strokeWidth={1.6} />
            Почасовая
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-24 flex-1 flex-col gap-2 px-4 text-sm"
            onClick={() => {
              playClick();
              setRentKind("daily");
            }}
          >
            <Clock className="size-7 text-fg" strokeWidth={1.6} />
            Посуточная
          </button>
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (rentStep === "duration") {
    const daily = rentKind === "daily";
    const count = daily ? 7 : 24;
    const pick = useGarage.getState().pickRentDuration;
    return (
      <Modal roomy blur>
        <h2 className="text-center text-lg font-semibold">
          {daily ? "На сколько суток ушла машина?" : "На сколько часов ушла машина?"}
        </h2>
        <div className={`mx-auto mt-6 grid w-full gap-1.5 ${daily ? "max-w-md grid-cols-7" : "grid-cols-6"}`}>
          {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`btn-fill h-9 text-xs ${rentDuration === String(n) ? "btn-green" : "btn-ghost"}`}
              onClick={() => {
                playClick();
                pick(n);
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              rentBack();
            }}
          >
            Назад
          </button>
        </ModalActions>
      </Modal>
    );
  }

  return (
    <Modal blur>
      <h2 className="text-center text-lg font-semibold">За сколько ушла машина?</h2>
      <div className="mx-auto mt-6 w-full max-w-xs">
        <div className="relative">
          <input
            className="field pr-28"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={rentAmount}
            onChange={(event) => setRentAmount(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                playClick();
                rentNext();
              }
            }}
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted hover:text-fg"
            onClick={() => {
              playClick();
              useGarage.getState().fillRentFromTariff();
            }}
          >
            По тарифу
          </button>
        </div>
        <p className="mt-2 text-right text-xs text-subtle">руб.</p>
      </div>
      <ModalActions>
        <button
          type="button"
          className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
          onClick={() => {
            playClick();
            rentNext();
          }}
        >
          Далее
        </button>
        <button
          type="button"
          className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
          onClick={() => {
            playClick();
            rentBack();
          }}
        >
          Назад
        </button>
      </ModalActions>
    </Modal>
  );
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
  const expenseSign = useGarage((s) => s.expenseSign);
  const expenseTarget = useGarage((s) => s.expenseTarget);
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
  const logRange = useGarage((s) => s.logRange);
  const draftCarName = useGarage((s) => s.draftCarName);
  const setDraftCarName = useGarage((s) => s.setDraftCarName);
  const saveRename = useGarage((s) => s.saveRename);
  const draftOwnedDays = useGarage((s) => s.draftOwnedDays);
  const setDraftOwnedDays = useGarage((s) => s.setDraftOwnedDays);
  const saveOwnedDays = useGarage((s) => s.saveOwnedDays);
  const confirmUndoRent = useGarage((s) => s.confirmUndoRent);
  const savePlate = useGarage((s) => s.savePlate);
  const draftPlate = useGarage((s) => s.draftPlate);
  const draftRegion = useGarage((s) => s.draftRegion);
  const setDraftPlate = useGarage((s) => s.setDraftPlate);
  const setDraftRegion = useGarage((s) => s.setDraftRegion);
  const openTariffEdit = useGarage((s) => s.openTariffEdit);
  const tariffKind = useGarage((s) => s.tariffKind);
  const tariffDraft = useGarage((s) => s.tariffDraft);
  const setTariffDraft = useGarage((s) => s.setTariffDraft);
  const saveTariffEdit = useGarage((s) => s.saveTariffEdit);
  const draftSale = useGarage((s) => s.draftSale);
  const setDraftSale = useGarage((s) => s.setDraftSale);
  const confirmSell = useGarage((s) => s.confirmSell);
  const acceptSell = useGarage((s) => s.acceptSell);
  const saleNet = useGarage((s) => s.saleNet);
  const detailsId = useGarage((s) => s.detailsId);
  const cars = useGarage((s) => s.cars);
  const car = cars.find((row) => row.id === detailsId);

  if (subModal === "official") {
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Введите госстоимость</h2>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={draftOfficial}
            onChange={(event) => setDraftOfficial(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                playClick();
                saveOfficial();
              }
            }}
          />
          <p className="mt-2 text-right text-xs text-subtle">руб.</p>
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              saveOfficial();
            }}
          >
            Далее
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "expense") {
    const sub = expenseSign < 0;
    const repair = expenseTarget === "repair";
    const title = repair
      ? sub
        ? "Убавить ремонт"
        : "Добавить ремонт"
      : sub
        ? "Убавить расходы"
        : "Добавить расходы";
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">{title}</h2>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={draftExpense}
            onChange={(event) => setDraftExpense(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                playClick();
                saveExpense();
              }
            }}
          />
          <p className="mt-2 text-right text-xs text-subtle">руб.</p>
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              saveExpense();
            }}
          >
            Далее
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "edit-earn") {
    return (
      <Modal layer="sub" wide>
        <h2 className="text-center text-lg font-semibold">Редактировать</h2>
        <div className="mx-auto mt-6 w-full max-w-xs space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Сегодня</span>
            <input
              className="field"
              inputMode="decimal"
              value={draftEarnToday}
              onChange={(event) => setDraftEarnToday(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">За неделю</span>
            <input
              className="field"
              inputMode="decimal"
              value={draftEarnWeek}
              onChange={(event) => setDraftEarnWeek(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">За месяц</span>
            <input
              className="field"
              inputMode="decimal"
              value={draftEarnMonth}
              onChange={(event) => setDraftEarnMonth(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted">Всего</span>
            <input
              className="field"
              inputMode="decimal"
              value={draftEarnTotal}
              onChange={(event) => setDraftEarnTotal(event.target.value)}
            />
          </label>
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              saveEditEarn();
            }}
          >
            Далее
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "rename") {
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Название авто</h2>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            value={draftCarName}
            onChange={(event) => setDraftCarName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                playClick();
                saveRename();
              }
            }}
          />
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              saveRename();
            }}
          >
            Сохранить
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "owned-days") {
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Дней во владении</h2>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="numeric"
            value={draftOwnedDays}
            onChange={(event) => setDraftOwnedDays(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                playClick();
                saveOwnedDays();
              }
            }}
          />
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              saveOwnedDays();
            }}
          >
            Сохранить
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "undo-rent") {
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Отменить последнюю аренду?</h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted">
          Вы точно хотите отменить последнюю аренду? Сумма и запись исчезнут из логов.
        </p>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-red h-11 min-w-36 px-5 text-sm"
            onClick={() => {
              playClick();
              confirmUndoRent();
            }}
          >
            Отменить
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-5 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Назад
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "clear-log") {
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Очистить лог?</h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted">
          {logRange === "month"
            ? "Вы уверены, что хотите очистить лог за месяц?"
            : "Вы уверены, что хотите очистить лог за неделю?"}
        </p>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-red h-11 min-w-36 px-5 text-sm"
            onClick={() => {
              playClick();
              confirmClearLog();
            }}
          >
            Очистить
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-5 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "plate") {
    return (
      <Modal layer="sub" wide>
        <h2 className="text-center text-lg font-semibold">Госномер</h2>
        <div className="mx-auto mt-6 flex w-full max-w-sm items-end justify-center gap-3">
          <label className="block min-w-0 flex-1">
            <span className="mb-1.5 block text-xs text-muted">Номер</span>
            <input
              className="field font-semibold tracking-[0.18em]"
              autoFocus
              placeholder="А123АА"
              value={draftPlate}
              maxLength={6}
              onChange={(event) => setDraftPlate(sanitizePlate(event.target.value))}
              aria-label="Госномер"
            />
          </label>
          <label className="block w-[4.75rem] shrink-0">
            <span className="mb-1.5 block text-xs text-muted">Регион</span>
            <input
              className="field px-2 text-center font-semibold tabular-nums"
              inputMode="numeric"
              placeholder="777"
              value={draftRegion}
              maxLength={3}
              onChange={(event) => setDraftRegion(sanitizeRegion(event.target.value))}
              aria-label="Регион"
            />
          </label>
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              savePlate();
            }}
          >
            Сохранить
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "tariff") {
    const hourly = car?.hourlyRate;
    const daily = car?.dailyRate;
    return (
      <Modal layer="sub" wide>
        <h2 className="text-center text-lg font-semibold">Тариф</h2>
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3 border border-line px-4 py-3">
            <div>
              <p className="text-xs text-muted">Часовой</p>
              <p className="mt-1 text-sm font-medium tabular-nums">
                {hourly == null ? "не задан" : `${money(hourly)} / час`}
              </p>
            </div>
            <button
              type="button"
              className="btn-fill btn-ghost h-9 px-3 text-xs"
              onClick={() => {
                playClick();
                openTariffEdit("hourly", "car");
              }}
            >
              Изменить
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 border border-line px-4 py-3">
            <div>
              <p className="text-xs text-muted">Суточный</p>
              <p className="mt-1 text-sm font-medium tabular-nums">
                {daily == null ? "не задан" : `${money(daily)} / день`}
              </p>
            </div>
            <button
              type="button"
              className="btn-fill btn-ghost h-9 px-3 text-xs"
              onClick={() => {
                playClick();
                openTariffEdit("daily", "car");
              }}
            >
              Изменить
            </button>
          </div>
        </div>
        <ModalActions>
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
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "tariff-edit") {
    const daily = tariffKind === "daily";
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">{daily ? "Суточный тариф" : "Часовой тариф"}</h2>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={tariffDraft}
            onChange={(event) => setTariffDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                playClick();
                saveTariffEdit();
              }
            }}
          />
          <p className="mt-2 text-right text-xs text-subtle">{daily ? "руб. в день" : "руб. в час"}</p>
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              saveTariffEdit();
            }}
          >
            Сохранить
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "sell-ask") {
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Продать авто?</h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted">
          Вы точно хотите продать авто? Карточка удалится после итога.
        </p>
        <div className="mx-auto mt-5 w-full max-w-xs">
          <span className="mb-1.5 block text-xs text-muted">За сколько продали</span>
          <input
            className="field"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={draftSale}
            onChange={(event) => setDraftSale(event.target.value)}
          />
          <p className="mt-2 text-right text-xs text-subtle">руб.</p>
        </div>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-36 px-5 text-sm"
            onClick={() => {
              playClick();
              confirmSell();
            }}
          >
            Подтвердить
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-11 min-w-32 px-5 text-sm"
            onClick={() => {
              playClick();
              closeOverlay();
            }}
          >
            Отмена
          </button>
        </ModalActions>
      </Modal>
    );
  }

  if (subModal === "sell-result") {
    const loss = saleNet < 0;
    return (
      <Modal layer="sub" blur>
        <h2 className={`text-center text-lg font-semibold ${loss ? "text-danger-hi" : "text-primary-hi"}`}>
          {loss ? "Плохо" : "Хорошо"}
        </h2>
        <p className="mt-4 text-center text-sm leading-relaxed text-muted">
          {loss
            ? `Вы продали машину себе в минус на ${money(Math.abs(saleNet))}.`
            : `Вы заработали с продажи этой машины ${money(saleNet)}.`}
        </p>
        <ModalActions>
          <button
            type="button"
            className="btn-fill btn-green h-11 min-w-36 px-6 text-sm"
            onClick={() => {
              playClick();
              acceptSell();
            }}
          >
            Принять
          </button>
        </ModalActions>
      </Modal>
    );
  }

  return null;
}

export function GarageOverlays() {
  const overlay = useGarage((s) => s.overlay);
  const subModal = useGarage((s) => s.subModal);
  const detailsId = useGarage((s) => s.detailsId);
  const deleteId = useGarage((s) => s.deleteId);
  const cars = useGarage((s) => s.cars);
  const pendingImport = useGarage((s) => s.pendingImport);
  const closeOverlay = useGarage((s) => s.closeOverlay);
  const confirmReset = useGarage((s) => s.confirmReset);
  const confirmDelete = useGarage((s) => s.confirmDelete);
  const confirmImport = useGarage((s) => s.confirmImport);
  const cancelImport = useGarage((s) => s.cancelImport);
  const detailsCar = cars.find((car) => car.id === detailsId);
  const deleteCar = cars.find((car) => car.id === deleteId);

  useEffect(() => {
    if (overlay === "none" && subModal === "none") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        playClick();
        closeOverlay();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, subModal, closeOverlay]);

  return (
    <>
      {overlay === "reset" ? (
        <Modal>
          <h2 className="text-center text-lg font-semibold">Сбросить весь учёт?</h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted">
            Все автомобили будут удалены безвозвратно.
            <br />
            База данных станет пустой.
          </p>
          <ModalActions>
            <button
              type="button"
              className="btn-fill btn-red h-11 min-w-36 px-5 text-sm"
              onClick={() => {
                playClick();
                confirmReset();
              }}
            >
              Да, сбросить
            </button>
            <button
              type="button"
              className="btn-fill btn-ghost h-11 min-w-32 px-5 text-sm"
              onClick={() => {
                playClick();
                closeOverlay();
              }}
            >
              Отмена
            </button>
          </ModalActions>
        </Modal>
      ) : null}

      {overlay === "import-confirm" && pendingImport ? (
        <Modal wide>
          <h2 className="text-center text-lg font-semibold">Загрузить автомобили?</h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted">
            Текущие карточки будут заменены данными из файла.
            <br />
            Будет загружено автомобилей: {pendingImport.length}.
          </p>
          <ModalActions>
            <button
              type="button"
              className="btn-fill btn-green h-11 min-w-36 px-5 text-sm"
              onClick={() => {
                playClick();
                confirmImport();
              }}
            >
              Загрузить
            </button>
            <button
              type="button"
              className="btn-fill btn-ghost h-11 min-w-32 px-5 text-sm"
              onClick={() => {
                playClick();
                cancelImport();
              }}
            >
              Отмена
            </button>
          </ModalActions>
        </Modal>
      ) : null}

      {overlay === "delete" && deleteCar ? (
        <Modal>
          <h2 className="text-center text-lg font-semibold">Удалить автомобиль?</h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-muted">
            «{deleteCar.name}» будет удалён безвозвратно.
          </p>
          <ModalActions>
            <button
              type="button"
              className="btn-fill btn-red h-11 min-w-36 px-5 text-sm"
              onClick={() => {
                playClick();
                confirmDelete();
              }}
            >
              Удалить
            </button>
            <button
              type="button"
              className="btn-fill btn-ghost h-11 min-w-32 px-5 text-sm"
              onClick={() => {
                playClick();
                closeOverlay();
              }}
            >
              Отмена
            </button>
          </ModalActions>
        </Modal>
      ) : null}

      {overlay === "details" && detailsCar ? <DetailsOverlay car={detailsCar} /> : null}
      {overlay === "rent" ? <RentOverlay /> : null}
      {subModal === "none" ? null : <SubModals />}

      {overlay === "wizard" ? <WizardModal /> : null}
      {overlay === "api" ? <ApiPanel /> : null}
      {overlay === "market" ? <MarketPanel /> : null}
    </>
  );
}

export function GarageToasts() {
  const toasts = useGarage((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-max max-w-xs flex-col-reverse gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto px-6 py-4 text-center text-sm text-fg ${
            toast.kind === "error" ? "bg-toast-err" : "bg-toast"
          }`}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
