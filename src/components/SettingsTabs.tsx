"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { SETTINGS_TABS, type SettingsTab } from "@/lib/settings-tabs";
export type { SettingsTab };

/** Pestañas de Ajustes. Las secciones no se desmontan al cambiar de pestaña (solo se ocultan), así nada sin guardar se pierde. */
const Ctx = createContext<SettingsTab>("estudio");
export const useSettingsTab = () => useContext(Ctx);

export function SettingsTabs({ initial, children }: { initial: SettingsTab; children: ReactNode }) {
  const [tab, setTab] = useState<SettingsTab>(initial);
  // La pestaña queda en la dirección (?tab=…) para poder volver a ella o enlazarla, sin recargar.
  useEffect(() => {
    const u = new URL(location.href);
    if (u.searchParams.get("tab") === tab) return;
    u.searchParams.set("tab", tab);
    history.replaceState(history.state, "", u);
  }, [tab]);
  return (
    <Ctx.Provider value={tab}>
      <div role="tablist" aria-label="Secciones de ajustes" className="sticky top-0 z-20 -mx-4 flex gap-2 overflow-x-auto bg-bg/90 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="ajustes-panel"
            onClick={() => setTab(t.id)}
            className={`chip-btn shrink-0 whitespace-nowrap ${tab === t.id ? "is-on" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="ajustes-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="flex flex-col gap-5">
        {children}
      </div>
    </Ctx.Provider>
  );
}
