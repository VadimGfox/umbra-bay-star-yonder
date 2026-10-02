import { useEffect, useRef, useState, type ReactNode } from "react";
import { Clock } from "lucide-react";
import { DetailsOverlay } from "@/components/garage/details";
import { useGarage } from "@/lib/garage/store";
import { playClick, readCarImage, sanitizePlate, sanitizeRegion } from "@/lib/garage/utils";

function Modal({
  children,
  wide,
  layer,
}: {
  children: ReactNode;
  wide?: boolean;
  layer?: "sub" | "main";
}) {
  return (
    <div
      className={`backdrop-enter fixed inset-0 flex items-center justify-center bg-overlay p-4 ${
        layer === "sub" ? "z-50" : "z-40"
      }`}
    >
      <div
        className={`modal-enter w-full bg-elevated px-8 py-8 ${wide ? "max-w-md" : "max-w-sm"}`}
        role="dialog"
        aria-modal="true"
      >
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
      <Modal wide>
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
    return (
      <Modal>
        <h2 className="text-center text-lg font-semibold">
          {daily ? "На сколько суток ушла машина?" : "На сколько часов ушла машина?"}
        </h2>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="numeric"
            placeholder={daily ? "1" : "2"}
            value={rentDuration}
            onChange={(event) => setRentDuration(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                playClick();
                rentNext();
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

  return (
    <Modal>
      <h2 className="text-center text-lg font-semibold">За сколько ушла машина?</h2>
      <div className="mx-auto mt-6 w-full max-w-xs">
        <input
          className="field"
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
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Добавить расходы</h2>
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

  if (subModal === "clear-log") {
    return (
      <Modal layer="sub">
        <h2 className="text-center text-lg font-semibold">Очистить лог?</h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted">
          Вы уверены, что хотите очистить лог за неделю?
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

  return null;
}

export function GarageOverlays() {
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
  const fileRef = useRef<HTMLInputElement>(null);
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

  async function pickImage(file?: File) {
    if (!file) return;
    try {
      const data = await readCarImage(file);
      setDraftImage(data);
      pushToast("Изображение выбрано", "info");
    } catch {
      pushToast("Не удалось прочитать файл", "error");
    }
  }

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

      {overlay === "wizard" ? (
        <Modal wide>
          <p className="mb-3 text-center text-xs tracking-wide text-subtle tabular-nums">
            Шаг {wizardStep} из 4
          </p>
          {wizardStep === 1 ? (
            <>
              <h2 className="text-center text-lg font-semibold">Введите название авто</h2>
              <div className="mx-auto mt-6 w-full max-w-xs">
                <input
                  className="field"
                  autoFocus
                  placeholder="Например: Toyota Camry"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      playClick();
                      wizardNext();
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
                    wizardNext();
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
            </>
          ) : null}
          {wizardStep === 2 ? (
            <>
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
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        playClick();
                        wizardNext();
                      }
                    }}
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
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        playClick();
                        wizardNext();
                      }
                    }}
                    aria-label="Регион"
                  />
                </label>
              </div>
              <ModalActions>
                <button
                  type="button"
                  className="btn-fill btn-green h-11 min-w-28 px-5 text-sm"
                  onClick={() => {
                    playClick();
                    wizardNext();
                  }}
                >
                  Далее
                </button>
                <button
                  type="button"
                  className="btn-fill btn-ghost h-11 min-w-28 px-5 text-sm"
                  onClick={() => {
                    playClick();
                    wizardBack();
                  }}
                >
                  Назад
                </button>
              </ModalActions>
            </>
          ) : null}
          {wizardStep === 3 ? (
            <>
              <h2 className="text-center text-lg font-semibold">Выберите изображение для авто</h2>
              <p className="mt-2 text-center text-xs text-muted">
                Текущее: {draftImage ? "файл выбран" : "не выбрано"}
              </p>
              {draftImage ? (
                <div className="mx-auto mt-4 h-28 w-full max-w-xs overflow-hidden bg-surface">
                  <img src={draftImage} alt="" className="h-full w-full object-contain" />
                </div>
              ) : null}
              <div className="mt-5 flex justify-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/bmp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void pickImage(file);
                  }}
                />
                <button
                  type="button"
                  className="btn-fill btn-ghost h-11 min-w-40 px-6 text-sm"
                  onClick={() => {
                    playClick();
                    fileRef.current?.click();
                  }}
                >
                  Открыть файл
                </button>
              </div>
              <ModalActions>
                <button
                  type="button"
                  className="btn-fill btn-green h-11 min-w-28 px-5 text-sm"
                  onClick={() => {
                    playClick();
                    wizardNext();
                  }}
                >
                  Далее
                </button>
                <button
                  type="button"
                  className="btn-fill btn-ghost h-11 min-w-28 px-5 text-sm"
                  onClick={() => {
                    playClick();
                    wizardBack();
                  }}
                >
                  Назад
                </button>
              </ModalActions>
            </>
          ) : null}
          {wizardStep === 4 ? (
            <>
              <h2 className="text-center text-lg font-semibold">Стоимость авто</h2>
              <div className="mx-auto mt-6 w-full max-w-xs space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs text-muted">Цена</span>
                  <input
                    className="field"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftPrice}
                    onChange={(event) => setDraftPrice(event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-muted">Слив по свалке</span>
                  <input
                    className="field"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftScrap}
                    onChange={(event) => setDraftScrap(event.target.value)}
                  />
                </label>
              </div>
              <ModalActions>
                <button
                  type="button"
                  className="btn-fill btn-green h-11 min-w-32 px-6 text-sm"
                  onClick={() => {
                    playClick();
                    wizardNext();
                  }}
                >
                  Готово
                </button>
                <button
                  type="button"
                  className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm"
                  onClick={() => {
                    playClick();
                    wizardBack();
                  }}
                >
                  Назад
                </button>
              </ModalActions>
            </>
          ) : null}
        </Modal>
      ) : null}
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

const SPLASH_MS = 2400;
const SPLASH_SWAP_MS = 1200;

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const bootCheck = useGarage((s) => s.bootCheck);
  const [phase, setPhase] = useState<"load" | "venom">("load");

  useEffect(() => {
    const finish = () => bootCheck();
    const unsub = useGarage.persist.onFinishHydration(finish);
    if (useGarage.persist.hasHydrated()) finish();
    const swap = window.setInterval(() => {
      setPhase((current) => (current === "load" ? "venom" : "load"));
    }, SPLASH_SWAP_MS);
    const done = window.setTimeout(() => onDone(), SPLASH_MS);
    return () => {
      unsub();
      window.clearInterval(swap);
      window.clearTimeout(done);
    };
  }, [bootCheck, onDone]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg">
      <div className="splash-ring" aria-hidden="true" />
      <div className="relative mt-8 h-8 w-72">
        <p
          className={`splash-copy absolute inset-0 text-center text-sm tracking-[0.28em] text-fg ${
            phase === "load" ? "splash-in" : "splash-out"
          }`}
        >
          Загрузка
        </p>
        <p
          className={`splash-copy absolute inset-0 text-center text-sm tracking-[0.22em] text-fg ${
            phase === "venom" ? "splash-in" : "splash-out"
          }`}
        >
          Powered by Venom
        </p>
      </div>
    </div>
  );
}

