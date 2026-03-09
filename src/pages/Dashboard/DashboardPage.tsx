import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { format, subDays, startOfDay } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { db, type Habit } from "../../db.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Checkbox from "../../components/ui/Checkbox.tsx";
import { useTimer, formatDuration } from "../../hooks/useTimer.ts";
import { useState } from "react";

export default function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { isRunning, elapsed, activeEntry, start, stop } = useTimer();
  const [timerProject, setTimerProject] = useState("Work");

  // ── Data queries ──

  const allTodos = useLiveQuery(
    () => db.todos.orderBy("sortOrder").toArray()
  );

  const habits = useLiveQuery(() =>
    db.habits.where("archived").equals(0).toArray()
  );

  const recentNotes = useLiveQuery(() =>
    db.notes.orderBy("updatedAt").reverse().limit(4).toArray()
  );

  const timeChartData = useLiveQuery(async () => {
    const sevenAgo = subDays(startOfDay(new Date()), 6).getTime();
    const entries = await db.timeEntries
      .where("startTime")
      .above(sevenAgo)
      .filter((e) => e.endTime !== null)
      .toArray();

    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(startOfDay(new Date()), 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayEntries = entries.filter(
        (e) => format(new Date(e.startTime), "yyyy-MM-dd") === dateStr
      );
      const totalMs = dayEntries.reduce((sum, e) => sum + e.duration, 0);
      return {
        day: format(date, "EEE"),
        hours: Math.round((totalMs / 3600000) * 10) / 10,
      };
    });
  });

  const habitChartData = useLiveQuery(async () => {
    if (!habits || habits.length === 0) return [];
    const days = Array.from({ length: 7 }, (_, i) =>
      format(subDays(startOfDay(new Date()), 6 - i), "yyyy-MM-dd")
    );
    const result = [];
    for (const d of days) {
      let done = 0;
      for (const h of habits) {
        const entry = await db.habitEntries.where("[habitId+date]").equals([h.id, d]).first();
        if (entry?.completed) done++;
      }
      result.push({ day: format(new Date(d + "T12:00:00"), "EEE"), done, total: habits.length });
    }
    return result;
  }, [habits]);

  // ── Derived ──

  const activeTodos = allTodos?.filter((t) => !t.completed) ?? [];
  const completedTodos = allTodos?.filter((t) => t.completed) ?? [];

  // Group active todos: overdue first, then today, then upcoming, then no date
  const overdueTodos = activeTodos.filter((t) => t.dueDate && t.dueDate < today);
  const todayTodos = activeTodos.filter((t) => t.dueDate === today);
  const upcomingTodos = activeTodos.filter((t) => t.dueDate && t.dueDate > today);
  const undatedTodos = activeTodos.filter((t) => !t.dueDate);

  // ── Handlers ──

  async function toggleTodo(id: string, completed: boolean) {
    await db.todos.update(id, { completed });
  }

  async function toggleHabit(habitId: string) {
    const existing = await db.habitEntries.where("[habitId+date]").equals([habitId, today]).first();
    if (existing) {
      await db.habitEntries.update(existing.id, { completed: !existing.completed });
    } else {
      await db.habitEntries.add({ id: uuidv4(), habitId, date: today, completed: true });
    }
  }

  // ── Render helpers ──

  function renderTodoRow(todo: typeof activeTodos[number], completed = false) {
    return (
      <div key={todo.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-hover transition-colors">
        <Checkbox
          checked={completed}
          onChange={() => toggleTodo(todo.id, !completed)}
        />
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          todo.priority === "high" ? "bg-accent-coral" :
          todo.priority === "medium" ? "bg-accent-yellow" : "bg-accent-green"
        }`} />
        <span className={`flex-1 text-[15px] ${completed ? "line-through text-text-muted" : ""}`}>
          {todo.title}
        </span>
        {todo.dueDate && !completed && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            todo.dueDate < today ? "bg-accent-coral/15 text-accent-coral" :
            todo.dueDate === today ? "bg-accent-blue/15 text-accent-blue" : "text-text-muted"
          }`}>
            {todo.dueDate < today ? "Overdue" : todo.dueDate === today ? "Today" : format(new Date(todo.dueDate), "MMM d")}
          </span>
        )}
        {todo.category && (
          <span className="text-xs text-accent-purple bg-accent-purple/10 px-2 py-0.5 rounded-full">
            {todo.category}
          </span>
        )}
      </div>
    );
  }

  function renderTodoSection(label: string, todos: typeof activeTodos, accent = "text-text-muted") {
    if (todos.length === 0) return null;
    return (
      <>
        <div className={`text-xs font-semibold uppercase tracking-wider ${accent} mt-4 mb-1 px-3`}>
          {label} ({todos.length})
        </div>
        {todos.map((t) => renderTodoRow(t))}
      </>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-text-muted mt-0.5">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <div className="text-2xl font-bold text-accent-blue">{activeTodos.length}</div>
            <div className="text-[10px] text-text-muted">open</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-right">
            <div className="text-2xl font-bold text-accent-green">{completedTodos.length}</div>
            <div className="text-[10px] text-text-muted">done</div>
          </div>
        </div>
      </div>

      {/* ── TASKS — primary section ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Tasks</h2>
          <Link to="/todos" className="text-sm text-accent-blue">Manage</Link>
        </div>

        {activeTodos.length > 0 ? (
          <div>
            {renderTodoSection("Overdue", overdueTodos, "text-accent-coral")}
            {renderTodoSection("Today", todayTodos, "text-accent-blue")}
            {renderTodoSection("Upcoming", upcomingTodos)}
            {renderTodoSection("No Date", undatedTodos)}
          </div>
        ) : (
          <div className="text-center text-text-muted py-8 text-sm">All caught up!</div>
        )}

        {completedTodos.length > 0 && (
          <>
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-5 mb-1 px-3">
              Completed ({completedTodos.length})
            </div>
            {completedTodos.slice(0, 5).map((t) => renderTodoRow(t, true))}
            {completedTodos.length > 5 && (
              <Link to="/todos" className="block text-xs text-accent-blue px-3 pt-2">
                +{completedTodos.length - 5} more
              </Link>
            )}
          </>
        )}
      </Card>

      {/* ── Habits (interactive) ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today's Habits</h2>
          <Link to="/habits" className="text-sm text-accent-blue">View all</Link>
        </div>
        {habits && habits.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {habits.map((habit) => (
              <DashboardHabitRow key={habit.id} habit={habit} date={today} onToggle={toggleHabit} />
            ))}
          </div>
        ) : (
          <div className="text-center text-text-muted py-6 text-sm">
            No habits yet — <Link to="/habits" className="text-accent-blue">add one</Link>
          </div>
        )}
      </Card>

      {/* ── Charts ── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Time Tracked</h2>
            <Link to="/time" className="text-xs text-accent-blue">Details</Link>
          </div>
          <div className="h-40">
            {timeChartData && timeChartData.some((d) => d.hours > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeChartData}>
                  <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12 }}
                    labelStyle={{ color: "#e5e5e5" }}
                    formatter={(value: number) => [`${value}h`, "Hours"]}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-text-muted">
                No time entries this week
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Habit Completions</h2>
            <Link to="/habits" className="text-xs text-accent-blue">Details</Link>
          </div>
          <div className="h-40">
            {habitChartData && habitChartData.length > 0 && habitChartData.some((d) => d.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={habitChartData}>
                  <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} width={24} domain={[0, (d: number) => Math.max(d, 1)]} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12 }}
                    labelStyle={{ color: "#e5e5e5" }}
                    formatter={(value: number) => [value, "Done"]}
                  />
                  <Bar dataKey="done" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-text-muted">
                No habit data yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Timer — compact row ── */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-accent-coral animate-pulse" : "bg-border"}`} />
            <span className="text-2xl font-mono font-bold">{formatDuration(elapsed)}</span>
            {activeEntry && (
              <span className="text-sm text-text-muted">{activeEntry.project}</span>
            )}
          </div>
          {!isRunning ? (
            <div className="flex items-center gap-2">
              <select
                value={timerProject}
                onChange={(e) => setTimerProject(e.target.value)}
                className="bg-bg border border-border rounded-xl px-3 py-1.5 text-sm text-text outline-none"
              >
                {["Work", "Study", "Side Project", "Reading", "Exercise"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Button size="sm" onClick={() => start(timerProject, "Focus")}>Start</Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={stop}>Stop</Button>
          )}
        </div>
      </Card>

      {/* ── Recent notes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Notes</h2>
          <Link to="/notes" className="text-sm text-accent-blue">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {recentNotes?.map((note) => (
            <Link to="/notes" key={note.id}>
              <Card hover className="p-4 h-28 flex flex-col">
                <h3 className="font-medium text-sm mb-1 truncate">{note.title}</h3>
                <p className="text-xs text-text-muted line-clamp-2 flex-1">
                  {note.content || (note.strokes.length > 0 ? `${note.strokes.length} drawing strokes` : "Empty note")}
                </p>
                <div className="text-[10px] text-text-muted mt-1">
                  {format(new Date(note.updatedAt), "MMM d, h:mm a")}
                </div>
              </Card>
            </Link>
          ))}
          {(!recentNotes || recentNotes.length === 0) && (
            <div className="col-span-2 text-center text-text-muted py-8 text-sm">No notes yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: interactive habit row ──

function DashboardHabitRow({ habit, date, onToggle }: { habit: Habit; date: string; onToggle: (id: string) => void }) {
  const entry = useLiveQuery(
    () => db.habitEntries.where("[habitId+date]").equals([habit.id, date]).first(),
    [habit.id, date]
  );
  const done = entry?.completed ?? false;

  return (
    <button
      onClick={() => onToggle(habit.id)}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left ${
        done
          ? `${habit.color}/10 border-2 border-current`
          : "bg-bg border-2 border-border hover:border-text-muted"
      }`}
      style={done ? { color: "inherit" } : undefined}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
        done ? `${habit.color} text-white shadow-md` : "bg-surface-hover"
      }`}>
        {done ? "✓" : habit.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${done ? "text-text" : ""}`}>{habit.name}</div>
        <div className="text-xs text-text-muted">{done ? "Done!" : "Tap to complete"}</div>
      </div>
    </button>
  );
}
