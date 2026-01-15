import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ingestProductinData } from "./ingest-production-data";

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

    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
    };
  }
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify(message),
  };
  return response;
}

export { handler };
