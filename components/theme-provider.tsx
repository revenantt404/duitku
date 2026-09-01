"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const Ctx = createContext<{ theme: Theme; resolved: Resolved; toggle: () => void; setTheme: (t: Theme) => void }>({
  theme: "system",
  resolved: "light",
  toggle() {},
  setTheme() {},
});

function getSystem(): Resolved {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      if (saved === "light" || saved === "dark" || saved === "system") setThemeState(saved);
      else if (localStorage.getItem("duitku_theme")) {
        const legacy = localStorage.getItem("duitku_theme") as Theme | null;
        if (legacy === "light" || legacy === "dark") setThemeState(legacy);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const r: Resolved = theme === "system" ? getSystem() : theme;
    setResolved(r);
    const root = document.documentElement;
    root.classList.toggle("dark", r === "dark");
    root.style.colorScheme = r;
    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("duitku_theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") {
        const r: Resolved = mql.matches ? "dark" : "light";
        setResolved(r);
        document.documentElement.classList.toggle("dark", r === "dark");
        document.documentElement.style.colorScheme = r;
      }
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }
  function toggle() {
    setThemeState((prev) => {
      const cur: Resolved = prev === "system" ? getSystem() : prev;
      return cur === "dark" ? "light" : "dark";
    });
  }

  return <Ctx.Provider value={{ theme, resolved, toggle, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
