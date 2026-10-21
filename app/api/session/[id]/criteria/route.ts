import { setCriteria } from "@/lib/game";
import { parseCriteria } from "@/lib/questions";

export async function POST(req: Request, ctx: RouteContext<"/api/session/[id]/criteria">) {
  const { id } = await ctx.params;
  const criteria = parseCriteria(await req.json().catch(() => null));
  if (!criteria) return Response.json({ error: "bad criteria" }, { status: 400 });
  const view = await setCriteria(id, criteria);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
