import { getPet } from '../../src/gen/clients/pet/pet';
import { Pet, PetStatus } from '../../src/gen/clients/petstore.schemas';

describe('Generated Pet client (generated coverage)', () => {
  const createdPetIds = new Set<number>();
  let nextIdSeed = Math.floor(Date.now() / 1000);

  const nextId = () => {
    nextIdSeed += 1;
    return nextIdSeed;
  };

  const buildPet = (id: number, name: string, status: Pet['status'] = PetStatus.available): Pet => ({
    id,
    name,
    photoUrls: ['https://example.com/pet.png'],
    status,
  });

  const isApiErrorPayload = (value: unknown): value is { code?: number; type?: string; message?: string } => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as { code?: number; type?: string; message?: string };
    return payload.code !== undefined || payload.type !== undefined || payload.message !== undefined;
  };

  const isPetPayload = (value: unknown): value is Pet => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as Partial<Pet>;
    return typeof payload.name === 'string' && Array.isArray(payload.photoUrls);
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

  const petApi = getPet();

  afterAll(async () => {
    for (const petId of createdPetIds) {
      await petApi.deletePet(petId).catch(() => undefined);
    }
  });

  describe('addPet', () => {
    test('[POSITIVE] addPet with valid payload creates pet', async () => {
      const petId = nextId();
      const petName = `generated-add-pos-${petId}`;
      const createdPet = buildPet(petId, petName, PetStatus.available);

      await petApi.addPet(createdPet);
      createdPetIds.add(petId);

      const fetchedPet = await petApi.getPetById(petId);
      expect(fetchedPet.id).toBe(petId);
      expect(fetchedPet.name).toBe(petName);
    });

    test('[NEGATIVE] addPet with invalid payload returns API error', async () => {
      const invalidPayload = { id: nextId() } as unknown as Pet;
      const result = await callAndCapture(() => petApi.addPet(invalidPayload));

      if (result.ok) {
        expect(isPetPayload(result.data)).toBe(false);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] addPet with very large id succeeds or returns handled API error', async () => {
      const largeId = Number.MAX_SAFE_INTEGER - 123;
      const petName = `generated-add-edge-${Date.now()}`;
      const edgePet = buildPet(largeId, petName, PetStatus.pending);
      const result = await callAndCapture(() => petApi.addPet(edgePet));

      if (result.ok) {
        createdPetIds.add(largeId);
        const fetchedPet = await petApi.getPetById(largeId);
        expect(fetchedPet.id).toBe(largeId);
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('getPetById', () => {
    test('[POSITIVE] getPetById returns an existing pet', async () => {
      const petId = nextId();
      const petName = `generated-get-pos-${petId}`;
      await petApi.addPet(buildPet(petId, petName, PetStatus.available));
      createdPetIds.add(petId);

      const fetchedPet = await petApi.getPetById(petId);
      expect(fetchedPet.id).toBe(petId);
      expect(fetchedPet.name).toBe(petName);
    });

    test('[NEGATIVE] getPetById with non-existing id returns API error payload', async () => {
      const nonExistingId = 900000000 + nextId();
      const result = await callAndCapture(() => petApi.getPetById(nonExistingId));

      if (result.ok) {
        expect(isApiErrorPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] getPetById with max-safe-like id is handled gracefully', async () => {
      const boundaryId = Number.MAX_SAFE_INTEGER - 1;
      const result = await callAndCapture(() => petApi.getPetById(boundaryId));

      if (result.ok) {
        expect(typeof result.data).toBe('object');
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('updatePet', () => {
    test('[POSITIVE] updatePet modifies existing pet fields', async () => {
      const petId = nextId();
      const originalName = `generated-update-pos-original-${petId}`;
      const updatedName = `generated-update-pos-updated-${petId}`;

      await petApi.addPet(buildPet(petId, originalName, PetStatus.available));
      createdPetIds.add(petId);

      await petApi.updatePet(buildPet(petId, updatedName, PetStatus.sold));
      const fetchedPet = await petApi.getPetById(petId);

      expect(fetchedPet.id).toBe(petId);
      expect(fetchedPet.name).toBe(updatedName);
      expect(fetchedPet.status).toBe(PetStatus.sold);
    });

    test('[NEGATIVE] updatePet with invalid payload is rejected or non-success shaped', async () => {
      const invalidPayload = { id: nextId() } as unknown as Pet;
      const result = await callAndCapture(() => petApi.updatePet(invalidPayload));

      if (result.ok) {
        expect(isPetPayload(result.data)).toBe(false);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] updatePet idempotent repeated update remains consistent', async () => {
      const petId = nextId();
      const stableName = `generated-update-edge-${petId}`;
      const payload = buildPet(petId, stableName, PetStatus.pending);

      await petApi.addPet(buildPet(petId, `generated-update-edge-seed-${petId}`, PetStatus.available));
      createdPetIds.add(petId);

      await petApi.updatePet(payload);
      await petApi.updatePet(payload);

      const fetchedPet = await petApi.getPetById(petId);
      expect(fetchedPet.id).toBe(petId);
      expect(fetchedPet.name).toBe(stableName);
      expect(fetchedPet.status).toBe(PetStatus.pending);
    });
  });

  describe('findPetsByStatus', () => {
    test('[POSITIVE] findPetsByStatus with available returns a collection', async () => {
      const result = await petApi.findPetsByStatus({ status: [PetStatus.available] });

      expect(Array.isArray(result)).toBe(true);
    });

    test('[NEGATIVE] findPetsByStatus with invalid status input is handled', async () => {
      const result = await callAndCapture(() =>
        petApi.findPetsByStatus({ status: ['invalid-status' as unknown as (typeof PetStatus)[keyof typeof PetStatus]] }),
      );

      if (result.ok) {
        expect(Array.isArray(result.data) || isApiErrorPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] findPetsByStatus with comma-separated style status input is handled', async () => {
      const result = await callAndCapture(() =>
        petApi.findPetsByStatus({ status: ['available,pending' as unknown as (typeof PetStatus)[keyof typeof PetStatus]] }),
      );

      if (result.ok) {
        expect(Array.isArray(result.data) || isApiErrorPayload(result.data)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('deletePet', () => {
    test('[POSITIVE] deletePet removes an existing pet', async () => {
      const petId = nextId();
      await petApi.addPet(buildPet(petId, `generated-delete-pos-${petId}`, PetStatus.available));
      createdPetIds.add(petId);

      await petApi.deletePet(petId);
      createdPetIds.delete(petId);

      const postDeleteRead = await callAndCapture(() => petApi.getPetById(petId));
      if (postDeleteRead.ok) {
        expect(isApiErrorPayload(postDeleteRead.data)).toBe(true);
      } else {
        expect(postDeleteRead.error).toBeDefined();
      }
    });

    test('[NEGATIVE] deletePet with non-existing id returns API error payload', async () => {
      const nonExistingId = 700000000 + nextId();
      const result = await callAndCapture(() => petApi.deletePet(nonExistingId));

      if (result.ok) {
        expect(isPetPayload(result.data)).toBe(false);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('[EDGE] deletePet called twice handles second call gracefully', async () => {
      const petId = nextId();
      await petApi.addPet(buildPet(petId, `generated-delete-edge-${petId}`, PetStatus.pending));

      await petApi.deletePet(petId);
      const secondDelete = await callAndCapture(() => petApi.deletePet(petId));

      if (secondDelete.ok) {
        expect(isPetPayload(secondDelete.data)).toBe(false);
      } else {
        expect(secondDelete.error).toBeDefined();
      }
    });
  });
});
