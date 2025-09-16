// client/src/guide/teacher/TeacherLayoutV2.tsx
import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { DensityProvider, useDensity } from "./density";
import { ToastHost } from "../../ui2/Toast";
import { useFlags } from "../../config/flags";
import { useTheme } from "../../theme/useTheme";
import { validateThemeContrast } from "../../theme/contrast";
import { Ic } from "../../ui2/icons";
import IconButton from "../../ui2/IconButton";

type TeacherLayoutV2Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  renderContent: () => ReactNode;
};

// Single source of truth for tabs shown in the sidebar.
// IMPORTANT: use the same keys your router/TabContentV2 understand.
// (Legacy alias “dev” should be normalized to “debug” in the router, not here.)
const TAB_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; devOnly?: boolean }
> = {
  referrals: { label: "Referrals", icon: <Ic.profile className="list-icon" /> },
  overview: { label: "Overview", icon: <Ic.star className="list-icon" /> },
  quickstart: { label: "Quick Start", icon: <Ic.star className="list-icon" /> },
  timeline: { label: "Timeline", icon: <Ic.calendar className="list-icon" /> },
  assignments: { label: "Assignments", icon: <Ic.doc className="list-icon" /> },
  content: { label: "Content", icon: <Ic.book className="list-icon" /> },
  roster: { label: "Roster", icon: <Ic.profile className="list-icon" /> },
  classes: { label: "Classes", icon: <Ic.layers className="list-icon" /> },
  dashboard: { label: "Dashboard", icon: <Ic.star className="list-icon" /> },
  privacy: { label: "Privacy", icon: <Ic.shield className="list-icon" /> },
  appearance: { label: "Appearance", icon: <Ic.palette className="list-icon" /> },
  consent: { label: "Consent", icon: <Ic.shield className="list-icon" /> },
  audit: { label: "Audit", icon: <Ic.doc className="list-icon" /> },
  studio: { label: "Studio", icon: <Ic.book className="list-icon" />, devOnly: true },
  pilot: { label: "Pilot", icon: <Ic.star className="list-icon" /> },
  funnel: { label: "Funnel", icon: <Ic.filter className="list-icon" /> },
  qa: { label: "QA", icon: <Ic.star className="list-icon" />, devOnly: true },
  reports: { label: "Reports", icon: <Ic.doc className="list-icon" /> },
  debug: { label: "Debug", icon: <Ic.palette className="list-icon" /> }, // <- use 'debug' (not 'dev')
};

export function TeacherLayoutV2({
  activeTab,
  onTabChange,
  onClose,
  renderContent,
}: TeacherLayoutV2Props) {
  const { teacherThemeV2 } = useFlags();
  const { theme } = useTheme();

  // Apply theme contrast validation when the v2 theme is enabled
  useEffect(() => {
    if (teacherThemeV2) validateThemeContrast();
  }, [teacherThemeV2, theme]);

  const themeClasses = teacherThemeV2
    ? "bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-base))]"
    : "bg-black bg-opacity-50";

  const sidebarClasses = teacherThemeV2
    ? "w-64 bg-[rgb(var(--bg-card))] border-r border-[rgb(var(--border))] flex flex-col"
    : "w-64 bg-white border-r border-gray-200 flex flex-col";

  // Hide devOnly tabs outside development
  const isDev = import.meta.env.DEV === true;

  const tabsToRender = Object.entries(TAB_CONFIG).filter(
    ([, cfg]) => !cfg.devOnly || isDev
  );

  return (
    <DensityProvider>
      <div className={`fixed inset-0 z-50 flex ${themeClasses}`}>
        {/* Sidebar */}
        <aside className={sidebarClasses}>
          <div
            className={`p-4 flex items-center justify-between ${
              teacherThemeV2 ? "border-b border-[rgb(var(--border))]" : "border-b border-gray-200"
            }`}
          >
            <h2
              id="tp-title"
              className={`text-lg font-semibold ${teacherThemeV2 ? "text-[rgb(var(--fg-base))]" : ""}`}
            >
              Teacher Panel
            </h2>
            <IconButton
              onClick={onClose}
              aria-label="Close teacher panel"
              className={teacherThemeV2 ? "" : "hover:bg-gray-100"}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          <nav
            className="flex-1 p-2 overflow-y-auto"
            tabIndex={0}
            aria-label="Teacher navigation"
            role="tablist"
          >
            <div className="space-y-1">
              {tabsToRender.map(([tabKey, cfg]) => {
                const isActive = activeTab === tabKey;
                const className =
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left focus-ring transition-colors " +
                  (teacherThemeV2
                    ? isActive
                      ? "bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-base))] border-l-2 border-[rgb(var(--brand-500))]"
                      : "text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-elev))]/60 hover:text-[rgb(var(--fg-base))]"
                    : isActive
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900");

                return (
                  <button
                    key={tabKey}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tab-${tabKey}`}
                    id={`tabbtn-${tabKey}`}
                    onClick={() => onTabChange(tabKey)}
                    className={className}
                    data-testid={`tab-${tabKey}`}
                  >
                    {cfg.icon}
                    <span className="truncate text-sm font-medium">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            className={`p-3 ${teacherThemeV2 ? "border-t border-[rgb(var(--border))]" : "border-t border-gray-200"}`}
          >
            <DensityToggle />
          </div>
        </aside>

        {/* Main content */}
        <section
          role="region"
          aria-labelledby="tp-title"
          className={`flex-1 overflow-auto ${teacherThemeV2 ? "bg-[rgb(var(--bg-elev))]" : "bg-gray-50"}`}
        >
          <ToastHost>
            <div className="p-6">
              {/* Let the router decide what to show for the current tab */}
              <section
                id={`tab-${activeTab}`}
                role="region"
                aria-labelledby={`tabbtn-${activeTab}`}
              >
                {renderContent()}
              </section>
            </div>
          </ToastHost>
        </section>
      </div>
    </DensityProvider>
  );
}

function DensityToggle() {
  const { density, toggle } = useDensity();
  const { teacherThemeV2 } = useFlags();

  return (
    <button
      onClick={toggle}
      className={`w-full px-3 py-2 text-sm rounded-lg focus-ring ${
        teacherThemeV2
          ? "border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-base))] text-[rgb(var(--fg-muted))]"
          : "border border-gray-300 hover:bg-white"
      }`}
    >
      {density === "cozy" ? "Switch to Compact" : "Switch to Cozy"}
    </button>
  );
}