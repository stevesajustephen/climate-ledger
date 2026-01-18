import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { addCorsHeader } from "../shared/utils";

async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const retailerId = event.pathParameters?.retailerId;

  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello from the Retailer service! Connection successful for: ${retailerId}`,
      timestamp: new Date().toISOString(),
      requestContext: {
        httpMethod: event.httpMethod,
        path: event.path,
      },
    }),
  };

  // Ensure your shared utility adds CORS so your React app can read this
  addCorsHeader(response);

  return response;
}

export { handler };
