import { requireProfile, settingsOf } from "@/lib/user";
import { ownedItems } from "@/lib/rewards";
import { lookOf, shopCatalog } from "@/lib/look";
import { Shop } from "@/components/Shop";

export const metadata = { title: "Tienda" };

export default async function ShopPage() {
  const profile = await requireProfile();
  const owned = await ownedItems(profile.userId);
  return <Shop catalog={shopCatalog()} owned={[...owned]} gems={profile.gems} freezes={profile.freezes} look={lookOf(settingsOf(profile).look)} />;
}
