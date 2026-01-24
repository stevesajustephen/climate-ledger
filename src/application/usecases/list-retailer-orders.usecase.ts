import { AllocationRepository } from "../../domain/repositories/allocation.repository";

export class ListRetailerOrdersUseCase {
  constructor(private allocationRepo: AllocationRepository) {}

  async execute(retailerId: string): Promise<any[]> {
    return this.allocationRepo.listByRetailer(retailerId);
  }
}
