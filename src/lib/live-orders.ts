// Server-side EventEmitter za narudžbe uživo (po tenantId-u).
type Listener = (payload: { type: string; orderId?: string; tableNumber?: number }) => void;

const g = globalThis as unknown as {
  orderListeners?: Map<string, Set<Listener>>;
};

if (!g.orderListeners) {
  g.orderListeners = new Map();
}

export function subscribeTenantOrders(tenantId: string, fn: Listener) {
  const map = g.orderListeners!;
  if (!map.has(tenantId)) map.set(tenantId, new Set());
  map.get(tenantId)!.add(fn);
  return () => {
    map.get(tenantId)?.delete(fn);
  };
}

export function emitTenantOrderEvent(
  tenantId: string,
  payload: { type: string; orderId?: string; tableNumber?: number }
) {
  const set = g.orderListeners?.get(tenantId);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch {
      // ignore closed stream
    }
  }
}
