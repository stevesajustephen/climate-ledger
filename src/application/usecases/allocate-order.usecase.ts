import { Allocation } from "../../domain/entities/allocation.entity";
import { BatchRepository } from "../../domain/repositories/batch.repository";
import { AllocationRepository } from "../../domain/repositories/allocation.repository";
import { Co2Calculator } from "../../domain/services/co2-calculator.service";

interface AllocateInput {
  orderId: string;
  retailerId: string;
  orderQuantity: number;
  unitWeight: number;
  destination: string;
}

export class AllocateOrderUseCase {
  constructor(
    private batchRepo: BatchRepository,
    private allocationRepo: AllocationRepository,
  ) {}

  async execute(
    batchId: string,
    input: AllocateInput,
    partnerId: string,
  ): Promise<{ orderId: string; calculatedCo2: number }> {
    // Basic validation (more can be added)
    if (
      !batchId ||
      !input.orderId ||
      !input.orderQuantity ||
      !input.retailerId ||
      !input.unitWeight ||
      !input.destination
    ) {
      throw new Error("Missing required fields");
    }

    const batch = await this.batchRepo.getById(batchId);
    if (!batch) throw new Error("Batch not found");
    if (batch.partnerId !== partnerId)
      throw new Error("Unauthorized: This batch does not belong to you");
    if (input.orderQuantity > batch.totalUnits)
      throw new Error("Order Quantity above production units");

    const productionCo2Share = Co2Calculator.calculateProductionShare(
      input.orderQuantity,
      batch.totalUnits,
      batch.totalCarbonKg,
    );
    const allocation = new Allocation(
      batchId,
      input.orderId,
      input.retailerId,
      partnerId,
      input.orderQuantity,
      input.unitWeight,
      productionCo2Share,
      input.destination,
      "SHIPPED",
    );
    await this.allocationRepo.save(allocation);
    return { orderId: input.orderId, calculatedCo2: productionCo2Share };
  }
}
