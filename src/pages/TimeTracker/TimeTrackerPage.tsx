import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { db } from "../../db.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import { useTimer, formatDuration } from "../../hooks/useTimer.ts";
import TimeSummary from "./TimeSummary.tsx";

const defaultProjects = ["Work", "Study", "Side Project", "Reading", "Exercise"];

export default function TimeTrackerPage() {
  const { isRunning, elapsed, activeEntry, start, stop } = useTimer();
  const [project, setProject] = useState(defaultProjects[0]);
  const [category, setCategory] = useState("Focus");

  const recentEntries = useLiveQuery(() =>
    db.timeEntries
      .orderBy("startTime")
      .reverse()
      .filter((e) => e.endTime !== null)
      .limit(10)
      .toArray()
  );

  async function deleteEntry(id: string) {
    await db.timeEntries.delete(id);
  }

  return (
    <div className="p-6 min-h-full flex flex-col gap-5">
      <h1 className="text-3xl font-bold">Time Tracker</h1>

      {/* Big Timer */}
      <Card className="text-center py-12 px-6">
        <div className="text-7xl font-mono font-bold tracking-wider mb-3">
          {formatDuration(elapsed)}
        </div>
        {activeEntry && (
          <div className="text-text-muted text-base mb-6">
            {activeEntry.project} — {activeEntry.category}
          </div>
        )}

        {!isRunning ? (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="bg-bg border border-border rounded-xl px-4 py-3 text-base text-text outline-none"
              >
                {defaultProjects.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="bg-bg border border-border rounded-xl px-4 py-3 text-base text-text outline-none selectable"
              />
            </div>
            <Button onClick={() => start(project, category)} className="w-full py-4 text-lg rounded-2xl">
              Start Timer
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={stop} className="px-16 py-4 text-lg rounded-2xl mx-auto">
            Stop
          </Button>
        )}
      </Card>

      {/* Charts */}
      <TimeSummary />

      {/* Recent entries */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold mb-3">Recent Entries</h2>
        <Card className="p-0 divide-y divide-border">
          {recentEntries?.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 px-5 py-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[15px]">{entry.project}</div>
                <div className="text-xs text-text-muted mt-0.5">
                  {entry.category} · {format(new Date(entry.startTime), "MMM d, h:mm a")}
                </div>
              </div>
              <span className="font-mono text-base">{formatDuration(entry.duration)}</span>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-coral transition-all text-lg p-1"
              >
                ✕
              </button>
            </div>
          ))}
          {recentEntries?.length === 0 && (
            <div className="text-center text-text-muted py-12 text-sm">No entries yet</div>
          )}
        </Card>
      </div>
    </div>
  );
}
