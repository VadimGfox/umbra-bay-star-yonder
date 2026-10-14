import { API_SERVERS, type ApiServerId } from "@/lib/garage/types";
import { useGarage } from "@/lib/garage/store";
import { playClick } from "@/lib/garage/utils";

const ORDER: ApiServerId[] = ["RU1", "RU2", "RU3"];

export function ApiPanel() {
  const apiKey = useGarage((s) => s.apiKey);
  const apiServer = useGarage((s) => s.apiServer);
  const apiPulse = useGarage((s) => s.apiPulse);
  const setApiKey = useGarage((s) => s.setApiKey);
  const selectApiServer = useGarage((s) => s.selectApiServer);
  const closeOverlay = useGarage((s) => s.closeOverlay);
  const saved = apiServer ? API_SERVERS[apiServer] : "";

  return (
    <div className="backdrop-enter backdrop-blurred fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="modal-enter relative w-full max-w-md overflow-hidden bg-elevated" role="dialog" aria-modal="true">
        <div className="pop-head">
          <p>API</p>
          <div className="header-pulse-line" />
        </div>
        <button
          type="button"
          className="absolute top-3 right-4 z-10 size-8 text-lg text-muted hover:text-fg"
          aria-label="Закрыть"
          onClick={() => {
            playClick();
            closeOverlay();
          }}
        >
          ×
        </button>
        <div className="px-8 py-7">
        <p className="text-center text-xs leading-relaxed text-muted">
          Ключ сохранится на этом устройстве. Запросы уходят только когда вы сами обновляете рынок.
        </p>
        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs text-muted">API ключ</span>
          <input
            className="field"
            autoFocus
            type="password"
            autoComplete="off"
            placeholder="Вставьте ключ"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </label>
        <div className="mt-4 grid gap-2">
          {ORDER.map((id) => (
            <button
              key={id}
              type="button"
              className={`btn-fill h-12 w-full text-sm ${apiServer === id ? "btn-green" : "btn-ghost"}`}
              onClick={() => {
                playClick();
                selectApiServer(id);
              }}
            >
              {API_SERVERS[id]}
            </button>
          ))}
        </div>
        {apiServer ? (
          <div key={apiPulse} className="api-saved mt-6 flex flex-col items-center text-center">
            <span className="api-check" aria-hidden="true">
              <svg viewBox="0 0 48 48" className="size-14">
                <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M15 24.5 21 30.5 33.5 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="mt-2 text-sm font-medium">Данные сохранены</p>
            <p className="mt-1 text-xs text-subtle">ваш сервер {saved}</p>
          </div>
        ) : (
          <p className="mt-5 text-center text-xs text-subtle">Сервер ещё не выбран</p>
        )}
        </div>
      </div>
    </div>
  );
}
