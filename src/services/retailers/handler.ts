import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { addCorsHeader } from "../shared/utils";
import { listPartnerBatches } from "../partners/get-batch-data";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { listRetailerOrders } from "./get-retailers-orders";
import { confirmOrderReceipt } from "./confirm-order";

const dbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult = {
    statusCode: 200,
    body: "",
  };
  const retailerId = event.pathParameters?.retailerId;

  try {
    const resource = event.resource;

    switch (event.httpMethod) {
      case "GET": {
        console.log("inside GET of retailer handler!!!");
        response = await listRetailerOrders(event, dbClient);
        break;
      }

      case "PATCH": {
        console.log("Confirming order receipt...");
        // This function handles the CO2 math and DynamoDB UpdateCommand
        response = await confirmOrderReceipt(event, dbClient);
        break;
      }

      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ message: "Method Not Allowed" }),
        };
        break;
    }
  } catch (error) {
    console.log(error);
    response = {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }

  addCorsHeader(response);
  return response;
}

export { handler };
