import prisma from '../prisma'
import { DigiPin } from '../dpi/grid-encoding'
import { NominatimGeocoder } from './nominatim.geocoder'
import { AppError } from '../utils/AppError'

// Real Implementations
const geocoder = new NominatimGeocoder();

// For Landmass, we will use the Geocoder result.
// If Nominatim returns a valid address, it's likely on land or a valid location.
// If it returns null or "Ocean", we reject.
// This is a practical "real" implementation without a massive shapefile.

export class LocationService {
  async setInitialLocation(userId: string, lat: number, long: number) {
    // 1. Validate Landmass & Get Address via Geocoder
    // This serves both purposes: validation and address retrieval.
    const address = await geocoder.coordinatesToAddress(lat, long);
    
    // Strict check: If no address found, assume invalid/ocean (or service down, but we fail safe)
    if (!address) {
      throw new AppError('Location not found or not on land', 400);
    }

    // 2. Generate DPI (DIGIPIN style)
    const dpi = DigiPin.encode(lat, long);

    // 3. Store
    return prisma.location.upsert({
      where: { userId },
      update: {
        dpi,
        latitude: lat,
        longitude: long,
        humanReadableAddress: address,
      },
      create: {
        userId,
        dpi,
        latitude: lat,
        longitude: long,
        humanReadableAddress: address,
      },
    });
  }

  async createLocationFromAddress(userId: string, addressQuery: string) {
    // 1. Resolve Address to Coordinates
    const coords = await geocoder.addressToCoordinates(addressQuery);
    if (!coords) {
      throw new AppError('Address not found', 404);
    }

    // 2. Reuse setInitialLocation to validate, encode, and store
    return this.setInitialLocation(userId, coords.lat, coords.long);
  }

  async getLocation(userId: string) {
    return prisma.location.findUnique({ where: { userId } });
  }

  async resolveDpi(dpi: string) {
    // 1. Decode
    let coords;
    try {
      coords = DigiPin.decode(dpi);
    } catch (e) {
      throw new AppError('Invalid DPI format', 400);
    }

    // 2. Validate Landmass / Get Address
    const address = await geocoder.coordinatesToAddress(coords.lat, coords.long);
    if (!address) throw new AppError('Invalid DPI location', 400);

    return { ...coords, address };
  }
}

export const locationService = new LocationService();
