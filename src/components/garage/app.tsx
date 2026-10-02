import { useCallback, useEffect, useState } from "react";
import { Car } from "lucide-react";
import { CarCard } from "@/components/garage/car-card";
import { GarageHeader } from "@/components/garage/header";
import { GarageOverlays, GarageToasts, SplashScreen } from "@/components/garage/overlays";
import { useGarage } from "@/lib/garage/store";
import { filterCars, playClick } from "@/lib/garage/utils";

function isDesktopShell() {
  return typeof window !== "undefined" && Boolean((window as Window & { garageDesktop?: unknown }).garageDesktop);
}

function GarageShell() {
  const cars = useGarage((s) => s.cars);
  const search = useGarage((s) => s.search);
  const openWizard = useGarage((s) => s.openWizard);
  const bootCheck = useGarage((s) => s.bootCheck);
  const visible = filterCars(cars, search);

  useEffect(() => {
    const finish = () => bootCheck();
    const unsub = useGarage.persist.onFinishHydration(finish);
    if (useGarage.persist.hasHydrated()) finish();
    return unsub;
  }, [bootCheck]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <GarageHeader />
      <main className="flex min-h-0 flex-1 flex-col px-3 pt-4 pb-28 md:px-5 md:pt-4">
        {visible.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <Car className="mb-4 size-10 text-subtle" strokeWidth={1.5} />
            <p className="max-w-sm text-center text-sm leading-relaxed text-muted">
              {search.trim()
                ? "Ничего не найдено."
                : "Пока нет автомобилей. Нажмите «Новое авто», чтобы добавить."}
            </p>
            {search.trim() ? null : (
              <button
                type="button"
                className="btn-fill btn-green mt-6 h-11 min-w-48 px-6 text-sm"
                onClick={() => {
                  playClick();
                  openWizard();
                }}
              >
                Новое авто
              </button>
            )}
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[74rem] flex-wrap justify-center gap-x-4 gap-y-5">
            {visible.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </main>
      <GarageOverlays />
      <GarageToasts />
    </div>
  );
}

export function GarageApp() {
  const [ready, setReady] = useState(!isDesktopShell());
  const onDone = useCallback(() => setReady(true), []);
  if (!ready) return <SplashScreen onDone={onDone} />;
  return <GarageShell />;
}
