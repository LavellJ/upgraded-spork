import React from "react";
let Link: any = (props: any) => <a {...props} />;

try {
  // Dynamically require to avoid build errors if router isn't present
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Link = require("wouter").Link || Link;
} catch {}

import DayPartChip from "./DayPartChip";
import { SimpleThemeToggle } from "./ThemeToggle";

export default function TopNav() {
  return (
    <nav
      data-testid="top-nav"
      className="w-full flex items-center justify-between gap-4 p-3 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm"
    >
      <div className="flex items-center gap-6">
        <Link data-testid="nav-brand" to="/" href="/">
          LearnOz
        </Link>
        <Link data-testid="nav-quest" to="/island" href="/island">
          Quest Island
        </Link>
        <Link data-testid="nav-progress" to="/progress" href="/progress">
          Progress
        </Link>
        <Link data-testid="nav-settings" to="/settings" href="/settings">
          Settings
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <SimpleThemeToggle />
        <DayPartChip />
      </div>
    </nav>
  );
}
