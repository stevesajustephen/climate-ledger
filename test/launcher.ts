import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../src/services/climate-ledger/handler";

handler(
  {
    httpMethod: "POST",
    body: JSON.stringify({
      batchId: 1,
      factoryId: "ABC",
      totalKwh: 10000,
      totalUnits: 1000,
      gridFactor: 1,
    }),
  } as unknown as APIGatewayProxyEvent,
  {} as Context
);
