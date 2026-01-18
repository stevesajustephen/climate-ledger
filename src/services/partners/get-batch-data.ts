import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand as DocScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getPartnerGroup } from "../shared/utils";

export async function listPartnerBatches(
  event: APIGatewayProxyEvent,
  dbClient: DynamoDBClient,
): Promise<APIGatewayProxyResult> {
  const partnerId = getPartnerGroup(event);

  if (!partnerId) {
    return {
      statusCode: 403,
      body: JSON.stringify("Forbidden: Not a registered Partner"),
    };
  }

  const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

  try {
    const result = await ddbDocClient.send(
      new DocScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: "partner_id = :pId AND sk = :skValue",
        ExpressionAttributeValues: {
          ":pId": partnerId,
          ":skValue": "METADATA", // Provide the value here
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
      body: JSON.stringify({ message: "Failed to fetch batches" }),
    };
  }
}
