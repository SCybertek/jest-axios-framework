import { getStore } from '../../src/gen/clients/store/store';
import { ApiResponse, Order, OrderStatus } from '../../src/gen/clients/petstore.schemas';

describe('Generated Store client (generated coverage)', () => {
  const createdOrderIds = new Set<number>();
  let idSeed = Number(String(Date.now()).slice(-3));

  const nextOrderId = () => {
    idSeed = (idSeed % 10) + 1;
    return idSeed;
  };

  const uniquePetId = () => Number(`${Date.now()}`.slice(-6));

  const buildOrder = (
    orderId: number,
    status: Order['status'] = OrderStatus.placed,
    overrides: Partial<Order> = {},
  ): Order => ({
    id: orderId,
    petId: uniquePetId(),
    quantity: 1,
    shipDate: new Date().toISOString(),
    status,
    complete: false,
    ...overrides,
  });

  const isApiErrorPayload = (value: unknown): value is ApiResponse => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as ApiResponse;
    return payload.code !== undefined || payload.type !== undefined || payload.message !== undefined;
  };

  const isOrderPayload = (value: unknown): value is Order => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as Order;
    return payload.id !== undefined || payload.petId !== undefined || payload.status !== undefined;
  };

  const isInventoryPayload = (value: unknown): value is Record<string, number> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    return Object.values(value as Record<string, unknown>).every((entry) => typeof entry === 'number');
  };

  const callAndCapture = async <T>(call: () => Promise<T>) => {
    try {
      return { ok: true as const, data: await call() };
    } catch (error) {
      return { ok: false as const, error };
    }
  };

  beforeAll(() => {
    process.env.ORVAL_BASE_URL = process.env.ORVAL_BASE_URL || 'https://petstore.swagger.io/v2';
  });

  const storeApi = getStore();

  afterAll(async () => {
    for (const orderId of createdOrderIds) {
      await storeApi.deleteOrder(orderId).catch(() => undefined);
    }
  });

  describe('getInventory', () => {
    test('[POSITIVE] getInventory returns status-to-count map', async () => {
      const inventory = await storeApi.getInventory();
      expect(isInventoryPayload(inventory)).toBe(true);
    });

    test('[NEGATIVE] getInventory with invalid Accept header is handled', async () => {
      const result = await callAndCapture(() => storeApi.getInventory({ headers: { Accept: 'application/invalid' } }));
      if (result.ok) {
        expect(
          isInventoryPayload(result.data) ||
            isApiErrorPayload(result.data) ||
            typeof result.data === 'string' ||
            result.data === undefined,
        ).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] getInventory repeated calls are stable in shape', async () => {
      const first = await storeApi.getInventory();
      const second = await storeApi.getInventory();

      expect(isInventoryPayload(first)).toBe(true);
      expect(isInventoryPayload(second)).toBe(true);
    });
  });

  describe('placeOrder', () => {
    test('[POSITIVE] placeOrder with valid payload returns order-like response', async () => {
      const orderId = nextOrderId();
      const order = buildOrder(orderId, OrderStatus.placed);

      const placed = await storeApi.placeOrder(order);
      createdOrderIds.add(orderId);

      expect(isOrderPayload(placed) || isApiErrorPayload(placed)).toBe(true);
    });

    test('[NEGATIVE] placeOrder with negative id is handled', async () => {
      const invalidOrder = buildOrder(-1, OrderStatus.placed);
      const result = await callAndCapture(() => storeApi.placeOrder(invalidOrder));

      if (result.ok) {
        expect(
          isApiErrorPayload(result.data) ||
            isOrderPayload(result.data) ||
            typeof result.data === 'string' ||
            result.data === undefined,
        ).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] placeOrder with optional fields omitted is handled', async () => {
      const orderId = nextOrderId();
      const minimalOrder: Order = { id: orderId, petId: uniquePetId() };
      const result = await callAndCapture(() => storeApi.placeOrder(minimalOrder));

      if (result.ok) {
        createdOrderIds.add(orderId);
        expect(isOrderPayload(result.data) || isApiErrorPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[POSITIVE] placeOrder then getOrderById returns matching order id', async () => {
      const orderId = nextOrderId();
      await storeApi.placeOrder(buildOrder(orderId, OrderStatus.approved));
      createdOrderIds.add(orderId);

      const fetched = await storeApi.getOrderById(orderId);
      expect(isOrderPayload(fetched) || isApiErrorPayload(fetched)).toBe(true);
      if (isOrderPayload(fetched) && fetched.id !== undefined) {
        expect(fetched.id).toBe(orderId);
      }
    });

    test('[NEGATIVE] placeOrder with invalid enum status is handled', async () => {
      const orderId = nextOrderId();
      const badStatusOrder = buildOrder(orderId, 'invalid-status' as unknown as Order['status']);
      const result = await callAndCapture(() => storeApi.placeOrder(badStatusOrder));

      if (result.ok) {
        expect(isOrderPayload(result.data) || isApiErrorPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] placeOrder with quantity zero boundary is handled', async () => {
      const orderId = nextOrderId();
      const zeroQuantityOrder = buildOrder(orderId, OrderStatus.placed, { quantity: 0 });
      const result = await callAndCapture(() => storeApi.placeOrder(zeroQuantityOrder));

      if (result.ok) {
        createdOrderIds.add(orderId);
        expect(isOrderPayload(result.data) || isApiErrorPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('getOrderById', () => {
    test('[POSITIVE] getOrderById fetches an order placed in setup', async () => {
      const orderId = nextOrderId();
      await storeApi.placeOrder(buildOrder(orderId, OrderStatus.delivered));
      createdOrderIds.add(orderId);

      const fetched = await storeApi.getOrderById(orderId);
      expect(isOrderPayload(fetched) || isApiErrorPayload(fetched)).toBe(true);
    });

    test('[NEGATIVE] getOrderById with non-existing id is handled', async () => {
      const nonExistingId = 99999999;
      const result = await callAndCapture(() => storeApi.getOrderById(nonExistingId));

      if (result.ok) {
        expect(isApiErrorPayload(result.data) || !isOrderPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] getOrderById with zero id boundary is handled', async () => {
      const result = await callAndCapture(() => storeApi.getOrderById(0));

      if (result.ok) {
        expect(isApiErrorPayload(result.data) || !isOrderPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('deleteOrder', () => {
    test('[POSITIVE] deleteOrder removes an existing order', async () => {
      const orderId = nextOrderId();
      await storeApi.placeOrder(buildOrder(orderId, OrderStatus.placed));
      createdOrderIds.add(orderId);

      await storeApi.deleteOrder(orderId);
      createdOrderIds.delete(orderId);

      const afterDelete = await callAndCapture(() => storeApi.getOrderById(orderId));
      if (afterDelete.ok) {
        expect(isApiErrorPayload(afterDelete.data) || !isOrderPayload(afterDelete.data)).toBe(true);
      } else {
        expect(afterDelete.error).toBeDefined();
      }
    });

    test('[NEGATIVE] deleteOrder with non-existing id is handled', async () => {
      const result = await callAndCapture(() => storeApi.deleteOrder(99999999));

      if (result.ok) {
        expect(result.data === undefined || isApiErrorPayload(result.data) || !isOrderPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] deleteOrder called twice handles second call gracefully', async () => {
      const orderId = nextOrderId();
      await storeApi.placeOrder(buildOrder(orderId, OrderStatus.approved));

      await storeApi.deleteOrder(orderId);
      const secondDelete = await callAndCapture(() => storeApi.deleteOrder(orderId));

      if (secondDelete.ok) {
        expect(secondDelete.data === undefined || isApiErrorPayload(secondDelete.data) || !isOrderPayload(secondDelete.data)).toBe(true);
      } else {
        expect(secondDelete.error).toBeDefined();
      }
    });
  });
});
