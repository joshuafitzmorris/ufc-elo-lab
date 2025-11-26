import { NextRequest, NextResponse } from "next/server";
import {
  ingestAndRecompute,
  ingestPayloadSchema,
} from "@/lib/elo/ingest";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = ingestPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const result = await ingestAndRecompute(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ingest error", error);
    return NextResponse.json(
      { error: "Failed to ingest fights" },
      { status: 500 }
    );
  }
}
