import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { fetchMarketplace, marketSlotsLeft, markMarketCall, matchVehicle, type MarketVehicle } from "@/lib/garage/market";
import { API_SERVERS } from "@/lib/garage/types";
import { useGarage } from "@/lib/garage/store";
import { money, playClick } from "@/lib/garage/utils";

export function MarketPanel({ carName }: { carName: string }) {
  const apiKey = useGarage((s) => s.apiKey);
  const apiServer = useGarage((s) => s.apiServer);
  const closeOverlay = useGarage((s) => s.closeOverlay);
  const pushToast = useGarage((s) => s.pushToast);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [row, setRow] = useState<MarketVehicle | null>(null);
  const [period, setPeriod] = useState<number | null>(null);
  const serverName = apiServer ? API_SERVERS[apiServer] : "Сервер не выбран";

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
      const found = matchVehicle(result.data.vehicles, carName);
      setRow(found);
      if (!found) setError(`На ${serverName} нет позиции «${carName}».`);
    } catch {
      setError("Не удалось получить рынок.");
      pushToast("Не удалось получить рынок", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backdrop-enter backdrop-blurred fixed inset-0 z-40 overflow-hidden">
      <div className="modal-enter mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-6 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold tracking-wide">{serverName}</p>
            <p className="mt-1 text-sm text-muted">{carName}</p>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto bg-elevated p-5 md:p-6">
          {!row && !error ? (
            <p className="text-sm leading-relaxed text-muted">
              Нажмите «Обновить», чтобы запросить цены этой машины на {serverName}. Запрос уходит только по кнопке.
            </p>
          ) : null}
          {error ? <p className="text-sm leading-relaxed text-muted">{error}</p> : null}
          {row ? (
            <div>
              <h3 className="text-xl font-semibold">{row.modelName}</h3>
              {period ? <p className="mt-1 text-xs text-subtle">Статистика за {period} дн.</p> : null}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Stat label="На продаже" value={String(row.totalCount)} />
                <Stat label="Продано" value={String(row.soldCount)} />
                <Stat label="Минимум" value={money(row.minPrice)} />
                <Stat label="Максимум" value={money(row.maxPrice)} />
                <Stat label="Рекомендуемая" value={money(row.averagePrice)} wide />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`border border-line px-4 py-3 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
