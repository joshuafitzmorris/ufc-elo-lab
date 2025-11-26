import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params;

  try {
    const fighter = await prisma.fighter.findUnique({
      where: { id },
    });

    if (!fighter) {
      return NextResponse.json({ error: "Fighter not found" }, { status: 404 });
    }

    const calcRun = await prisma.calcRun.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!calcRun) {
      return NextResponse.json({ error: "No calculations yet" }, { status: 404 });
    }

    const snapshots = await prisma.ratingSnapshot.findMany({
      where: { fighterId: id, calcRunId: calcRun.id },
      include: {
        fight: {
          include: {
            fighterA: { select: { id: true, name: true } },
            fighterB: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const timeline = snapshots.map((snap) => ({
      id: snap.id,
      rating: snap.rating,
      createdAt: snap.createdAt,
      note: snap.note,
      fight: snap.fight
        ? {
            id: snap.fight.id,
            date: snap.fight.date,
            event: snap.fight.event,
            weightClass: snap.fight.weightClass,
            result: snap.fight.result,
            method: snap.fight.method,
            fighters: {
              a: snap.fight.fighterA,
              b: snap.fight.fighterB,
            },
          }
        : null,
    }));

    return NextResponse.json({ fighter, timeline });
  } catch (error) {
    console.error("Error fetching fighter timeline", error);
    return NextResponse.json(
      { error: "Unable to fetch fighter data" },
      { status: 500 }
    );
  }
}
