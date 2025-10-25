import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TotalTimeframe = "today" | "week" | "month" | "all-time";

interface Settings {
  totalTimeframe: TotalTimeframe;
  dailyGoal: number | null;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("streetwyze-settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    return { totalTimeframe: "today", dailyGoal: null };
  });

  useEffect(() => {
    // Save to localStorage whenever settings change
    localStorage.setItem("streetwyze-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
