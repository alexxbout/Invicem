import { continueEvening } from "@/lib/game";

export async function POST(req: Request, ctx: RouteContext<"/api/session/[id]/continue">) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (typeof body?.step !== "number") return Response.json({ error: "bad step" }, { status: 400 });
  const view = await continueEvening(id, body.step);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
