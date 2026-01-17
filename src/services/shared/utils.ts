import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { JsonError } from "./validator";

export function bodyParser(arg: string) {
  try {
    return JSON.parse(arg);
  } catch (error) {
    return new JsonError(error.message);
  }
}

export function addCorsHeader(arg: APIGatewayProxyResult) {
  if (!arg.headers) {
    arg.headers = {};
  }
  arg.headers["Access-Control-Allow-Origin"] = "*";
  arg.headers["Access-Control-Allow-Methods"] = "*";
}

export function isAPartner(event: APIGatewayProxyEvent) {
  const groups = event.requestContext.authorizer?.claims["cognito:groups"];

  if (groups) {
    return (groups as string).includes("partner-ABC");
  }
  return false;
}

export function getPartnerGroup(event: APIGatewayProxyEvent): string | null {
  const groups = event.requestContext.authorizer?.claims["cognito:groups"];
  if (!groups) return null;

  const groupsArray = (groups as string).split(",");

  const partnerGroup = groupsArray.find((g) => g.trim().startsWith("partner-"));

  return partnerGroup || null;
}
