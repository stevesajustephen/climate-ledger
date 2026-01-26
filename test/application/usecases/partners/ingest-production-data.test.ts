import { IngestProductionDataUseCase } from "../../../../src/application/usecases/partners/ingest-production-data.usecase";
import { BatchRepository } from "../../../../src/domain/repositories/batch.repository";
import { Schemas } from "../../../../src/lib/schemas";

const mockBatchRepo: jest.Mocked<BatchRepository> = {
  save: jest.fn().mockResolvedValue(undefined),
  getById: jest.fn(),
  listByPartner: jest.fn(),
  update: jest.fn(),
};

describe("IngestProductionDataUseCase", () => {
  let useCase: IngestProductionDataUseCase;

  beforeEach(() => {
    useCase = new IngestProductionDataUseCase(mockBatchRepo);
    jest.clearAllMocks();
  });

  it("successfully ingests production data and saves batch", async () => {
    const input: Schemas["IngestProduction"] = {
      batchId: "batch-123",
      factoryId: "factory-abc",
      totalKwh: 1000,
      totalUnits: 500,
      gridFactor: 0.42,
      evidenceS3Url: "https://s3.example.com/evidence.pdf",
    };

    const partnerId = "partner-xyz";

    const result = await useCase.execute(input, partnerId);

    expect(result).toEqual({ id: "batch-123" });

    expect(mockBatchRepo.save).toHaveBeenCalledTimes(1);
    const savedBatch = mockBatchRepo.save.mock.calls[0][0];

    expect(savedBatch.id).toBe("batch-123");
    expect(savedBatch.partnerId).toBe("partner-xyz");
    expect(savedBatch.totalKwh).toBe(1000);
    expect(savedBatch.totalCarbonKg).toBe(420); // 1000 * 0.42 = 420
  });

  it("throws error when required field is missing", async () => {
    const invalidInput = {
      batchId: "batch-123",
      factoryId: "factory-abc",
      totalKwh: 1000,
      gridFactor: 0.42,
      evidenceS3Url: "https://s3.example.com/evidence.pdf",
    } as Schemas["IngestProduction"];

    await expect(useCase.execute(invalidInput, "partner-xyz")).rejects.toThrow(
      "Value for totalUnits expected!",
    );

    expect(mockBatchRepo.save).not.toHaveBeenCalled();
  });

  it("handles zero kWh and units correctly", async () => {
    const input: Schemas["IngestProduction"] = {
      batchId: "batch-zero",
      factoryId: "factory-abc",
      totalKwh: 0,
      totalUnits: 0,
      gridFactor: 0.5,
      evidenceS3Url: "https://s3.example.com/zero.pdf",
    };

    const result = await useCase.execute(input, "partner-xyz");

    expect(result.id).toBe("batch-zero");
    expect(mockBatchRepo.save).toHaveBeenCalled();
    const savedBatch = mockBatchRepo.save.mock.calls[0][0];

    expect(savedBatch.totalCarbonKg).toBe(0);
  });
});
