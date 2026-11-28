/** Pestañas de Ajustes (compartido entre servidor y cliente). */
export const SETTINGS_TABS = [
  { id: "estudio", label: "Estudio" },
  { id: "voz", label: "Voz" },
  { id: "experiencia", label: "Experiencia" },
  { id: "datos", label: "Cuenta" },
] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];
