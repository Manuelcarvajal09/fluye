"use client";
import { Moon, Sun } from "lucide-react";
import { applyTheme } from "./Prefs";

/** Cambia entre claro y oscuro al instante y lo guarda en el perfil (misma preferencia que en Ajustes). */
export function ThemeToggle() {
  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    applyTheme(next);
    void fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: { theme: next } }) }).catch(() => {});
  };
  return (
    <button type="button" onClick={toggle} className="theme-toggle" aria-label="Cambiar entre tema claro y oscuro">
      <Moon size={20} aria-hidden className="dark:hidden" />
      <Sun size={20} aria-hidden className="hidden dark:block" />
    </button>
  );
}
