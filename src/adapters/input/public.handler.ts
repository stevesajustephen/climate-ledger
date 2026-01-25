import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { withErrorHandling } from "../../lib/error-handler";
import { BadRequestError, NotFoundError } from "../../lib/errors";

import { createDependencies, AppDependencies } from "../../lib/dependencies";

const deps: AppDependencies = createDependencies();

async function handle(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const slug = event.pathParameters?.slug;

  if (!slug) {
    throw new BadRequestError("Missing disclosure ID (slug)");
  }

  const disclosure = await deps.getDisclosure.execute(slug);

  if (!disclosure) {
    throw new NotFoundError("Sustainability Passport not found");
  }

  return {
    statusCode: 200,
    body: JSON.stringify(disclosure),
  };
}

export const handler = withErrorHandling(handle);
