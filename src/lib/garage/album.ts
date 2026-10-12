const DB_NAME = "dark-rent";
const STORE = "album";

export function albumKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function fileStem(key: string) {
  const stem = key.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return (stem || "car").slice(0, 80);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function albumGet(name: string): Promise<string | null> {
  const key = albumKey(name);
  if (!key || typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(typeof req.result === "string" ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function writeNamedFile(key: string, dataUrl: string) {
  const storage = navigator.storage as StorageManager & {
    getDirectory?: () => Promise<FileSystemDirectoryHandle>;
  };
  if (!storage.getDirectory) return;
  const root = await storage.getDirectory();
  const dir = await root.getDirectoryHandle("dark-rent-album", { create: true });
  const handle = await dir.getFileHandle(`${fileStem(key)}.png`, { create: true });
  const blob = await (await fetch(dataUrl)).blob();
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function albumPut(name: string, dataUrl: string) {
  const key = albumKey(name);
  if (!key || !dataUrl || typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(dataUrl, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* private mode */
  }
  try {
    await writeNamedFile(key, dataUrl);
  } catch {
    /* file album is best-effort; lookup still uses the local store */
  }
}
