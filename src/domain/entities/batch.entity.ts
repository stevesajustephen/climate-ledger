export class Batch {
  constructor(
    public readonly id: string,
    public readonly factoryId: string,
    public readonly totalKwh: number,
    public readonly totalUnits: number,
    public readonly gridFactor: number,
    public readonly evidenceS3Url: string,
    public readonly partnerId: string,
    public readonly totalCarbonKg: number, // Calculated
    public readonly createdAt: string = new Date().toISOString(),
    public readonly remainingUnits: number = totalUnits,
  ) {}
}
