import { APIGatewayProxyEvent } from "aws-lambda";
import { JsonError } from "./validator";

export function bodyParser(arg: string) {
  try {
    return JSON.parse(arg);
  } catch (error) {
    return new JsonError(error.message);
  }
}

export function isAPartner(event: APIGatewayProxyEvent) {
  const groups = event.requestContext.authorizer?.claims["cognito:groups"];

  if (groups) {
    return (groups as string).includes("partner-ABC");
  }
  return false;
}
