import { drawCard, GameFullError } from "@/lib/game";

export async function POST() {
  try {
    return Response.json(await drawCard());
  } catch (e) {
    if (e instanceof GameFullError) return Response.json({ error: "full" }, { status: 503 });
    throw e;
  }
}
