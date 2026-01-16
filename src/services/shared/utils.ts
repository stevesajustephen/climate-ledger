import { APIGatewayProxyEvent } from "aws-lambda";
import { JsonError } from "./validator";

export function bodyParser(arg: string) {
  try {
    return JSON.parse(arg);
  } catch (error) {
    return new JsonError(error.message);
  }
}
