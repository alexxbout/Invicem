import { cleanName, findCard } from "@/lib/game";
import { COLOR_COUNT, SYMBOL_COUNT } from "@/lib/palette";

const inRange = (v: unknown, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v < max;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!inRange(body?.color, COLOR_COUNT)) return Response.json({ error: "bad color" }, { status: 400 });
  if (body.symbol !== undefined && !inRange(body.symbol, SYMBOL_COUNT)) {
    return Response.json({ error: "bad symbol" }, { status: 400 });
  }
  return Response.json(await findCard(body.color, body.symbol, cleanName(body.name)));
}
