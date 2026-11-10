interface Env {}
interface Context { request: Request; env: Env }
interface CloudflareRequest extends Request { cf?: { country?: string } }

export async function onRequest({ request }: Context): Promise<Response> {
  const country = String((request as CloudflareRequest).cf?.country || "").toUpperCase();
  return new Response(JSON.stringify({ country }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
