/** Propietarios: ids de Clerk en la variable privada OWNER_USER_IDS (coma). Nunca "el primero que se registre". */
export function isOwner(userId: string | null | undefined) {
  if (!userId) return false;
  return (process.env.OWNER_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(userId);
}
