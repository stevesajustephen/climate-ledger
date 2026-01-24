import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { Disclosure } from "../../../domain/entities/disclosure.entity";
import { DisclosureRepository } from "../../../domain/repositories/disclosure.repository";

export class DisclosureRepositoryImpl implements DisclosureRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
  ) {}

  async save(disclosure: Disclosure): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          slug: disclosure.slug,
          product_name: disclosure.productName,
          total_co2_kg: disclosure.totalCo2Kg.toFixed(4),
          transport_co2_kg: disclosure.transportCo2Kg.toFixed(4),
          verified_at: disclosure.verifiedAt,
          origin: disclosure.origin,
        },
      }),
    );
  }

  async getBySlug(slug: string): Promise<Disclosure | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { slug },
      }),
    );
    if (!result.Item) return null;
    return new Disclosure(
      slug,
      result.Item.product_name,
      Number(result.Item.total_co2_kg),
      Number(result.Item.transport_co2_kg),
      result.Item.verified_at,
      result.Item.origin,
    );
  }
}
