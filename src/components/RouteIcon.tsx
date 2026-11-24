import type { ComponentType } from "react";
import { IcoBriefcase, IcoBus, IcoCart, IcoChat, IcoCoffee, IcoFlow, IcoGift, IcoHome, IcoMap, IcoMedic, IcoMicroscope, IcoPeople, IcoPlane, IcoSnow, IcoTv } from "./Icons";

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  gift: IcoGift, snowflake: IcoSnow, plane: IcoPlane, coffee: IcoCoffee, "shopping-cart": IcoCart, cart: IcoCart, home: IcoHome, house: IcoHome,
  "heart-pulse": IcoMedic, stethoscope: IcoMedic, bus: IcoBus, "train-front": IcoBus, briefcase: IcoBriefcase, video: IcoTv, users: IcoPeople, tv: IcoTv,
  "message-circle": IcoChat, cpu: IcoFlow, workflow: IcoFlow, "flask-conical": IcoMicroscope, microscope: IcoMicroscope, leaf: IcoMicroscope,
};

/** Icono ilustrado de una misión por nombre; si no se reconoce, un mapa. Se dibuja un poco más grande que un icono de línea. */
export function RouteIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const I = ICONS[name] ?? IcoMap;
  return <I size={Math.round(size * 1.3)} className={className} />;
}
