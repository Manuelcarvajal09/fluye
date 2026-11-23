import { apiProfile, settingsOf } from "@/lib/user";

/**
 * Recordatorio diario como evento de calendario (.ics) con alarma.
 * Funciona en iPhone, iPad, Mac y Windows sin notificaciones push ni servicios de pago.
 */
export async function GET(req: Request) {
  const profile = await apiProfile();
  if (!profile) return new Response("no autorizado", { status: 401 });
  const time = settingsOf(profile).reminder ?? "20:00";
  const [h, m] = time.split(":");
  const origin = new URL(req.url).origin;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fluye//ES",
    "BEGIN:VEVENT",
    `UID:fluye-daily-${profile.userId}@fluye`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${profile.tz}:20260101T${h}${m}00`,
    "DURATION:PT10M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Inglés con Fluye",
    `DESCRIPTION:Tu sesión diaria te espera: ${origin}/hoy`,
    `URL:${origin}/hoy`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Practica inglés",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'attachment; filename="fluye-recordatorio.ics"' } });
}
