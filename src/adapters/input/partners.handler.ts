import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { withErrorHandling } from "../../lib/error-handler";
import { ForbiddenError, BadRequestError } from "../../lib/errors";

import { createDependencies, AppDependencies } from "../../lib/dependencies";

import { bodyParser, getPartnerGroup } from "../../lib/utils";
import { IngestProductionSchema } from "../../lib/schemas";

const deps: AppDependencies = createDependencies();

async function handle(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const partnerId = getPartnerGroup(event);
  if (!partnerId) {
    throw new ForbiddenError("Not a registered Partner");
  }

  switch (event.httpMethod) {
    case "GET": {
      const batches = await deps.listPartnerBatches.execute(partnerId);

      return {
        statusCode: 200,
        body: JSON.stringify(batches),
      };
    }

    case "POST": {
      if (event.resource.includes("allocations")) {
        // Allocate order
        const batchId = event.pathParameters?.id;
        if (!batchId) {
          throw new BadRequestError("Missing batch id in path parameters");
        }

        const input = bodyParser(event.body);
        const result = await deps.allocateOrder.execute(
          batchId,
          input,
          partnerId,
        );

        return {
          statusCode: 201,
          body: JSON.stringify({
            message: "Order allocated successfully",
            ...result,
          }),
        };
      } else {
        // Ingest production data
        const rawBody = bodyParser(event.body);
        const validatedInput = IngestProductionSchema.parse(rawBody);
        const result = await deps.ingestProductionData.execute(
          validatedInput,
          partnerId,
        );

        return {
          statusCode: 200,
          body: JSON.stringify(result),
        };
      }
    }

    default: {
      throw new BadRequestError("Method Not Allowed");
    }
  }
}

export const handler = withErrorHandling(handle);
