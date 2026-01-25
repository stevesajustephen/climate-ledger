import { Batch } from "../entities/batch.entity";

export interface BatchRepository {
  save(batch: Batch): Promise<void>;
  getById(id: string): Promise<Batch | null>;
  listByPartner(partnerId: string): Promise<Batch[]>;
  update(batch: Batch): Promise<void>;
}
