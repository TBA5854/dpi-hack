import crypto from 'crypto';

// Configuration - in a real app, these should be in environment variables
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.DPI_SECRET_KEY || '12345678901234567890123456789012'; // 32 bytes
const IV_LENGTH = 16;

export class DpiService {
  // We use a fixed IV or a deterministic way to generate IV from the data 
  // to ensure the same lat/long always results in the same DPI.
  // However, standard CBC requires random IV for security. 
  // For this specific requirement "deterministic (same lat/long -> same DPI)", 
  // we will derive the IV from the data itself or use a fixed IV.
  // Using a fixed IV reduces security (ECB-like patterns) but satisfies the requirement.
  // A better approach for "deterministic" encryption is SIV mode, but let's stick to standard node crypto with a derived IV.
  
  private getKey(): Buffer {
    return Buffer.from(SECRET_KEY, 'utf-8');
  }

  /**
   * Encodes latitude and longitude into a DPI string.
   * Format: "lat,long" -> Encrypted -> Hex
   */
  encode(lat: number, long: number): string {
    const text = `${lat.toFixed(6)},${long.toFixed(6)}`;
    const key = this.getKey();
    
    // For determinism, we can use a zero IV or a hash of the key.
    // Let's use a zero IV for simplicity and absolute determinism as requested.
    const iv = Buffer.alloc(IV_LENGTH, 0); 

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prefix to make it look like a token
    return `dpi_${encrypted}`;
  }

  /**
   * Decodes a DPI string back to latitude and longitude.
   */
  decode(dpi: string): { lat: number; long: number } | null {
    try {
      if (!dpi.startsWith('dpi_')) return null;
      
      const encryptedText = dpi.slice(4);
      const key = this.getKey();
      const iv = Buffer.alloc(IV_LENGTH, 0);

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const parts = decrypted.split(',');
      if (parts.length !== 2) return null;
      
      const [latStr, longStr] = parts;
      if (!latStr || !longStr) return null;

      const lat = parseFloat(latStr);
      const long = parseFloat(longStr);

      if (isNaN(lat) || isNaN(long)) return null;

      return { lat, long };
      return null;
    } catch (error) {
      // Silent failure for invalid/tampered DPIs
      return null;
    }
  }
}

export const dpiService = new DpiService();
