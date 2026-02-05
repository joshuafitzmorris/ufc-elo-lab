import CompareClient from "./CompareClient";
import { getLeaderboardRows } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const leaderboard = await getLeaderboardRows();
  return <CompareClient leaderboard={leaderboard} />;
}
