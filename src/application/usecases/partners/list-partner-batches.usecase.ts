import { BatchRepository } from "../../../domain/repositories/batch.repository";

export class ListPartnerBatchesUseCase {
  constructor(private batchRepo: BatchRepository) {}

  async execute(partnerId: string): Promise<any[]> {
    return this.batchRepo.listByPartner(partnerId);
  }
}
