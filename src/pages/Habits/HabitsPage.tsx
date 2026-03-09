import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, subDays, startOfDay } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Modal from "../../components/ui/Modal.tsx";
import HabitStats from "./HabitStats.tsx";

const accentColors = [
  { name: "Blue", value: "bg-accent-blue" },
  { name: "Green", value: "bg-accent-green" },
  { name: "Coral", value: "bg-accent-coral" },
  { name: "Purple", value: "bg-accent-purple" },
  { name: "Yellow", value: "bg-accent-yellow" },
];

const habitIcons = ["💪", "📚", "🧘", "💧", "🏃", "✍️", "🎵", "💤"];

export default function HabitsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showStats, setShowStats] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(accentColors[0].value);
  const [icon, setIcon] = useState(habitIcons[0]);

  const today = format(new Date(), "yyyy-MM-dd");
  const last7Days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(startOfDay(new Date()), 6 - i), "yyyy-MM-dd")
  );

  const habits = useLiveQuery(() => db.habits.where("archived").equals(0).toArray());

  const entries = useLiveQuery(async () => {
    if (!habits) return {};
    const map: Record<string, Set<string>> = {};
    for (const h of habits) {
      const hEntries = await db.habitEntries
        .where("[habitId+date]")
        .between([h.id, last7Days[0]], [h.id, last7Days[6] + "\uffff"])
        .toArray();
      map[h.id] = new Set(hEntries.filter((e) => e.completed).map((e) => e.date));
    }
    return map;
  }, [habits]);

  async function addHabit() {
    if (!name.trim()) return;
    await db.habits.add({
      id: uuidv4(),
      name: name.trim(),
      color,
      icon,
      archived: 0,
      createdAt: Date.now(),
    });
    setName("");
    setShowAdd(false);
  }

  async function toggleEntry(habitId: string, date: string) {
    const existing = await db.habitEntries.where("[habitId+date]").equals([habitId, date]).first();
    if (existing) {
      await db.habitEntries.update(existing.id, { completed: !existing.completed });
    } else {
      await db.habitEntries.add({
        id: uuidv4(),
        habitId,
        date,
        completed: true,
      });
    }
  }

  async function deleteHabit(id: string) {
    await db.habits.update(id, { archived: 1 });
  }

  return (
    <div className="p-6 min-h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-bold">Habits</h1>
          <p className="text-sm text-text-muted mt-0.5">{habits?.length ?? 0} active habits</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="px-6 py-2.5 text-base">+ Add Habit</Button>
      </div>

      {/* Day column headers */}
      <div className="grid grid-cols-7 gap-2 mb-4 px-2">
        {last7Days.map((d) => (
          <div key={d} className="text-center">
            <div className="text-xs text-text-muted">{format(new Date(d + "T12:00:00"), "EEE")}</div>
            <div className={`text-lg font-semibold ${d === today ? "text-accent-blue" : "text-text"}`}>
              {format(new Date(d + "T12:00:00"), "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Habit rows */}
      <div className="flex-1 space-y-3">
        {habits?.map((habit) => {
          const completedCount = last7Days.filter((d) => entries?.[habit.id]?.has(d)).length;
          return (
            <Card key={habit.id} className="p-4">
              {/* Habit name row */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{habit.icon}</span>
                <span className="font-semibold text-base flex-1">{habit.name}</span>
                <span className="text-xs text-text-muted">{completedCount}/7 this week</span>
                <button
                  onClick={() => setShowStats(habit.id)}
                  className="text-xs text-accent-blue px-2 py-1"
                >
                  Stats
                </button>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="text-text-muted hover:text-accent-coral text-sm px-1"
                >
                  ✕
                </button>
              </div>

              {/* 7-day grid of large checkboxes */}
              <div className="grid grid-cols-7 gap-2">
                {last7Days.map((d) => {
                  const done = entries?.[habit.id]?.has(d) ?? false;
                  return (
                    <button
                      key={d}
                      onClick={() => toggleEntry(habit.id, d)}
                      className={`aspect-square rounded-2xl transition-all flex items-center justify-center text-xl ${
                        done
                          ? `${habit.color} text-white shadow-lg`
                          : "bg-bg border-2 border-border hover:border-text-muted"
                      }`}
                    >
                      {done ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {habits?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted">
            <div className="text-6xl mb-4">◉</div>
            <div className="text-lg">No habits tracked yet</div>
            <div className="text-sm mt-1">Build consistency one day at a time</div>
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Habit">
        <div className="space-y-5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
            placeholder="Habit name"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-base text-text placeholder:text-text-muted outline-none focus:border-accent-blue selectable"
          />

          <div>
            <label className="text-sm text-text-muted block mb-2">Icon</label>
            <div className="flex gap-3">
              {habitIcons.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`w-12 h-12 rounded-xl text-xl flex items-center justify-center transition-colors ${
                    icon === i ? "bg-accent-blue/20 ring-2 ring-accent-blue" : "bg-surface-hover"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted block mb-2">Color</label>
            <div className="flex gap-3">
              {accentColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-12 h-12 rounded-xl ${c.value} transition-all ${
                    color === c.value ? "ring-2 ring-white scale-110" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)} className="px-6">Cancel</Button>
            <Button onClick={addHabit} disabled={!name.trim()} className="px-6">Add</Button>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal open={!!showStats} onClose={() => setShowStats(null)} title="Habit Stats">
        {showStats && <HabitStats habitId={showStats} />}
      </Modal>
    </div>
  );
}
