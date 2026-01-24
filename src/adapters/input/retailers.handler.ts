import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { withErrorHandling } from "../../lib/error-handler";
import { ForbiddenError, BadRequestError } from "../../lib/errors";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { ListRetailerOrdersUseCase } from "../../application/usecases/retailers/list-retailer-orders.usecase";
import { ConfirmOrderUseCase } from "../../application/usecases/retailers/confirm-order.usecase";

import { AllocationRepositoryImpl } from "../output/dynamodb/allocation.repository.impl";
import { DisclosureRepositoryImpl } from "../output/dynamodb/disclosure.repository.impl";

import { bodyParser, getRetailerGroup } from "../../lib/utils";

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const tableName = process.env.TABLE_NAME!;
const publicTableName = process.env.PUBLIC_TABLE_NAME!;

const allocationRepo = new AllocationRepositoryImpl(docClient, tableName);
const disclosureRepo = new DisclosureRepositoryImpl(docClient, publicTableName);
// ──────────────────────────────────────────────────────────────

async function handle(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const retailerId = getRetailerGroup(event);
  if (!retailerId) {
    throw new ForbiddenError("Not a registered Retailer");
  }

  switch (event.httpMethod) {
    case "GET": {
      const listUseCase = new ListRetailerOrdersUseCase(allocationRepo);
      const orders = await listUseCase.execute(retailerId);
      return {
        statusCode: 200,
        body: JSON.stringify(orders),
      };
    }

    case "PATCH": {
      const data = bodyParser(event.body);

      if (!data.batchId || !data.orderId) {
        throw new BadRequestError(
          "Missing required fields: batchId and/or orderId",
        );
      }

      if (!data.distanceKm || data.distanceKm <= 0) {
        throw new BadRequestError(
          "distanceKm is required and must be positive",
        );
      }

      if (!data.productName?.trim()) {
        throw new BadRequestError("productName is required");
      }

      const { batchId, orderId, ...input } = data;

      const confirmUseCase = new ConfirmOrderUseCase(
        allocationRepo,
        disclosureRepo,
      );
      const result = await confirmUseCase.execute(
        batchId,
        orderId,
        input,
        retailerId,
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Order received and carbon footprint finalized",
          ...result,
        }),
      };
    }

    default: {
      throw new BadRequestError("Method Not Allowed");
    }
  }
}

// Export wrapped handler – all errors are now handled centrally
export const handler = withErrorHandling(handle);
