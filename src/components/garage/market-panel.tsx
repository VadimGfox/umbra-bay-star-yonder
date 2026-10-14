import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { fetchMarketplace, marketSlotsLeft, markMarketCall, matchVehicle, type MarketVehicle } from "@/lib/garage/market";
import { API_SERVERS } from "@/lib/garage/types";
import { useGarage } from "@/lib/garage/store";
import { money, playClick } from "@/lib/garage/utils";

export function MarketPanel({ carName, model }: { carName: string; model: string }) {
  const apiKey = useGarage((s) => s.apiKey);
  const apiServer = useGarage((s) => s.apiServer);
  const closeOverlay = useGarage((s) => s.closeOverlay);
  const pushToast = useGarage((s) => s.pushToast);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [row, setRow] = useState<MarketVehicle | null>(null);
  const [period, setPeriod] = useState<number | null>(null);
  const serverName = apiServer ? API_SERVERS[apiServer] : "Сервер не выбран";
  const query = model.trim() || carName;

  const refresh = async () => {
    if (!apiKey.trim()) {
      pushToast("Сначала сохраните API ключ", "error");
      setError("Нет API ключа. Откройте API и вставьте ключ.");
      return;
    }
    if (!apiServer) {
      pushToast("Выберите сервер в окне API", "error");
      setError("Сервер не выбран.");
      return;
    }
    if (!query) {
      setError("Укажите модель машины в карточке.");
      return;
    }
    if (marketSlotsLeft() <= 0) {
      pushToast("Лимит: 5 запросов в минуту", "error");
      setError("Слишком часто. Можно 5 обновлений за 60 секунд.");
      return;
    }
    markMarketCall();
    setLoading(true);
    setError("");
    try {
      const result = await fetchMarketplace({ data: { apiKey: apiKey.trim(), serverId: apiServer } });
      if (!result.ok) {
        setRow(null);
        setError(result.message);
        pushToast(result.message, "error");
        return;
      }
      setPeriod(result.data.periodDays);
      const found = matchVehicle(result.data.vehicles, query);
      setRow(found);
      if (!found) setError(`На ${serverName} нет позиции «${query}».`);
    } catch {
      setError("Не удалось получить рынок.");
      pushToast("Не удалось получить рынок", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-enter backdrop-blurred fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="modal-enter flex max-h-[min(88dvh,720px)] w-full max-w-2xl flex-col overflow-hidden bg-[#101014]" role="dialog" aria-modal="true">
        <div className="pop-head">
          <p>{serverName}</p>
          <div className="header-pulse-line" />
        </div>
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-subtle">РЫНОК</p>
            <p className="mt-1 text-lg font-semibold">{carName}</p>
            <p className="text-xs text-muted">модель {model.trim() || "не задана — ищем по названию"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 text-sm text-muted hover:text-fg"
              onClick={() => {
                playClick();
                void refresh();
              }}
            >
              <RotateCcw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Обновить
            </button>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center text-muted hover:text-fg"
              aria-label="Закрыть"
              onClick={() => {
                playClick();
                closeOverlay();
              }}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {!row && !error ? (
            <p className="text-sm leading-relaxed text-muted">
              Нажмите «Обновить». Запрос уйдёт только по кнопке и найдёт «{query}» на сервере {serverName}.
            </p>
          ) : null}
          {error ? <p className="text-sm leading-relaxed text-[#e7b4b4]">{error}</p> : null}
          {row ? (
            <div className="market-sheet">
              <div className="market-hero">
                <p className="text-xs tracking-[0.18em] text-subtle">{row.model}</p>
                <h3 className="mt-1 text-2xl font-semibold">{row.modelName}</h3>
                {period ? <p className="mt-1 text-xs text-subtle">за {period} дней</p> : null}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Stat label="На продаже" value={String(row.totalCount)} hint="штук сейчас" />
                <Stat label="Продано" value={String(row.soldCount)} hint="за период" />
                <Stat label="Минимум" value={money(row.minPrice)} />
                <Stat label="Максимум" value={money(row.maxPrice)} />
                <Stat label="Рекомендуемая цена" value={money(row.averagePrice)} wide />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, wide }: { label: string; value: string; hint?: string; wide?: boolean }) {
  return (
    <div className={`market-stat ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-[11px] tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-subtle">{hint}</p> : null}
    </div>
  );
}
