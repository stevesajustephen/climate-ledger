import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../src/services/climateLedger/handler";

handler({} as APIGatewayProxyEvent, {} as Context);
