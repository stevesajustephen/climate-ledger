import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { addCorsHeader } from "./utils"; // your existing CORS helper
import { AppError } from "./errors";
import { ZodError } from "zod";

type HandlerFn = (
  event: APIGatewayProxyEvent,
) => Promise<APIGatewayProxyResult>;

export function withErrorHandling(
  handler: HandlerFn,
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {
  return async (
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> => {
    try {
      const result = await handler(event);
      addCorsHeader(result);
      return result;
    } catch (err: unknown) {
      let statusCode = 500;
      let body: { message: string; details?: unknown; issues?: unknown } = {
        message: "Internal Server Error",
      };
      if (err instanceof ZodError) {
        statusCode = 400;
        body = {
          message: "Validation failed",
          issues: err.issues.map((issue) => ({
            field: issue.path.join(".") || "body",
            message: issue.message,
          })),
        };
      } else if (err instanceof AppError) {
        statusCode = err.statusCode;
        body = {
          message: err.message,
          ...(err.details && { details: err.details }),
        };
      } else if (err instanceof Error) {
        console.error(err.message, err.stack);
      } else {
        console.error(String(err));
      }

      const response: APIGatewayProxyResult = {
        statusCode,
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      };

      addCorsHeader(response);
      return response;
    }
  };
}
