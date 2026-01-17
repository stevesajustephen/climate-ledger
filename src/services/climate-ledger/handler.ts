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

const dbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  let message: string;

  let response: APIGatewayProxyResult = {
    statusCode: 200,
    body: "",
  };

  try {
    switch (event.httpMethod) {
      case "GET": {
        response = await listPartnerBatches(event, dbClient);
        break;
      }
      case "POST": {
        response = await ingestProductinData(event, dbClient);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.log(error);

    if (error instanceof MissingFieldError) {
      response = {
        statusCode: 400,
        body: error?.message,
      };
    }
    if (error instanceof JsonError) {
      response = {
        statusCode: 400,
        body: error?.message,
      };
    }
  }
  addCorsHeader(response);
  return response;
}

export { handler };
