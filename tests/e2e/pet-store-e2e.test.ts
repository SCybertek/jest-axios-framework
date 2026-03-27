import { getPet } from '../../src/gen/clients/pet/pet';
import { getStore } from '../../src/gen/clients/store/store';
import { Pet, PetStatus } from '../../src/gen/clients/petstore.schemas';

describe('E2E: Pet -> Store happy path', () => {
  beforeAll(() => {
    process.env.ORVAL_BASE_URL = process.env.ORVAL_BASE_URL || 'https://petstore.swagger.io/v2';
  });

  const petApi = getPet();
  const storeApi = getStore();
  const createdPetIds = new Set<number>();
  const createdOrderIds = new Set<number>();

  const uniqueId = () => Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

  const buildPet = (id: number, name: string): Pet => ({
    id,
    name,
    photoUrls: ['https://example.com/pet.png'],
    status: PetStatus.available,
  });

  afterAll(async () => {
    for (const orderId of createdOrderIds) {
      await storeApi.deleteOrder(orderId).catch(() => undefined);
    }
    for (const petId of createdPetIds) {
      await petApi.deletePet(petId).catch(() => undefined);
    }
  });

  test('creates a pet, places an order for it, verifies order, and cleans up', async () => {
    const petId = uniqueId();
    const petName = `e2e-pet-${petId}`;

    // Create pet
    await petApi.addPet(buildPet(petId, petName));
    createdPetIds.add(petId);

    // Read back pet
    const fetchedPet = await petApi.getPetById(petId);
    expect(fetchedPet.id).toBe(petId);
    expect(fetchedPet.name).toBe(petName);

    // Place order for pet
    const orderId = Math.abs((petId % 1000) || 1);
    const placed = await storeApi.placeOrder({ id: orderId, petId, quantity: 1, status: 'placed' });
    createdOrderIds.add(orderId as number);

    // Fetch order
    const fetchedOrder = await storeApi.getOrderById(orderId as number);
    if (fetchedOrder && typeof fetchedOrder === 'object' && 'id' in fetchedOrder) {
      expect((fetchedOrder as any).id).toBe(orderId);
      expect((fetchedOrder as any).petId).toBe(petId);
    } else {
      // If API returns error-shaped payload, still consider the test failed but provide useful failure
      throw new Error('Unexpected order fetch response shape');
    }

    // Cleanup done in afterAll
  }, 20000);
});
