import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { IngestProductionDataUseCase } from "../../application/usecases/ingest-production-data.usecase";
import { ListPartnerBatchesUseCase } from "../../application/usecases/list-partner-batches.usecase";
import { AllocateOrderUseCase } from "../../application/usecases/allocate-order.usecase";
import { BatchRepositoryImpl } from "../output/dynamodb/batch.repository.impl";
import { AllocationRepositoryImpl } from "../output/dynamodb/allocation.repository.impl";
import {
  bodyParser,
  addCorsHeader,
  getPartnerGroup,
  getRetailerGroup,
} from "../../lib/utils";
import {
  validateIngestProdEntry,
  MissingFieldError,
  JsonError,
} from "../../lib/validator";

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const tableName = process.env.TABLE_NAME!;
const batchRepo = new BatchRepositoryImpl(docClient, tableName);
const allocationRepo = new AllocationRepositoryImpl(docClient, tableName);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult = { statusCode: 200, body: "" };
  const partnerId = getPartnerGroup(event);
  if (!partnerId) {
    response = {
      statusCode: 403,
      body: JSON.stringify("Forbidden: Not a registered Partner"),
    };
    addCorsHeader(response);
    return response;
  }

  try {
    switch (event.httpMethod) {
      case "GET":
        const listUseCase = new ListPartnerBatchesUseCase(batchRepo);
        const batches = await listUseCase.execute(partnerId);
        response.body = JSON.stringify(batches);
        break;
      case "POST":
        if (event.resource.includes("allocations")) {
          const allocateUseCase = new AllocateOrderUseCase(
            batchRepo,
            allocationRepo,
          );
          const batchId = event.pathParameters?.id!;
          const input = bodyParser(event.body);
          const result = await allocateUseCase.execute(
            batchId,
            input,
            partnerId,
          );
          response.statusCode = 201;
          response.body = JSON.stringify({
            message: "Order allocated successfully",
            ...result,
          });
        } else {
          const ingestUseCase = new IngestProductionDataUseCase(batchRepo);
          const input = bodyParser(event.body);
          const result = await ingestUseCase.execute(input, partnerId);
          response.body = JSON.stringify(result);
        }
        break;
      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    }
  } catch (error: any) {
    console.error(error);
    if (error instanceof MissingFieldError || error instanceof JsonError) {
      response = { statusCode: 400, body: error.message };
    } else if (
      error.message.includes("not found") ||
      error.message.includes("Quantity above")
    ) {
      response = { statusCode: 400, body: JSON.stringify(error.message) };
    } else if (error.message.includes("Unauthorized")) {
      response = { statusCode: 403, body: JSON.stringify(error.message) };
    } else {
      response = {
        statusCode: 500,
        body: JSON.stringify({ message: "Internal Server Error" }),
      };
    }
  }
  addCorsHeader(response);
  return response;
}
