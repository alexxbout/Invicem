import { sealWord } from "@/lib/game";

export async function POST(req: Request, ctx: RouteContext<"/api/session/[id]/word">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (body?.role !== "a" && body?.role !== "b") return Response.json({ error: "bad request" }, { status: 400 });
  const view = await sealWord(id, body.role, body.word);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
