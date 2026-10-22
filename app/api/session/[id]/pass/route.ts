import { JOKER_KINDS, passQuestion, type JokerKind } from "@/lib/game";

export async function POST(req: Request, ctx: RouteContext<"/api/session/[id]/pass">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const kind = body?.kind as JokerKind;
  if (typeof body?.step !== "number" || (body?.role !== "a" && body?.role !== "b") || !JOKER_KINDS.includes(kind)) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const view = await passQuestion(id, body.step, body.role, kind);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
