import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateAsIngestProdEntry } from "../shared/validator";
import { bodyParser } from "../shared/utils";

export async function ingestProductinData(
  event: APIGatewayProxyEvent,
  dbClient: DynamoDBClient
): Promise<APIGatewayProxyResult> {
  const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

  const productionData = bodyParser(event.body);

  validateAsIngestProdEntry(productionData);
  const { batchId, factoryId, totalKwh, totalUnits, gridFactor } =
    productionData;

  const totalCarbonFootprint = Number(totalKwh) * Number(gridFactor);

  const item = {
    pk: `BATCH#${batchId}`,
    sk: "METADATA",
    factory_id: factoryId,
    total_kwh: Number(totalKwh),
    total_units: Number(totalUnits),
    grid_factor: Number(gridFactor),
    total_carbon_kg: totalCarbonFootprint,
    created_at: new Date().toISOString(),
  };

  const result = await ddbDocClient.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME, // Passed from LambdaStack environment
      Item: item,
    })
  );
  console.log("result in dev is", result, item);

  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({ id: batchId }),
  };

  return response;
}
