import { splitPlate } from "@/lib/garage/utils";

export function RussianPlate({ plate, region }: { plate: string; region: string }) {
  const parts = splitPlate(plate);
  const letter = parts.letter || "·";
  const digits = (parts.digits || "···").padEnd(3, "·").slice(0, 3);
  const letters = (parts.letters || "··").padEnd(2, "·").slice(0, 2);
  const code = region || "··";

  return (
    <div className="ru-plate" aria-label={`Госномер ${plate} ${region}`}>
      <div className="ru-plate-main">
        <span className="ru-plate-letter">{letter}</span>
        <span className="ru-plate-digits">
          {digits.split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </span>
        <span className="ru-plate-letters">
          {letters.split("").map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </span>
      </div>
      <div className="ru-plate-split" aria-hidden="true" />
      <div className="ru-plate-region">
        <span className="ru-plate-code">{code}</span>
        <span className="ru-plate-rus">RUS</span>
        <span className="ru-plate-flag" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}
