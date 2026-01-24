import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { BatchRepositoryImpl } from "../adapters/output/dynamodb/batch.repository.impl";
import { AllocationRepositoryImpl } from "../adapters/output/dynamodb/allocation.repository.impl";
import { DisclosureRepositoryImpl } from "../adapters/output/dynamodb/disclosure.repository.impl";

import { IngestProductionDataUseCase } from "../application/usecases/partners/ingest-production-data.usecase";
import { ListPartnerBatchesUseCase } from "../application/usecases/partners/list-partner-batches.usecase";
import { AllocateOrderUseCase } from "../application/usecases/partners/allocate-order.usecase";

import { ListRetailerOrdersUseCase } from "../application/usecases/retailers/list-retailer-orders.usecase";
import { ConfirmOrderUseCase } from "../application/usecases/retailers/confirm-order.usecase";

import { GetDisclosureUseCase } from "../application/usecases/public/get-disclosure.usecase";

export interface AppDependencies {
  // Repositories (concrete implementations)
  batchRepo: BatchRepositoryImpl;
  allocationRepo: AllocationRepositoryImpl;
  disclosureRepo: DisclosureRepositoryImpl;

  // Use cases – partners
  ingestProductionData: IngestProductionDataUseCase;
  listPartnerBatches: ListPartnerBatchesUseCase;
  allocateOrder: AllocateOrderUseCase;

  // Use cases – retailers
  listRetailerOrders: ListRetailerOrdersUseCase;
  confirmOrder: ConfirmOrderUseCase;

  // Use cases – public
  getDisclosure: GetDisclosureUseCase;
}

export function createDependencies(): AppDependencies {
  const dynamoClient = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(dynamoClient);

  const mainTableName = process.env.TABLE_NAME!;
  const publicTableName = process.env.PUBLIC_TABLE_NAME!;

  const batchRepo = new BatchRepositoryImpl(docClient, mainTableName);
  const allocationRepo = new AllocationRepositoryImpl(docClient, mainTableName);
  const disclosureRepo = new DisclosureRepositoryImpl(
    docClient,
    publicTableName,
  );

  return {
    // Repos
    batchRepo,
    allocationRepo,
    disclosureRepo,

    // Partners
    ingestProductionData: new IngestProductionDataUseCase(batchRepo),
    listPartnerBatches: new ListPartnerBatchesUseCase(batchRepo),
    allocateOrder: new AllocateOrderUseCase(batchRepo, allocationRepo),

    // Retailers
    listRetailerOrders: new ListRetailerOrdersUseCase(allocationRepo),
    confirmOrder: new ConfirmOrderUseCase(allocationRepo, disclosureRepo),

    // Public
    getDisclosure: new GetDisclosureUseCase(disclosureRepo),
  };
}
