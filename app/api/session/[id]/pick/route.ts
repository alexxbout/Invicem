import { pickQuestion } from "@/lib/game";

export async function POST(req: Request, ctx: RouteContext<"/api/session/[id]/pick">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (typeof body?.step !== "number" || typeof body?.slot !== "number") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const view = await pickQuestion(id, body.step, body.slot);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
