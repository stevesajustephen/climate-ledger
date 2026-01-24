import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Batch } from "../../../domain/entities/batch.entity";
import { BatchRepository } from "../../../domain/repositories/batch.repository";
import { DYNAMODB_KEYS } from "../../../lib/constants";

export class BatchRepositoryImpl implements BatchRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
  ) {}

  async save(batch: Batch): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `${DYNAMODB_KEYS.BATCH_PREFIX}${batch.id}`,
          sk: DYNAMODB_KEYS.METADATA,
          factory_id: batch.factoryId,
          total_kwh: batch.totalKwh,
          total_units: batch.totalUnits,
          grid_factor: batch.gridFactor,
          evidence_s3_url: batch.evidenceS3Url,
          total_carbon_kg: batch.totalCarbonKg,
          partner_id: batch.partnerId,
          created_at: batch.createdAt,
        },
      }),
    );
  }

  async getById(id: string): Promise<Batch | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          pk: `${DYNAMODB_KEYS.BATCH_PREFIX}${id}`,
          sk: DYNAMODB_KEYS.METADATA,
        },
      }),
    );
    if (!result.Item) return null;
    return new Batch(
      id,
      result.Item.factory_id,
      result.Item.total_kwh,
      result.Item.total_units,
      result.Item.grid_factor,
      result.Item.evidence_s3_url,
      result.Item.partner_id,
      result.Item.total_carbon_kg,
      result.Item.created_at,
    );
  }

  async listByPartner(partnerId: string): Promise<Batch[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "PartnerMetadataIndex",
        KeyConditionExpression: "partner_id = :pId AND sk = :skValue",
        ExpressionAttributeValues: {
          ":pId": partnerId,
          ":skValue": "METADATA",
        },
      }),
    );
    return (result.Items || []).map(
      (item) =>
        new Batch(
          item.pk,
          item.factory_id,
          item.total_kwh,
          item.total_units,
          item.grid_factor,
          item.evidence_s3_url,
          item.partner_id,
          item.total_carbon_kg,
          item.created_at,
        ),
    );
  }
}
