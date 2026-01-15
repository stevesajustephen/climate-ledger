import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../src/services/climate-ledger/handler";

handler({} as APIGatewayProxyEvent, {} as Context);
