export class Allocation {
  constructor(
    public readonly batchId: string,
    public readonly orderId: string,
    public readonly retailerId: string,
    public readonly partnerId: string,
    public readonly orderQuantity: number,
    public readonly unitWeight: number,
    public readonly productionCo2Kg: number, // Calculated
    public readonly destination: string,
    public readonly status: "SHIPPED" | "RECEIVED",
    public readonly transportDistanceKm?: number,
    public readonly transportCo2Kg?: number,
    public readonly totalOrderCo2Kg?: number,
    public readonly createdAt: string = new Date().toISOString(),
    public readonly receivedAt?: string,
    public readonly publicSlug?: string,
  ) {}
}
