import { useEffect, useState } from "react";
import { freshProgress, parseProgress, type Progress } from "./progress";

export const STORAGE_KEY = "glingo.spotlight.progress.v1";

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => {
    try { return parseProgress(localStorage.getItem(STORAGE_KEY)); }
    catch { return freshProgress(); }
  });
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageUnavailable(false);
    } catch { setStorageUnavailable(true); }
  }, [progress]);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setProgress(parseProgress(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { progress, setProgress, storageUnavailable };
}
