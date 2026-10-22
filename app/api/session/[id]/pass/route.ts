import { passQuestion } from "@/lib/game";

export async function POST(req: Request, ctx: RouteContext<"/api/session/[id]/pass">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (typeof body?.step !== "number" || (body?.role !== "a" && body?.role !== "b")) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const view = await passQuestion(id, body.step, body.role);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
