import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export async function ingestProductinData(
  event: APIGatewayProxyEvent,
  context: Context
) {
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify(""),
  };
  return response;
}
