import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distApp = join(root, "dist-electron");
const staging = join("/tmp", "Garazh-portable");
const outDir = join(root, "artifacts");
const zipPath = join(outDir, "Garazh.zip");
const seven = "/tmp/7zz";
const sourceRuntime = "/tmp/garazh-win/Garazh";

function run(cmd, args, cwd = root) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed`);
  }
}

if (!existsSync(distApp)) {
  throw new Error("dist-electron is missing — build the renderer first");
}
if (!existsSync(sourceRuntime)) {
  throw new Error("Original Windows runtime is missing");
}

rmSync(staging, { recursive: true, force: true });
const dest = join(staging, "Garazh");
mkdirSync(dest, { recursive: true });

cpSync(sourceRuntime, dest, {
  recursive: true,
  filter: (src) => {
    const rel = src.slice(sourceRuntime.length).replaceAll("\\", "/");
    if (rel === "/data" || rel.startsWith("/data/")) return false;
    if (rel === "/resources/app" || rel.startsWith("/resources/app/")) return false;
    return true;
  },
});

const appDir = join(dest, "resources", "app");
mkdirSync(appDir, { recursive: true });
cpSync(distApp, appDir, { recursive: true });
cpSync(join(root, "electron", "main.cjs"), join(appDir, "main.cjs"));
cpSync(join(root, "electron", "preload.cjs"), join(appDir, "preload.cjs"));
cpSync(join(root, "electron", "package.json"), join(appDir, "package.json"));
cpSync(join(root, "public", "favicon.svg"), join(appDir, "favicon.svg"));

writeFileSync(
  join(dest, "Инструкция.txt"),
  [
    "Гараж — учёт аренды авто для GTA 5 RP Majestic (Россия Онлайн)",
    "",
    "Запуск: откройте Garazh.exe в этой папке.",
    "Нужны все файлы рядом с программой, не только exe.",
    "",
    "Резервная копия:",
    "1. «Выгрузить лог» сохраняет все карточки, фото, историю и заработок.",
    "2. «Загрузить авто» восстанавливает гараж из этого файла.",
    "",
    "Папка data создаётся рядом с программой и хранит текущую базу.",
    "Перед удалением или обновлением сначала выгрузите лог.",
    "",
  ].join("\r\n"),
);

mkdirSync(outDir, { recursive: true });
rmSync(zipPath, { force: true });
run(seven, ["a", "-tzip", "-mx=7", zipPath, "Garazh"], staging);
console.log(`Wrote ${zipPath}`);
