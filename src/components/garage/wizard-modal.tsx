import { useRef } from "react";
import { albumPut } from "@/lib/garage/album";
import { useGarage } from "@/lib/garage/store";
import { parseMoney, playClick, rateChip, readCarImage, sanitizePlate, sanitizeRegion } from "@/lib/garage/utils";

function Actions({
  nextLabel,
  onNext,
  backLabel,
  onBack,
}: {
  nextLabel: string;
  onNext: () => void;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
      <button type="button" className="btn-fill btn-green h-11 min-w-32 px-6 text-sm" onClick={onNext}>
        {nextLabel}
      </button>
      <button type="button" className="btn-fill btn-ghost h-11 min-w-32 px-6 text-sm" onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}

export function WizardModal() {
  const step = useGarage((s) => s.wizardStep);
  const draftName = useGarage((s) => s.draftName);
  const draftPlate = useGarage((s) => s.draftPlate);
  const draftRegion = useGarage((s) => s.draftRegion);
  const draftImage = useGarage((s) => s.draftImage);
  const draftPrice = useGarage((s) => s.draftPrice);
  const draftScrap = useGarage((s) => s.draftScrap);
  const draftOfficial = useGarage((s) => s.draftOfficial);
  const draftHourly = useGarage((s) => s.draftHourly);
  const draftDaily = useGarage((s) => s.draftDaily);
  const setDraftName = useGarage((s) => s.setDraftName);
  const setDraftPlate = useGarage((s) => s.setDraftPlate);
  const setDraftRegion = useGarage((s) => s.setDraftRegion);
  const setDraftImage = useGarage((s) => s.setDraftImage);
  const setDraftPrice = useGarage((s) => s.setDraftPrice);
  const setDraftScrap = useGarage((s) => s.setDraftScrap);
  const setDraftOfficial = useGarage((s) => s.setDraftOfficial);
  const pickAcquire = useGarage((s) => s.pickAcquire);
  const wizardNext = useGarage((s) => s.wizardNext);
  const wizardBack = useGarage((s) => s.wizardBack);
  const closeOverlay = useGarage((s) => s.closeOverlay);
  const openTariffEdit = useGarage((s) => s.openTariffEdit);
  const pushToast = useGarage((s) => s.pushToast);
  const fileRef = useRef<HTMLInputElement>(null);

  const next = () => {
    playClick();
    void wizardNext();
  };
  const back = () => {
    playClick();
    if (step === "name") closeOverlay();
    else wizardBack();
  };

  let body = null;
  if (step === "acquire") {
    body = (
      <>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-fill btn-ghost h-24 flex-1 px-4 text-sm"
            onClick={() => {
              playClick();
              pickAcquire("free");
            }}
          >
            Бесплатно
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-24 flex-1 px-4 text-sm"
            onClick={() => {
              playClick();
              pickAcquire("paid");
            }}
          >
            Платно
          </button>
        </div>
        <div className="mt-8 flex justify-center">
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
        </div>
      </>
    );
  } else if (step === "name") {
    body = (
      <>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            placeholder="Например: Benefactor Schafter"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") next();
            }}
          />
        </div>
        <Actions nextLabel="Далее" onNext={next} backLabel="Назад" onBack={back} />
      </>
    );
  } else if (step === "plate") {
    body = (
      <>
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
                if (event.key === "Enter") next();
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
                if (event.key === "Enter") next();
              }}
              aria-label="Регион"
            />
          </label>
        </div>
        <Actions nextLabel="Далее" onNext={next} backLabel="Назад" onBack={back} />
      </>
    );
  } else if (step === "image") {
    body = (
      <>
        <p className="mt-2 text-center text-xs text-muted">
          {draftImage ? "Файл выбран и попадёт в локальный альбом по названию." : "Можно пропустить."}
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
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              try {
                const data = await readCarImage(file);
                setDraftImage(data);
                void albumPut(draftName, data);
                pushToast("Изображение сохранено в альбом", "info");
              } catch {
                pushToast("Не удалось прочитать файл", "error");
              }
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
        <Actions nextLabel="Далее" onNext={next} backLabel="Назад" onBack={back} />
      </>
    );
  } else if (step === "buy") {
    body = (
      <>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={draftPrice}
            onChange={(event) => setDraftPrice(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") next();
            }}
          />
          <p className="mt-2 text-right text-xs text-subtle">руб.</p>
        </div>
        <Actions nextLabel="Далее" onNext={next} backLabel="Назад" onBack={back} />
      </>
    );
  } else if (step === "official") {
    body = (
      <>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={draftOfficial}
            onChange={(event) => setDraftOfficial(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") next();
            }}
          />
          <p className="mt-2 text-right text-xs text-subtle">руб.</p>
        </div>
        <Actions nextLabel="Далее" onNext={next} backLabel="Назад" onBack={back} />
      </>
    );
  } else if (step === "scrap") {
    body = (
      <>
        <div className="mx-auto mt-6 w-full max-w-xs">
          <input
            className="field"
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={draftScrap}
            onChange={(event) => setDraftScrap(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") next();
            }}
          />
          <p className="mt-2 text-right text-xs text-subtle">руб.</p>
        </div>
        <Actions nextLabel="Далее" onNext={next} backLabel="Назад" onBack={back} />
      </>
    );
  } else {
    const hourly = draftHourly.trim() ? parseMoney(draftHourly) : NaN;
    const daily = draftDaily.trim() ? parseMoney(draftDaily) : NaN;
    body = (
      <>
        <p className="mt-2 text-center text-xs text-muted">Задайте цену за час и за сутки. Потом создадим карточку.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="btn-fill btn-ghost h-20 flex-col px-3 text-sm"
            onClick={() => {
              playClick();
              openTariffEdit("hourly", "wizard");
            }}
          >
            <span>Часовой</span>
            <span className="text-xs font-medium text-muted">
              {Number.isFinite(hourly) ? rateChip(hourly, "час") : "не задан"}
            </span>
          </button>
          <button
            type="button"
            className="btn-fill btn-ghost h-20 flex-col px-3 text-sm"
            onClick={() => {
              playClick();
              openTariffEdit("daily", "wizard");
            }}
          >
            <span>Суточный</span>
            <span className="text-xs font-medium text-muted">
              {Number.isFinite(daily) ? rateChip(daily, "день") : "не задан"}
            </span>
          </button>
        </div>
        <Actions nextLabel="Создать" onNext={next} backLabel="Назад" onBack={back} />
      </>
    );
  }

  const titles: Record<string, string> = {
    acquire: "Как получили авто",
    name: "Название авто",
    plate: "Госномер",
    image: "Изображение",
    buy: "За сколько купили авто",
    official: "Госцена",
    scrap: "Цена свалки",
    tariff: "Тариф",
  };

  return (
    <div className="backdrop-enter backdrop-blurred fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="modal-enter w-full max-w-md overflow-hidden bg-elevated" role="dialog" aria-modal="true">
        <div className="pop-head">
          <p>{titles[step] ?? "Новое авто"}</p>
          <div className="header-pulse-line" />
        </div>
        <div className="px-8 py-7">{body}</div>
      </div>
    </div>
  );
}
