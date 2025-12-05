import { describe, expect, test } from "bun:test";
import { DpiService } from "../src/dpi/dpi.service";

describe("DPI Service", () => {
  const dpiService = new DpiService();

  test("should encode and decode correctly", () => {
    const lat = 12.9716;
    const long = 77.5946;
    
    const dpi = dpiService.encode(lat, long);
    expect(dpi).toStartWith("dpi_");
    
    const decoded = dpiService.decode(dpi);
    expect(decoded).not.toBeNull();
    expect(decoded!.lat).toBeCloseTo(lat, 4);
    expect(decoded!.long).toBeCloseTo(long, 4);
  });

  test("should be deterministic", () => {
    const lat = 40.7128;
    const long = -74.0060;
    
    const dpi1 = dpiService.encode(lat, long);
    const dpi2 = dpiService.encode(lat, long);
    
    expect(dpi1).toBe(dpi2);
  });

  test("should return null for invalid DPI", () => {
    const result = dpiService.decode("invalid_string");
    expect(result).toBeNull();
  });

  test("should return null for tampered DPI", () => {
    const lat = 10.0;
    const long = 20.0;
    const dpi = dpiService.encode(lat, long);
    const tampered = dpi.slice(0, -2) + "00"; // Change last chars
    
    const result = dpiService.decode(tampered);
    // Depending on padding/format, this might throw or return garbage/null.
    // Our service catches errors and returns null.
    expect(result).toBeNull();
  });
});
