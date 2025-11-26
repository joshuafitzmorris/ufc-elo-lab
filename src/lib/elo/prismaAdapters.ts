import { Method, Result } from "@prisma/client";

export function toResult(winner: string) {
  switch (winner) {
    case "fighterA":
      return Result.FIGHTER_A;
    case "fighterB":
      return Result.FIGHTER_B;
    case "draw":
      return Result.DRAW;
    default:
      return Result.NO_CONTEST;
  }
}

export function toMethod(method?: string | null) {
  if (!method) return Method.OTHER;
  const normalized = method.toLowerCase();
  if (normalized.includes("tko")) return Method.TKO;
  if (normalized.includes("ko")) return Method.KO;
  if (normalized.includes("sub")) return Method.SUBMISSION;
  if (normalized.includes("dec")) return Method.DECISION;
  return Method.OTHER;
}

export function getWinnerId(
  winner: string,
  fighterAId: string,
  fighterBId: string
): string | null {
  if (winner === "fighterA") return fighterAId;
  if (winner === "fighterB") return fighterBId;
  return null;
}
