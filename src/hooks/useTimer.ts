import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.ts";

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);

  // Find active entry (endTime === null)
  const activeEntry = useLiveQuery(
    () => db.timeEntries.filter((e) => e.endTime === null).first()
  );

  const isRunning = !!activeEntry;

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }

    const update = () => setElapsed(Date.now() - activeEntry.startTime);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const start = useCallback(async (project: string, category: string) => {
    // Stop any existing
    const existing = await db.timeEntries.filter((e) => e.endTime === null).toArray();
    for (const e of existing) {
      await db.timeEntries.update(e.id, {
        endTime: Date.now(),
        duration: Date.now() - e.startTime,
      });
    }

    await db.timeEntries.add({
      id: uuidv4(),
      project,
      category,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      note: "",
    });
  }, []);

  const stop = useCallback(async () => {
    if (!activeEntry) return;
    const now = Date.now();
    await db.timeEntries.update(activeEntry.id, {
      endTime: now,
      duration: now - activeEntry.startTime,
    });
  }, [activeEntry]);

  return { isRunning, elapsed, activeEntry, start, stop };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
