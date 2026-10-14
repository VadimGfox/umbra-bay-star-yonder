import { useCallback, useEffect, useState } from "react";
import { Car } from "lucide-react";
import { CarCard } from "@/components/garage/car-card";
import { GarageHeader } from "@/components/garage/header";
import { ApiGlyph } from "@/components/garage/icons";
import { GarageOverlays, GarageToasts } from "@/components/garage/overlays";
import { AmbientDust } from "@/components/garage/particles";
import { SplashScreen } from "@/components/garage/splash";
import { useGarage } from "@/lib/garage/store";
import { filterCars, money, playClick } from "@/lib/garage/utils";

function GarageShell() {
  const cars = useGarage((s) => s.cars);
  const search = useGarage((s) => s.search);
  const openApi = useGarage((s) => s.openApi);
  const openWizard = useGarage((s) => s.openWizard);
  const bootCheck = useGarage((s) => s.bootCheck);
  const visible = filterCars(cars, search);
  const fleetOfficial = cars.reduce((sum, car) => sum + (car.officialPrice ?? 0), 0);
  const earnedToday = cars.reduce((sum, car) => sum + (car.earnedToday || 0), 0);
  const earnedAll = cars.reduce((sum, car) => sum + (car.earnedTotal || 0), 0);

  useEffect(() => {
    const finish = () => bootCheck();
    const unsub = useGarage.persist.onFinishHydration(finish);
    if (useGarage.persist.hasHydrated()) finish();
    return unsub;
  }, [bootCheck]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <AmbientDust />
      <GarageHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pt-4 pb-32 md:px-5 md:pt-4">
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
      <div className="fleet-dock">
        <button
          type="button"
          className="api-btn"
          onClick={() => {
            playClick();
            openApi();
          }}
        >
          <ApiGlyph className="size-4" />
          <span>API</span>
        </button>
        <FleetStat label="Цена автопарка" value={money(fleetOfficial)} />
        <FleetStat label="Заработали сегодня" value={money(earnedToday)} />
        <FleetStat label="Заработано всего" value={money(earnedAll)} />
      </div>
      <GarageOverlays />
      <GarageToasts />
    </div>
  );
}

function FleetStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="fleet-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function GarageApp() {
  const [ready, setReady] = useState(false);
  const onDone = useCallback(() => setReady(true), []);
  if (!ready) return <SplashScreen onDone={onDone} />;
  return <GarageShell />;
}
