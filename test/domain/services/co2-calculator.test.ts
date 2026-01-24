import { Co2Calculator } from "../../../src/domain/services/co2-calculator.service";

describe("Co2Calculator", () => {
  describe("calculateBatchTotal", () => {
    it("calculates correct total carbon for given kWh and grid factor", () => {
      const result = Co2Calculator.calculateBatchTotal(1000, 0.5);
      expect(result).toBe(500);
    });

    it("returns 0 when kWh is 0", () => {
      const result = Co2Calculator.calculateBatchTotal(0, 0.5);
      expect(result).toBe(0);
    });

    it("handles floating point precision correctly", () => {
      const result = Co2Calculator.calculateBatchTotal(123.45, 0.4321);
      expect(result).toBeCloseTo(53.3, 1);
    });
  });

  describe("calculateProductionShare", () => {
    it("returns full carbon when order takes entire batch", () => {
      const result = Co2Calculator.calculateProductionShare(100, 100, 500);
      expect(result).toBe(500);
    });

    it("returns 0 when order quantity is 0", () => {
      const result = Co2Calculator.calculateProductionShare(0, 100, 500);
      expect(result).toBe(0);
    });
  });

  describe("calculateTransport", () => {
    it("calculates correct transport CO₂ with default emission factor", () => {
      const result = Co2Calculator.calculateTransport(2, 500);
      expect(result).toBe(105);
    });

    it("returns 0 when distance or weight is 0", () => {
      const result = Co2Calculator.calculateTransport(0, 500);
      expect(result).toBe(0);
    });
  });

  describe("calculateTotal", () => {
    it("sums production and transport CO₂ correctly", () => {
      const result = Co2Calculator.calculateTotal(300, 105);
      expect(result).toBe(405);
    });

    it("handles zero values", () => {
      const result = Co2Calculator.calculateTotal(0, 0);
      expect(result).toBe(0);
    });
  });
});
