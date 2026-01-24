import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { withErrorHandling } from "../../lib/error-handler";
import { ForbiddenError, BadRequestError } from "../../lib/errors";

import { createDependencies, AppDependencies } from "../../lib/dependencies";

import { bodyParser, getRetailerGroup } from "../../lib/utils";

const deps: AppDependencies = createDependencies();

async function handle(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const retailerId = getRetailerGroup(event);

  if (!retailerId) {
    throw new ForbiddenError("Not a registered Retailer");
  }

  switch (event.httpMethod) {
    case "GET": {
      const orders = await deps.listRetailerOrders.execute(retailerId);
      return {
        statusCode: 200,
        body: JSON.stringify(orders),
      };
    }

    case "PATCH": {
      const data = bodyParser(event.body);

      if (!data.batchId || !data.orderId) {
        throw new BadRequestError(
          "Missing required fields: batchId and/or orderId",
        );
      }

      if (!data.distanceKm || data.distanceKm <= 0) {
        throw new BadRequestError(
          "distanceKm is required and must be positive",
        );
      }

      if (!data.productName?.trim()) {
        throw new BadRequestError("productName is required");
      }

      const { batchId, orderId, ...input } = data;

      const result = await deps.confirmOrder.execute(
        batchId,
        orderId,
        input,
        retailerId,
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Order received and carbon footprint finalized",
          ...result,
        }),
      };
    }

    default: {
      throw new BadRequestError("Method Not Allowed");
    }
  }
}

// Export wrapped handler – all errors are now handled centrally
export const handler = withErrorHandling(handle);
