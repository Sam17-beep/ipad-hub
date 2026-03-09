import { useLiveQuery } from "dexie-react-hooks";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { db } from "../../db.ts";
import Card from "../../components/ui/Card.tsx";
import { formatDuration } from "../../hooks/useTimer.ts";

export default function TimeSummary() {
  const entries = useLiveQuery(() =>
    db.timeEntries
      .where("startTime")
      .above(subDays(startOfDay(new Date()), 6).getTime())
      .filter((e) => e.endTime !== null)
      .toArray()
  );

  if (!entries) return null;

  // Group by day
  const last7Days = Array.from({ length: 7 }, (_, i) => {
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

  // Group by project
  const byProject: Record<string, number> = {};
  for (const e of entries) {
    byProject[e.project] = (byProject[e.project] || 0) + e.duration;
  }

  const totalWeek = entries.reduce((s, e) => s + e.duration, 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Last 7 Days</h3>
          <span className="text-xs text-text-muted">{formatDuration(totalWeek)} total</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12 }}
                labelStyle={{ color: "#e5e5e5" }}
                formatter={(value: number) => [`${value}h`, "Hours"]}
              />
              <Bar dataKey="hours" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-medium mb-4">By Project</h3>
        <div className="space-y-3">
          {Object.entries(byProject)
            .sort(([, a], [, b]) => b - a)
            .map(([project, ms]) => {
              const pct = totalWeek > 0 ? (ms / totalWeek) * 100 : 0;
              return (
                <div key={project}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{project}</span>
                    <span className="text-text-muted">{formatDuration(ms)}</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-green rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          {Object.keys(byProject).length === 0 && (
            <div className="text-sm text-text-muted text-center py-8">No entries this week</div>
          )}
        </div>
      </Card>
    </div>
  );
}
