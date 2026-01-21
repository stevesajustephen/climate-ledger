import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { addCorsHeader } from "../shared/utils"; // Reusing your existing utility

const dbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  // 1. Grab the slug from the URL: /disclosures/{slug}
  const slug = event.pathParameters?.slug;

  console.log("In Public Disclosureeeeee");

  if (!slug) {
    const response: APIGatewayProxyResult = {
      statusCode: 400,
      body: JSON.stringify("Missing disclosure ID"),
    };
    addCorsHeader(response);
    return response;
  }

  try {
    // 2. Fetch the sanitized record from the Public table
    const result = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.PUBLIC_TABLE_NAME,
        Key: {
          slug: slug,
        },
      }),
    );

    if (!result.Item) {
      const response: APIGatewayProxyResult = {
        statusCode: 404,
        body: JSON.stringify("Sustainability Passport not found"),
      };
      addCorsHeader(response);
      return response;
    }

    // 3. Return the sanitized data
    const response: APIGatewayProxyResult = {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };

    // Crucial for the public browser scan to work
    addCorsHeader(response);
    return response;
  } catch (error) {
    console.error("Public Read Error:", error);
    const response: APIGatewayProxyResult = {
      statusCode: 500,
      body: JSON.stringify("Internal Server Error"),
    };
    addCorsHeader(response);
    return response;
  }
}
