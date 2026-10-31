import { getSession } from "@/lib/auth";
import { subscribeTenantOrders } from "@/lib/live-orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || !s.tid) {
    return new Response("Unauthorized", { status: 401 });
  }
  const tenantId = s.tid;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "CONNECTED" });

      const unsub = subscribeTenantOrders(tenantId, (payload) => {
        send(payload);
      });

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 20000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsub();
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
