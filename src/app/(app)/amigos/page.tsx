import { requireProfile, settingsOf } from "@/lib/user";
import { ensureFriendCode, friendsOf, mailbox } from "@/lib/social";
import { walletOf } from "@/lib/economy";
import { lookOf, wearOf } from "@/lib/look";
import { localDay } from "@/lib/game";
import { Friends } from "@/components/amigos/Friends";
import { leagueView, markLeagueSeen } from "@/lib/league";

export const metadata = { title: "Amigos" };

export default async function FriendsPage() {
  const profile = await requireProfile();
  const [code, social, mail] = await Promise.all([ensureFriendCode(profile), friendsOf(profile), mailbox(profile)]);
  const look = lookOf(settingsOf(profile).look);
  const league = await leagueView(profile, new Set(social.friends.filter((f) => f.status === "accepted").map((f) => f.id)));
  // Al ver la liga, el aviso del resultado de la semana pasada ya no se repite en Hoy.
  if (league.last && !league.last.seen) await markLeagueSeen(profile.userId, league.last.week);
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
      league={league}
    />
  );
}
