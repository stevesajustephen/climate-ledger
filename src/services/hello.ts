import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { v4 as uuidv4 } from "uuid";

async function handler(event: APIGatewayProxyEvent, context: Context) {
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify(`hwloo from lambda!!! this is the ID! ${uuidv4()}`),
  };
  console.log(event);
  return response;
}

export { handler };
