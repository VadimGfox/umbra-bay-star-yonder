export function DarkRentLogo({
  size = "md",
  animated = true,
  stack = false,
}: {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  stack?: boolean;
}) {
  const scale = size === "lg" ? "text-[2.6rem] md:text-[3.4rem]" : size === "sm" ? "text-[1.05rem]" : "text-[1.35rem]";
  const rent = size === "lg" ? "text-[1.85rem] md:text-[2.35rem]" : size === "sm" ? "text-[0.92rem]" : "text-[1.12rem]";
  if (stack) {
    return (
      <div className="flex flex-col items-center leading-none" aria-label="Dark Rent">
        <span className="text-[4.4rem] font-extrabold tracking-[0.16em] text-fg md:text-[6.2rem]">DARK</span>
        <span className="mt-2 text-[1.35rem] font-medium tracking-[0.46em] text-[#8d8d98] md:text-[1.7rem]">RENT</span>
      </div>
    );
  }
  return (
    <div
      className={`logo-mark inline-flex items-baseline gap-[0.12em] leading-none ${animated ? "logo-breathe" : ""}`}
      aria-label="Dark Rent"
    >
      <span className={`font-extrabold tracking-[0.08em] text-fg ${scale}`}>DARK</span>
      <span className={`font-semibold tracking-[0.04em] text-muted ${rent}`}>Rent</span>
    </div>
  );
}
