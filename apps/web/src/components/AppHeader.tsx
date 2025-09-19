import { NavLink } from "react-router-dom";
import { AboutDialog } from "./AboutDialog";

const navItems = [
  { to: "/", label: "Canvas" },
  { to: "/bisync", label: "Bi-Directional SVG" },
];

export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
          <svg aria-hidden width="28" height="28">
            <use href="#rr-mark" />
          </svg>
        </span>
        <span className="font-semibold tracking-wide text-primary">RoughRefine</span>
      </div>
      <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `transition-colors hover:text-foreground ${isActive ? "text-foreground" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <AboutDialog />
    </header>
  );
}
