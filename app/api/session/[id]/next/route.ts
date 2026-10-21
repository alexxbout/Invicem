import { nextQuestion } from "@/lib/game";

export async function POST(req: Request, ctx: RouteContext<"/api/session/[id]/next">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (typeof body?.idx !== "number") return Response.json({ error: "bad idx" }, { status: 400 });
  const view = await nextQuestion(id, body.idx);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
