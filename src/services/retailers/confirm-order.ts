import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyParser, getRetailerGroup } from "../shared/utils"; // Using your existing utility

const EMISSION_FACTOR_TRUCK = 0.105; // kg CO2e per tonne-km

export async function confirmOrderReceipt(
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

  const data = bodyParser(event.body);
  const { batchId, orderId, distanceKm } = data;

  if (!batchId || !orderId || distanceKm === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        "Missing required fields: batchId, orderId, distanceKm",
      ),
    };
  }

  try {
    const orderCheck = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          pk: `BATCH#${batchId}`,
          sk: `ALLOCATION#${orderId}`,
        },
      }),
    );

    const order = orderCheck.Item;

    if (!order) {
      return {
        statusCode: 404,
        body: JSON.stringify("Order allocation not found"),
      };
    }

    // Security check: Only confirm if not already received
    if (order.status === "RECEIVED") {
      return {
        statusCode: 400,
        body: JSON.stringify("Order has already been confirmed and audited"),
      };
    }

    const totalWeightTonnes =
      (Number(order.order_quantity) * Number(order.unit_weight)) / 1000;
    const transportCo2 =
      Number(distanceKm) * totalWeightTonnes * EMISSION_FACTOR_TRUCK;
    const totalImpactCo2 = Number(order.production_co2_kg) + transportCo2;

    await ddbDocClient.send(
      new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          pk: `BATCH#${batchId}`,
          sk: `ALLOCATION#${orderId}`,
        },
        ConditionExpression: "#status = :expectedStatus",
        UpdateExpression: `SET 
          #status = :newStatus, 
          transport_distance_km = :dist, 
          transport_co2_kg = :tCo2, 
          total_order_co2_kg = :total,
          received_at = :now`,
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":expectedStatus": "SHIPPED",
          ":newStatus": "RECEIVED",
          ":dist": Number(distanceKm),
          ":tCo2": transportCo2,
          ":total": totalImpactCo2,
          ":now": new Date().toISOString(),
        },
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Order received and carbon footprint finalized",
        orderId: order.order_id,
        productionCo2: order.production_co2_kg,
        transportCo2: transportCo2.toFixed(4),
        totalCo2: totalImpactCo2.toFixed(4),
      }),
    };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        body: JSON.stringify(
          "Conflict: Order status was updated by another user",
        ),
      };
    }
    console.error("Confirmation Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Internal Server Error during confirmation"),
    };
  }
}
