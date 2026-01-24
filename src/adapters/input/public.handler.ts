import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { withErrorHandling } from "../../lib/error-handler";
import { BadRequestError, NotFoundError } from "../../lib/errors";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import { DisclosureRepositoryImpl } from "../output/dynamodb/disclosure.repository.impl";

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const publicTableName = process.env.PUBLIC_TABLE_NAME!;

const disclosureRepo = new DisclosureRepositoryImpl(docClient, publicTableName);

async function handle(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const slug = event.pathParameters?.slug;

  if (!slug) {
    throw new BadRequestError("Missing disclosure ID (slug)");
  }

  const disclosure = await disclosureRepo.getBySlug(slug);

  if (!disclosure) {
    throw new NotFoundError("Sustainability Passport not found");
  }

  return {
    statusCode: 200,
    body: JSON.stringify(disclosure),
  };
}

export const handler = withErrorHandling(handle);
