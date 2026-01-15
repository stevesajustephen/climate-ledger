import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

async function handler(event: APIGatewayProxyEvent, context: Context) {
  let message: string;

  switch (event.httpMethod) {
    case "GET": {
      message = "hello from get";
      break;
    }
    case "POST": {
      message = "hello from post";
      break;
    }

    default:
      break;
  }
  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify(`hwloo from lambda!!! this is the ID!`),
  };
  return response;
}

export { handler };
