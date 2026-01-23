import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand as DocScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { getRetailerGroup } from "../shared/utils";

export async function listRetailerOrders(
  event: APIGatewayProxyEvent,
  dbClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> {
  const retailerId = getRetailerGroup(event);

  if (!retailerId) {
    return {
      statusCode: 403,
      body: JSON.stringify("Forbidden: Not a registered Partner"),
    };
  }

  const ddbDocClient = DynamoDBDocumentClient.from(dbClient);
  //   const retailerId = event.pathParameters?.retailerId;

  if (!retailerId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing retailerId" }),
    };
  }

  try {
    const result = await ddbDocClient.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: "RetailerOrdersIndex",
        KeyConditionExpression:
          "retailer_id = :rId AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":rId": retailerId,
          ":skPrefix": "ALLOCATION#",
        },
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    console.error("List Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch orders" }),
    };
  }
}
