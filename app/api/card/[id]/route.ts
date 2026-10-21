import { cancelCard, cardStatus } from "@/lib/game";

export async function GET(_req: Request, ctx: RouteContext<"/api/card/[id]">) {
  const { id } = await ctx.params;
  return Response.json(await cardStatus(id));
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/card/[id]">) {
  const { id } = await ctx.params;
  await cancelCard(id);
  return new Response(null, { status: 204 });
}
