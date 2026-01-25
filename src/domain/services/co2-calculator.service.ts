import { CO2_EMISSION_FACTORS } from "../../lib/constants";

export class Co2Calculator {
  static calculateBatchTotal(kwh: number, gridFactor: number): number {
    return kwh * gridFactor;
  }

  static calculateProductionShare(
    orderQuantity: number,
    totalUnits: number,
    totalCarbonKg: number,
  ): number {
    return (orderQuantity / (totalUnits || 1)) * totalCarbonKg;
  }

  static calculateTransport(
    totalWeightTonnes: number,
    distanceKm: number,
  ): number {
    return (
      distanceKm *
      totalWeightTonnes *
      CO2_EMISSION_FACTORS.TRUCK_KG_CO2E_PER_TONNE_KM
    );
  }

  static calculateTotal(productionCo2: number, transportCo2: number): number {
    return productionCo2 + transportCo2;
  }
}
