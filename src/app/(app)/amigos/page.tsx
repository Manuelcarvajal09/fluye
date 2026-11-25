import { requireProfile, settingsOf } from "@/lib/user";
import { ensureFriendCode, friendsOf, mailbox } from "@/lib/social";
import { walletOf } from "@/lib/economy";
import { lookOf, wearOf } from "@/lib/look";
import { localDay } from "@/lib/game";
import { Friends } from "@/components/amigos/Friends";

export const metadata = { title: "Amigos" };

export default async function FriendsPage() {
  const profile = await requireProfile();
  const [code, social, mail] = await Promise.all([ensureFriendCode(profile), friendsOf(profile), mailbox(profile)]);
  const look = lookOf(settingsOf(profile).look);
  return (
    <Friends
      code={code}
      friends={social.friends}
      ranking={social.ranking}
      inbox={mail.inbox}
      sent={mail.sent}
      me={{ species: look.species, wear: wearOf(look), name: look.name }}
      wallet={walletOf(profile)}
      today={localDay(profile.tz)}
    />
  );
}
