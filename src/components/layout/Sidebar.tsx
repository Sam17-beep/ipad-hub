import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", icon: "⊞", label: "Home" },
  { to: "/todos", icon: "☑", label: "Todos" },
  { to: "/habits", icon: "◉", label: "Habits" },
  { to: "/time", icon: "⏱", label: "Time" },
  { to: "/notes", icon: "✎", label: "Notes" },
];

export default function TabBar() {
  return (
    <nav className="flex items-stretch bg-surface border-t border-border px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
              isActive
                ? "text-accent-blue"
                : "text-text-muted"
            }`
          }
        >
          <span className="text-2xl leading-none">{item.icon}</span>
          <span className="text-[11px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
