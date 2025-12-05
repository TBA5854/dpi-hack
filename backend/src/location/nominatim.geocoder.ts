import { AppError } from '../utils/AppError'

interface Geocoder {
  addressToCoordinates(address: string): Promise<{ lat: number; long: number } | null>;
  coordinatesToAddress(lat: number, long: number): Promise<string | null>;
}

export class NominatimGeocoder implements Geocoder {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent = 'ArchDPI/1.0';

  async addressToCoordinates(address: string): Promise<{ lat: number; long: number } | null> {
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json() as any[];
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          long: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async coordinatesToAddress(lat: number, long: number): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/reverse?lat=${lat}&lon=${long}&format=json`;
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent }
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      if (data && data.display_name) {
        return data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}
