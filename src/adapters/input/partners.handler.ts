import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { withErrorHandling } from "../../lib/error-handler";
import { ForbiddenError, BadRequestError } from "../../lib/errors";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { IngestProductionDataUseCase } from "../../application/usecases/partners/ingest-production-data.usecase";
import { ListPartnerBatchesUseCase } from "../../application/usecases/partners/list-partner-batches.usecase";
import { AllocateOrderUseCase } from "../../application/usecases/partners/allocate-order.usecase";

import { BatchRepositoryImpl } from "../output/dynamodb/batch.repository.impl";
import { AllocationRepositoryImpl } from "../output/dynamodb/allocation.repository.impl";

import { bodyParser, getPartnerGroup } from "../../lib/utils";

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const tableName = process.env.TABLE_NAME!;

const batchRepo = new BatchRepositoryImpl(docClient, tableName);
const allocationRepo = new AllocationRepositoryImpl(docClient, tableName);
// ──────────────────────────────────────────────────────────────

async function handle(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const partnerId = getPartnerGroup(event);
  if (!partnerId) {
    throw new ForbiddenError("Not a registered Partner");
  }

  switch (event.httpMethod) {
    case "GET": {
      const listUseCase = new ListPartnerBatchesUseCase(batchRepo);
      const batches = await listUseCase.execute(partnerId);
      return {
        statusCode: 200,
        body: JSON.stringify(batches),
      };
    }

    case "POST": {
      if (event.resource.includes("allocations")) {
        // Allocate order
        const batchId = event.pathParameters?.id;
        if (!batchId) {
          throw new BadRequestError("Missing batch id in path parameters");
        }

        const input = bodyParser(event.body);
        const allocateUseCase = new AllocateOrderUseCase(
          batchRepo,
          allocationRepo,
        );
        const result = await allocateUseCase.execute(batchId, input, partnerId);

        return {
          statusCode: 201,
          body: JSON.stringify({
            message: "Order allocated successfully",
            ...result,
          }),
        };
      } else {
        // Ingest production data
        const input = bodyParser(event.body);
        const ingestUseCase = new IngestProductionDataUseCase(batchRepo);
        const result = await ingestUseCase.execute(input, partnerId);

        return {
          statusCode: 200,
          body: JSON.stringify(result),
        };
      }
    }

    default: {
      throw new BadRequestError("Method Not Allowed");
    }
  }
}

// Export wrapped handler
export const handler = withErrorHandling(handle);
