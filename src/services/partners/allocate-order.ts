import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyParser, getPartnerGroup } from "../shared/utils";

export async function allocateOrderToBatch(
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

  const batchId = event.pathParameters?.id;
  const allocationData = bodyParser(event.body);

  const { orderId, retailerId, orderQuantity, unitWeight, destination } =
    allocationData;

  // Basic validation
  if (
    !batchId ||
    !orderId ||
    !orderQuantity ||
    !retailerId ||
    !unitWeight ||
    !destination
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify("Missing required fields"),
    };
  }

  try {
    // 3. Verify the batch exists and belongs to this partner
    const batchCheck = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          pk: `BATCH#${batchId}`,
          sk: "METADATA",
        },
        ProjectionExpression: "pk, partner_id, total_units, total_carbon_kg",
      }),
    );

    const metadata = batchCheck.Item;

    if (!metadata) {
      return { statusCode: 404, body: JSON.stringify("Batch not found") };
    }

    if (metadata.partner_id !== partnerId) {
      return {
        statusCode: 403, // Better status code for "unauthorized"
        body: JSON.stringify("Unauthorized: This batch does not belong to you"),
      };
    }

    if (orderQuantity > metadata.total_units) {
      return {
        statusCode: 400, // Better status code for "unauthorized"
        body: JSON.stringify("Order Quantity above production units"),
      };
    }

    // Calculate how much of the total batch carbon belongs to this specific order
    const totalBatchUnits = Number(metadata.total_units) || 1;
    const totalBatchCarbon = Number(metadata.total_carbon_kg) || 0;

    const productionCo2Share =
      (Number(orderQuantity) / totalBatchUnits) * totalBatchCarbon;

    // 4. Create the Allocation Item with Logistics Data
    const item = {
      pk: `BATCH#${batchId}`,
      sk: `ALLOCATION#${orderId}`, // Matches your requested SK format
      type: "ALLOCATION",
      order_id: orderId,
      retailer_id: retailerId,
      partner_id: partnerId,

      // Data Points
      order_quantity: Number(orderQuantity),
      unit_weight: Number(unitWeight),
      production_co2_kg: productionCo2Share,
      destination: destination,
      status: "SHIPPED",

      created_at: new Date().toISOString(),
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
      }),
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Order allocated successfully",
        orderId: orderId,
        calculatedCo2: productionCo2Share,
      }),
    };
  } catch (error) {
    console.error("Allocation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Internal Server Error during allocation"),
    };
  }
}
