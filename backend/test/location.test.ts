import { describe, expect, test, beforeEach, afterAll } from "bun:test";
import { LocationService } from "../src/location/location.service";
import { AppError } from "../src/utils/AppError";
import prisma from "../src/prisma";

describe("Location Service (Integration)", () => {
  const locationService = new LocationService();
  const testUserId = "user-integration-test";

  // Cleanup
  const cleanup = async () => {
    try {
      await prisma.location.delete({ where: { userId: testUserId } });
    } catch (e) {
      // Ignore
    }
    // We might need to create a dummy user if foreign keys are enforced, 
    // but for now let's assume we can just test location logic if the schema allows it 
    // or we create a user.
    // Looking at schema: Location has `userId` which references User(id).
    // So we MUST create a user first.
  };

  beforeEach(async () => {
    await cleanup();
    // Create a dummy user for the test
    try {
        await prisma.user.create({
            data: {
                id: testUserId,
                username: "loc_test_user",
                phoneNumber: "8888888888",
                passwordHash: "hash"
            }
        });
    } catch(e) {
        // User might exist from previous failed run
    }
  });

  afterAll(async () => {
    await cleanup();
    try {
        await prisma.user.delete({ where: { id: testUserId } });
    } catch(e) {}
    await prisma.$disconnect();
  });

  test("setInitialLocation should validate landmass and store location", async () => {
    // Real coordinates for Bangalore
    const lat = 12.9716;
    const long = 77.5946;

    const result = await locationService.setInitialLocation(testUserId, lat, long);
    
    expect(result).not.toBeNull();
    expect(result.userId).toBe(testUserId);
    expect(result.dpi).toBeString();
    expect(result.humanReadableAddress).toBeString();
    expect(result.humanReadableAddress).toContain("Bengaluru"); // Nominatim usually returns this
  });

  test("setInitialLocation should throw if not on land (no address)", async () => {
    // Middle of Atlantic Ocean
    const lat = 0;
    const long = 0;

    try {
      await locationService.setInitialLocation(testUserId, lat, long);
      // If it doesn't throw, fail the test
      expect(true).toBe(false); 
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).message).toBe("Location not found or not on land");
      expect((e as AppError).statusCode).toBe(400);
    }
  });
  test("createLocationFromAddress should resolve address and store location", async () => {
    // Use a well-known landmark
    const address = "Taj Mahal, Agra";
    
    const result = await locationService.createLocationFromAddress(testUserId, address);
    
    expect(result).not.toBeNull();
    expect(result.userId).toBe(testUserId);
    expect(result.dpi).toBeString();
    // Coordinates for Taj Mahal are roughly 27.1751, 78.0421
    expect(result.latitude).toBeCloseTo(27.175, 1); 
    expect(result.longitude).toBeCloseTo(78.042, 1);
  });

  test("resolveDpi should decode DPI and return address", async () => {
    // Use the DPI we know or generate one. 
    // Let's generate one for Taj Mahal first to be sure, or just use coordinates.
    // Taj Mahal approx: 27.1751, 78.0421
    // Let's use the service to generate it first to get a valid DPI string for the test
    const { dpi } = await locationService.setInitialLocation(testUserId, 27.1751, 78.0421);
    
    const result = await locationService.resolveDpi(dpi);
    
    expect(result).not.toBeNull();
    expect(result.lat).toBeCloseTo(27.1751, 1);
    expect(result.long).toBeCloseTo(78.0421, 1);
    expect(result.address).toBeString();
    expect(result.address).toContain("Agra");
  });
});
