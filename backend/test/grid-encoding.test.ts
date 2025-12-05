import { describe, expect, test } from "bun:test";
import { DigiPin } from "../src/dpi/grid-encoding";

describe("DIGIPIN Encoding", () => {
  test("should encode and decode correctly using DIGIPIN logic", () => {
    // Bangalore coordinates (within India bounds)
    const lat = 12.9716;
    const long = 77.5946;
    
    const code = DigiPin.encode(lat, long);
    expect(code).toBeString();
    expect(code.length).toBeGreaterThan(0);
    // DIGIPIN format has hyphens: XXX-XXX-XXXX or similar depending on level
    // The implementation adds hyphens at level 3 and 6. 
    // 10 chars + 2 hyphens = 12 chars?
    // Let's check the code:
    // if (level === 3 || level === 6) digiPin += '-';
    // It loops 10 times.
    
    const decoded = DigiPin.decode(code);
    expect(decoded.lat).toBeCloseTo(lat, 3); // Precision might vary
    expect(decoded.long).toBeCloseTo(long, 3);
  });

  test("should throw error for coordinates out of India bounds", () => {
    expect(() => {
      DigiPin.encode(0, 0); // Null Island is out of bounds
    }).toThrow("Latitude out of range (India only)");
  });
});
