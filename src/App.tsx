import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell.tsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.tsx";
import TodosPage from "./pages/Todos/TodosPage.tsx";
import HabitsPage from "./pages/Habits/HabitsPage.tsx";
import TimeTrackerPage from "./pages/TimeTracker/TimeTrackerPage.tsx";
import NotesPage from "./pages/Notes/NotesPage.tsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/time" element={<TimeTrackerPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
