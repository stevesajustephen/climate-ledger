import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { withErrorHandling } from "../../lib/error-handler";
import { ForbiddenError, BadRequestError } from "../../lib/errors";

import { createDependencies, AppDependencies } from "../../lib/dependencies";

import { bodyParser, getRetailerGroup } from "../../lib/utils";

import { Schemas } from "../../lib/schemas";

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
      const rawData = bodyParser(event.body);

      const validatedInput = Schemas.ConfirmOrder.parse(rawData);
      const { batchId, orderId, ...input } = validatedInput;

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

export const handler = withErrorHandling(handle);
