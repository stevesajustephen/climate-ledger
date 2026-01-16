import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ingestProductinData } from "./ingest-production-data";
import { JsonError, MissingFieldError } from "../shared/validator";

const dbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  let message: string;

  try {
    switch (event.httpMethod) {
      case "GET": {
        message = "hello from get";
        break;
      }
      case "POST": {
        const response = await ingestProductinData(event, dbClient);
        return response;
      }
      default:
        break;
    }
  } catch (error) {
    console.log(error);

    if (error instanceof MissingFieldError) {
      return {
        statusCode: 400,
        body: error?.message,
      };
    }
    if (error instanceof JsonError) {
      return {
        statusCode: 400,
        body: error?.message,
      };
    }
    return {
      statusCode: 500,
      body: error?.message,
    };
  }
}

export { handler };
