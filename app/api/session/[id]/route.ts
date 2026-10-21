import { sessionView } from "@/lib/game";

export async function GET(_req: Request, ctx: RouteContext<"/api/session/[id]">) {
  const { id } = await ctx.params;
  const view = await sessionView(id);
  return view ? Response.json(view) : Response.json({ error: "gone" }, { status: 404 });
}
