import { useLiveQuery } from "dexie-react-hooks";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { db } from "../../db.ts";

interface HabitStatsProps {
  habitId: string;
}

export default function HabitStats({ habitId }: HabitStatsProps) {
  const habit = useLiveQuery(() => db.habits.get(habitId), [habitId]);

  const entries = useLiveQuery(async () => {
    return db.habitEntries
      .where("[habitId+date]")
      .between([habitId, "0"], [habitId, "\uffff"])
      .filter((e) => e.completed)
      .toArray();
  }, [habitId]);

  if (!habit || !entries) return null;

  // Calculate streak
  let streak = 0;
  const today = startOfDay(new Date());
  for (let i = 0; ; i++) {
    const dateStr = format(subDays(today, i), "yyyy-MM-dd");
    if (entries.some((e) => e.date === dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  // Best streak
  let bestStreak = 0;
  let currentRun = 0;
  const sortedDates = entries.map((e) => e.date).sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentRun = 1;
    } else {
      const prev = new Date(sortedDates[i - 1] + "T12:00:00");
      const curr = new Date(sortedDates[i] + "T12:00:00");
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      currentRun = diffDays === 1 ? currentRun + 1 : 1;
    }
    bestStreak = Math.max(bestStreak, currentRun);
  }

  // Last 30 days chart data
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const dateStr = format(subDays(today, 29 - i), "yyyy-MM-dd");
    return {
      date: format(subDays(today, 29 - i), "M/d"),
      done: entries.some((e) => e.date === dateStr) ? 1 : 0,
    };
  });

  const totalCompleted = entries.length;
  const completionRate = Math.round((last30.filter((d) => d.done).length / 30) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-bg rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-accent-blue">{streak}</div>
          <div className="text-xs text-text-muted mt-1">Current Streak</div>
        </div>
        <div className="bg-bg rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-accent-purple">{bestStreak}</div>
          <div className="text-xs text-text-muted mt-1">Best Streak</div>
        </div>
        <div className="bg-bg rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-accent-green">{totalCompleted}</div>
          <div className="text-xs text-text-muted mt-1">Total Days</div>
        </div>
        <div className="bg-bg rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-accent-coral">{completionRate}%</div>
          <div className="text-xs text-text-muted mt-1">30-Day Rate</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Last 30 Days</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last30}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#888", fontSize: 10 }}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12 }}
                labelStyle={{ color: "#e5e5e5" }}
              />
              <Bar dataKey="done" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
