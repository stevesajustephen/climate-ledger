import { BatchRepository } from "../../domain/repositories/batch.repository";

export class ListPartnerBatchesUseCase {
  constructor(private batchRepo: BatchRepository) {}

  async execute(partnerId: string): Promise<any[]> {
    // Return raw for now, or map to DTOs
    return this.batchRepo.listByPartner(partnerId);
  }
}
