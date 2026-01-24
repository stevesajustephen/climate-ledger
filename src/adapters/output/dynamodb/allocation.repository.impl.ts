import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Allocation } from "../../../domain/entities/allocation.entity";
import { AllocationRepository } from "../../../domain/repositories/allocation.repository";

export class AllocationRepositoryImpl implements AllocationRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
  ) {}

  async save(allocation: Allocation): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `BATCH#${allocation.batchId}`,
          sk: `ALLOCATION#${allocation.orderId}`,
          type: "ALLOCATION",
          order_id: allocation.orderId,
          retailer_id: allocation.retailerId,
          partner_id: allocation.partnerId,
          order_quantity: allocation.orderQuantity,
          unit_weight: allocation.unitWeight,
          production_co2_kg: allocation.productionCo2Kg,
          destination: allocation.destination,
          status: allocation.status,
          created_at: allocation.createdAt,
        },
      }),
    );
  }

  async getByBatchAndOrder(
    batchId: string,
    orderId: string,
  ): Promise<Allocation | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `BATCH#${batchId}`, sk: `ALLOCATION#${orderId}` },
      }),
    );
    if (!result.Item) return null;
    return new Allocation(
      batchId,
      orderId,
      result.Item.retailer_id,
      result.Item.partner_id,
      result.Item.order_quantity,
      result.Item.unit_weight,
      result.Item.production_co2_kg,
      result.Item.destination,
      result.Item.status,
      result.Item.transport_distance_km,
      result.Item.transport_co2_kg,
      result.Item.total_order_co2_kg,
      result.Item.created_at,
      result.Item.received_at,
      result.Item.public_slug,
    );
  }

  async update(allocation: Allocation): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          pk: `BATCH#${allocation.batchId}`,
          sk: `ALLOCATION#${allocation.orderId}`,
        },
        ConditionExpression: "#status = :expectedStatus",
        UpdateExpression: `SET
        #status = :newStatus,
        transport_distance_km = :dist,
        transport_co2_kg = :tCo2,
        total_order_co2_kg = :total,
        received_at = :now,
        public_slug = :slug`,
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":expectedStatus": "SHIPPED",
          ":newStatus": allocation.status,
          ":dist": allocation.transportDistanceKm,
          ":tCo2": allocation.transportCo2Kg,
          ":total": allocation.totalOrderCo2Kg,
          ":now": allocation.receivedAt,
          ":slug": allocation.publicSlug,
        },
      }),
    );
  }

  async listByRetailer(retailerId: string): Promise<Allocation[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "RetailerOrdersIndex",
        KeyConditionExpression:
          "retailer_id = :rId AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":rId": retailerId,
          ":skPrefix": "ALLOCATION#",
        },
      }),
    );
    return (result.Items || []).map(
      (item) =>
        new Allocation(
          item.pk.split("#")[1],
          item.order_id,
          item.retailer_id,
          item.partner_id,
          item.order_quantity,
          item.unit_weight,
          item.production_co2_kg,
          item.destination,
          item.status,
          item.transport_distance_km,
          item.transport_co2_kg,
          item.total_order_co2_kg,
          item.created_at,
          item.received_at,
          item.public_slug,
        ),
    );
  }
}
