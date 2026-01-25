import { Allocation } from "../entities/allocation.entity";

export interface AllocationRepository {
  save(allocation: Allocation): Promise<void>;
  getByBatchAndOrder(
    batchId: string,
    orderId: string,
  ): Promise<Allocation | null>;
  update(allocation: Allocation): Promise<void>;
  listByRetailer(retailerId: string): Promise<Allocation[]>;
}
