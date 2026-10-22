import { cleanName, drawCard, GameFullError } from "@/lib/game";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  try {
    return Response.json(await drawCard(cleanName(body?.name)));
  } catch (e) {
    if (e instanceof GameFullError) return Response.json({ error: "full" }, { status: 503 });
    throw e;
  }
}
