import { Clock } from "lucide-react";
import type { Car } from "@/lib/garage/types";
import { useGarage } from "@/lib/garage/store";
import { formatPlate, hoursLabel, playClick } from "@/lib/garage/utils";

export function CarCard({ car }: { car: Car }) {
  const openRent = useGarage((s) => s.openRent);
  const openDelete = useGarage((s) => s.openDelete);
  const openDetails = useGarage((s) => s.openDetails);
  const plate = formatPlate(car.plate, car.region);

  return (
    <article className="flex w-44 shrink-0 flex-col overflow-hidden bg-surface shadow-[var(--shadow-border)] md:w-48">
      <div className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted">
        <Clock className="size-3" />
        <span className="tabular-nums">{hoursLabel(car.hours)}</span>
      </div>
      <div className="h-28 bg-surface md:h-32">
        {car.imageData ? (
          <img
            src={car.imageData}
            alt={car.name}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-subtle">Нет фото</div>
        )}
      </div>
      <div className="px-2.5 pt-2 pb-2.5">
        <h3 className="truncate text-sm font-semibold text-fg">{car.name}</h3>
        {plate ? (
          <p className="mt-0.5 truncate text-xs tracking-wide text-muted tabular-nums">{plate}</p>
        ) : null}
      </div>
      <button
        type="button"
        className="card-action"
        onClick={() => {
          playClick();
          openRent(car.id);
        }}
      >
        Сдать в аренду
      </button>
      <button
        type="button"
        className="card-action"
        onClick={() => {
          playClick();
          openDetails(car.id);
        }}
      >
        Подробнее
      </button>
      <button
        type="button"
        className="card-action"
        onClick={() => {
          playClick();
          openDelete(car.id);
        }}
      >
        Удалить
      </button>
    </article>
  );
}
