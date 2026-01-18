import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ingestProductinData } from "./ingest-production-data";
import { JsonError, MissingFieldError } from "../shared/validator";

import { addCorsHeader } from "../shared/utils";
import { listPartnerBatches } from "./get-batch-data";
import { allocateOrderToBatch } from "./allocate-order";

const dbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult = {
    statusCode: 200,
    body: "",
  };

  try {
    const resource = event.resource;
    switch (event.httpMethod) {
      case "GET": {
        response = await listPartnerBatches(event, dbClient);
        break;
      }
      case "POST": {
        if (resource.includes("allocations")) {
          // Route: POST /climate-ledger/{id}/allocations
          console.log("in allocate order handler");
          response = await allocateOrderToBatch(event, dbClient);
        } else {
          // Route: POST /climate-ledger
          response = await ingestProductinData(event, dbClient);
        }
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

    if (error instanceof MissingFieldError || error instanceof JsonError) {
      response = {
        statusCode: 400,
        body: error?.message,
      };
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

export { handler };
