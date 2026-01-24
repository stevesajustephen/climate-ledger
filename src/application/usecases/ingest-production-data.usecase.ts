import { Batch } from "../../domain/entities/batch.entity";
import { BatchRepository } from "../../domain/repositories/batch.repository";
import { validateIngestProdEntry } from "../../lib/validator";
import { Co2Calculator } from "../../domain/services/co2-calculator.service";

interface IngestInput {
  batchId: string;
  factoryId: string;
  totalKwh: number;
  totalUnits: number;
  gridFactor: number;
  evidenceS3Url: string;
}

export class IngestProductionDataUseCase {
  constructor(private batchRepo: BatchRepository) {}

  async execute(
    input: IngestInput,
    partnerId: string,
  ): Promise<{ id: string }> {
    validateIngestProdEntry(input);
    const totalCarbonKg = Co2Calculator.calculateBatchTotal(
      input.totalKwh,
      input.gridFactor,
    );
    const batch = new Batch(
      input.batchId,
      input.factoryId,
      input.totalKwh,
      input.totalUnits,
      input.gridFactor,
      input.evidenceS3Url,
      partnerId,
      totalCarbonKg,
    );
    await this.batchRepo.save(batch);
    return { id: batch.id };
  }
}
