import { getPet } from '../../src/gen/clients/pet/pet';

describe('Generated Pet client (integration)', () => {
  const petApi = getPet();
  const petId = Math.floor(Date.now() / 1000);
  const petName = `copilot-pet-${petId}`;

  beforeAll(() => {
    process.env.ORVAL_BASE_URL = process.env.ORVAL_BASE_URL || 'https://petstore.swagger.io/v2';
  });

test('creates and reads a pet by id', async () => {
    await petApi.addPet({
      id: petId,
      name: petName,
      photoUrls: ['https://example.com/pet.png'],
      status: 'available',
    });

    const createdPet = await petApi.getPetById(petId);
    expect(createdPet.id).toBe(petId);
    expect(createdPet.name).toBe(petName);
  });

  afterAll(async () => {
    await petApi.deletePet(petId).catch(() => undefined);
  });
});