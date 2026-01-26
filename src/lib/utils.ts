import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { JsonError } from "./validator";

export function bodyParser(arg: string | undefined): any {
  if (!arg) throw new Error("Body is empty");
  try {
    return JSON.parse(arg);
  } catch (error: any) {
    throw new JsonError(error.message || "Invalid JSON");
  }
}

export function addCorsHeader(response: APIGatewayProxyResult): void {
  response.headers = response.headers || {};
  response.headers["Access-Control-Allow-Origin"] = "*";
  response.headers["Access-Control-Allow-Methods"] = "*";
  response.headers["Access-Control-Allow-Headers"] = "*"; // optional but useful
}

export function getPartnerGroup(event: APIGatewayProxyEvent): string | null {
  const groups = event.requestContext?.authorizer?.claims?.["cognito:groups"];
  if (!groups) return null;
  const groupsArray = (groups as string).split(",");
  const partnerGroup = groupsArray.find((g) => g.trim().startsWith("partner-"));
  return partnerGroup?.trim() || null;
}

export function getRetailerGroup(event: APIGatewayProxyEvent): string | null {
  const groups = event.requestContext?.authorizer?.claims?.["cognito:groups"];
  if (!groups) return null;
  const groupsArray = (groups as string).split(",");
  const retailerGroup = groupsArray.find((g) =>
    g.trim().startsWith("retailer-"),
  );
  return retailerGroup?.trim() || null;
}
