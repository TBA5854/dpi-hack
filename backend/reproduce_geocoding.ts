import { NominatimGeocoder } from './src/location/nominatim.geocoder';

async function test() {
  const address = 'Namagiripettai, Rasipuram, Tamil Nadu';
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  console.log('Fetching:', url);
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ArchDPI/1.0' }
    });
    
    console.log('Status:', response.status);
    console.log('StatusText:', response.statusText);
    
    const text = await response.text();
    console.log('Body:', text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

test();
