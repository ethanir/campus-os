import { useState, useEffect } from "react";

const THEMES = ["dark", "light", "code"];
const THEME_LABELS = { dark: "Dark", light: "Light", code: "Code" };

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("campus-os-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("campus-os-theme", theme);
  }, [theme]);

  return { theme, setTheme, label: THEME_LABELS[theme], THEMES, THEME_LABELS };
}
