import Dexie, { type EntityTable } from "dexie";

export interface Note {
  id: string;
  title: string;
  content: string;
  strokes: StrokeData[];
  folderId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface StrokeData {
  points: [number, number, number][]; // [x, y, pressure]
  color: string;
  size: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  archived: 0 | 1;
  createdAt: number;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  category: string;
  sortOrder: number;
  createdAt: number;
}

export interface TimeEntry {
  id: string;
  project: string;
  category: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  note: string;
}

const db = new Dexie("iPadHubDB") as Dexie & {
  notes: EntityTable<Note, "id">;
  folders: EntityTable<Folder, "id">;
  habits: EntityTable<Habit, "id">;
  habitEntries: EntityTable<HabitEntry, "id">;
  todos: EntityTable<Todo, "id">;
  timeEntries: EntityTable<TimeEntry, "id">;
};

db.version(1).stores({
  notes: "id, folderId, updatedAt, *tags",
  folders: "id, parentId",
  habits: "id, archived",
  habitEntries: "id, [habitId+date]",
  todos: "id, completed, priority, dueDate, sortOrder",
  timeEntries: "id, project, startTime, endTime",
});

export { db };
