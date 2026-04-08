import { useState, useEffect } from "react";

const THEMES = ["dark", "light", "neon"];
const THEME_LABELS = { dark: "Dark", light: "Light", neon: "Neon" };

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("campus-os-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("campus-os-theme", theme);
  }, [theme]);

  const cycle = () => {
    const i = THEMES.indexOf(theme);
    setTheme(THEMES[(i + 1) % THEMES.length]);
  };

  return { theme, setTheme, cycle, label: THEME_LABELS[theme], THEMES, THEME_LABELS };
}
