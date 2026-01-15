import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";

export async function ingestProductinData(
  event: APIGatewayProxyEvent,
  dbClient: DynamoDBClient
): Promise<APIGatewayProxyResult> {
  const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing request body" }),
    };
  }

  const body = JSON.parse(event.body);
  const { batchId, factoryId, totalKwh, totalUnits, gridFactor } = body;

  if (!batchId || !factoryId || !totalKwh) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  const totalCarbonFootprint = Number(totalKwh) * Number(gridFactor);

  const item = {
    pk: `BATCH#${batchId}`, // Partition Key
    sk: "METADATA", // Sort Key to identify this as the "Header" record
    factory_id: factoryId,
    total_kwh: Number(totalKwh),
    total_units: Number(totalUnits),
    grid_factor: Number(gridFactor),
    total_carbon_kg: totalCarbonFootprint,
    created_at: new Date().toISOString(),
  };

  // const item = {
  //   pk: { S: `BATCH#${batchId}` },
  //   sk: { S: "METADATA" },
  //   factory_id: { S: factoryId },
  //   // total_kwh: The energy from the bill
  //   total_kwh: { N: totalKwh.toString() },
  //   // total_units: The count of items made (e.g., 1000 shirts)
  //   total_units: { N: totalUnits.toString() },
  //   grid_factor: { N: gridFactor.toString() },
  //   total_carbon_kg: { N: totalCarbonFootprint.toString() },
  //   created_at: { S: new Date().toISOString() },
  // };

  const result = await ddbDocClient.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME, // Passed from LambdaStack environment
      Item: item,
    })
  );
  console.log("result isssssss ", result, item);

  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({ id: batchId }),
  };

  return response;
}
