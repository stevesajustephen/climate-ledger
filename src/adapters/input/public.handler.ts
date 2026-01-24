import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { GetDisclosureUseCase } from "../../application/usecases/get-disclosure.usecase";
import { DisclosureRepositoryImpl } from "../output/dynamodb/disclosure.repository.impl";
import { addCorsHeader } from "../../lib/utils";

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const publicTableName = process.env.PUBLIC_TABLE_NAME!;
const disclosureRepo = new DisclosureRepositoryImpl(docClient, publicTableName);

export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const slug = event.pathParameters?.slug;
  let response: APIGatewayProxyResult;

  if (!slug) {
    response = {
      statusCode: 400,
      body: JSON.stringify("Missing disclosure ID"),
    };
    addCorsHeader(response);
    return response;
  }

  try {
    const useCase = new GetDisclosureUseCase(disclosureRepo);
    const disclosure = await useCase.execute(slug);
    if (!disclosure) {
      response = {
        statusCode: 404,
        body: JSON.stringify("Sustainability Passport not found"),
      };
    } else {
      response = { statusCode: 200, body: JSON.stringify(disclosure) };
    }
  } catch (error) {
    console.error("Public Read Error:", error);
    response = {
      statusCode: 500,
      body: JSON.stringify("Internal Server Error"),
    };
  }
  addCorsHeader(response);
  return response;
}
