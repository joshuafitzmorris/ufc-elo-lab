import type { Metadata } from "next";
import CompareClient from "./CompareClient";
import { getLeaderboardRows } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fighter Comparison",
  description:
    "Head-to-head UFC fighter comparison tool. Compare Elo ratings, performance metrics, fight statistics, and expected matchup outcomes. Analyze style matchups with both classic and performance-weighted ratings.",
  openGraph: {
    title: "Fighter Comparison | UFC Elo Lab",
    description:
      "Compare UFC fighters side-by-side with dual Elo ratings, performance metrics, and predicted matchup outcomes.",
  },
};

export default async function ComparePage() {
  const leaderboard = await getLeaderboardRows();
  return <CompareClient leaderboard={leaderboard} />;
}
