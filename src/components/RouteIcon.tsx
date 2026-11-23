import { Briefcase, Bus, Coffee, Cpu, Gift, HeartPulse, Home, Microscope, Plane, ShoppingCart, Snowflake, Tv, Users, Video, MapPin, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  gift: Gift, snowflake: Snowflake, plane: Plane, coffee: Coffee, "shopping-cart": ShoppingCart, cart: ShoppingCart, home: Home, house: Home,
  "heart-pulse": HeartPulse, stethoscope: HeartPulse, bus: Bus, "train-front": Bus, briefcase: Briefcase, video: Video, users: Users, tv: Tv,
  cpu: Cpu, workflow: Cpu, "flask-conical": Microscope, microscope: Microscope, leaf: Microscope,
};

/** Icono de una ruta por nombre (lucide); si no se reconoce, un pin. */
export function RouteIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const I = ICONS[name] ?? MapPin;
  return <I size={size} aria-hidden className={className} />;
}
