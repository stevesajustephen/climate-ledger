import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ListRetailerOrdersUseCase } from "../../application/usecases/retailers/list-retailer-orders.usecase";
import { ConfirmOrderUseCase } from "../../application/usecases/retailers/confirm-order.usecase";
import { AllocationRepositoryImpl } from "../output/dynamodb/allocation.repository.impl";
import { DisclosureRepositoryImpl } from "../output/dynamodb/disclosure.repository.impl";
import {
  bodyParser,
  addCorsHeader,
  getPartnerGroup,
  getRetailerGroup,
} from "../../lib/utils";

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const tableName = process.env.TABLE_NAME!;
const publicTableName = process.env.PUBLIC_TABLE_NAME!;
const allocationRepo = new AllocationRepositoryImpl(docClient, tableName);
const disclosureRepo = new DisclosureRepositoryImpl(docClient, publicTableName);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult = { statusCode: 200, body: "" };
  const retailerId = getRetailerGroup(event);
  if (!retailerId) {
    response = {
      statusCode: 403,
      body: JSON.stringify("Forbidden: Not a registered Retailer"),
    };
    addCorsHeader(response);
    return response;
  }

  try {
    switch (event.httpMethod) {
      case "GET":
        const listUseCase = new ListRetailerOrdersUseCase(allocationRepo);
        const orders = await listUseCase.execute(retailerId);
        response.body = JSON.stringify(orders);
        break;
      case "PATCH":
        const confirmUseCase = new ConfirmOrderUseCase(
          allocationRepo,
          disclosureRepo,
        );
        const { batchId, orderId } = bodyParser(event.body); // Assume body has batchId, orderId, etc.
        const input = bodyParser(event.body);
        const result = await confirmUseCase.execute(
          batchId,
          orderId,
          input,
          retailerId,
        );
        response.body = JSON.stringify({
          message: "Order received and carbon footprint finalized",
          ...result,
        });
        break;
      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    }
  } catch (error: any) {
    console.error(error);
    if (error.name === "ConditionalCheckFailedException") {
      response = {
        statusCode: 409,
        body: JSON.stringify(
          "Conflict: Order status was updated by another user",
        ),
      };
    } else if (
      error.message.includes("not found") ||
      error.message.includes("already been confirmed")
    ) {
      response = {
        statusCode: 404,
        body: JSON.stringify(error.message),
      };
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
