import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { validateAsIngestProdEntry } from "../shared/validator";
import { bodyParser, getPartnerGroup } from "../shared/utils";

export async function ingestProductinData(
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

  const productionData = bodyParser(event.body);

  validateAsIngestProdEntry(productionData);

  const {
    batchId,
    factoryId,
    totalKwh,
    totalUnits,
    gridFactor,
    evidenceS3Url,
  } = productionData;

  const totalCarbonFootprint = Number(totalKwh) * Number(gridFactor);

  const item = {
    pk: `BATCH#${batchId}`,
    sk: "METADATA",
    factory_id: `${factoryId}`,
    total_kwh: Number(totalKwh),
    total_units: Number(totalUnits),
    grid_factor: Number(gridFactor),
    evidence_s3_url: evidenceS3Url,
    total_carbon_kg: totalCarbonFootprint,
    partner_id: partnerId,
    created_at: new Date().toISOString(),
  };

  await ddbDocClient.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME, // Passed from LambdaStack environment
      Item: item,
    }),
  );

  const response: APIGatewayProxyResult = {
    statusCode: 200,
    body: JSON.stringify({ id: batchId }),
  };

  return response;
}
