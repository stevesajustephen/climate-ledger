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
    emissionFactor: number = 0.105,
  ): number {
    return distanceKm * totalWeightTonnes * emissionFactor;
  }

  static calculateTotal(productionCo2: number, transportCo2: number): number {
    return productionCo2 + transportCo2;
  }
}
