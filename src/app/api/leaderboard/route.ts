import { NextResponse } from "next/server";
import { getLeaderboardRows } from "@/lib/leaderboard";

export async function GET() {
  try {
    const leaderboard = await getLeaderboardRows();
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard", error);
    return NextResponse.json(
      { error: "Unable to fetch leaderboard" },
      { status: 500 }
    );
  }
}
