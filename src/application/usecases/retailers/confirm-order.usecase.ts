import { AllocationRepository } from "../../../domain/repositories/allocation.repository";
import { DisclosureRepository } from "../../../domain/repositories/disclosure.repository";
import { Co2Calculator } from "../../../domain/services/co2-calculator.service";
import { Allocation } from "../../../domain/entities/allocation.entity";
import { Disclosure } from "../../../domain/entities/disclosure.entity";
import { randomBytes } from "node:crypto";
import { ORDER_STATUSES } from "../../../lib/constants";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "../../../lib/errors";

interface ConfirmInput {
  distanceKm: number;
  productName: string;
}

export class ConfirmOrderUseCase {
  constructor(
    private allocationRepo: AllocationRepository,
    private disclosureRepo: DisclosureRepository,
  ) {}

  async execute(
    batchId: string,
    orderId: string,
    input: ConfirmInput,
    retailerId: string,
  ): Promise<{
    orderId: string;
    productionCo2: number;
    transportCo2: number;
    totalCo2: number;
    publicSlug: string;
  }> {
    if (
      !batchId ||
      !orderId ||
      input.distanceKm === undefined ||
      input.productName === undefined
    ) {
      throw new Error(
        "Missing required fields: batchId, orderId, distanceKm, productName",
      );
    }

    let allocation = await this.allocationRepo.getByBatchAndOrder(
      batchId,
      orderId,
    );
    if (!allocation) throw new NotFoundError("Order allocation not found");
    if (allocation.retailerId !== retailerId)
      throw new UnauthorizedError("Unauthorized");
    if (allocation.status === "RECEIVED") {
      throw new BadRequestError("Order has already been confirmed and audited");
    }

    const totalWeightTonnes =
      (allocation.orderQuantity * allocation.unitWeight) / 1000;
    const transportCo2 = Co2Calculator.calculateTransport(
      totalWeightTonnes,
      input.distanceKm,
    );
    const totalCo2 = Co2Calculator.calculateTotal(
      allocation.productionCo2Kg,
      transportCo2,
    );

    allocation = new Allocation( // Immutable update
      allocation.batchId,
      allocation.orderId,
      allocation.retailerId,
      allocation.partnerId,
      allocation.orderQuantity,
      allocation.unitWeight,
      allocation.productionCo2Kg,
      allocation.destination,
      ORDER_STATUSES.RECEIVED,
      input.distanceKm,
      transportCo2,
      totalCo2,
      allocation.createdAt,
      new Date().toISOString(),
      randomBytes(4).toString("hex"),
    );
    await this.allocationRepo.update(allocation);

    const disclosure = new Disclosure(
      allocation.publicSlug!,
      input.productName,
      totalCo2,
      transportCo2,
      undefined, // verifiedAt default
      allocation.partnerId,
    );
    await this.disclosureRepo.save(disclosure);

    return {
      orderId: allocation.orderId,
      productionCo2: allocation.productionCo2Kg,
      transportCo2: transportCo2,
      totalCo2: totalCo2,
      publicSlug: allocation.publicSlug!,
    };
  }
}
