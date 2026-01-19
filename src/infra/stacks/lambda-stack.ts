import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "node:path";

interface LambdaStackProps extends StackProps {
  climateLedgerTable: ITable;
}

export class LambdaStack extends Stack {
  public readonly climateLedgerLambdaIntegration: LambdaIntegration;

  public readonly retailerOrdersLambdaIntegration: LambdaIntegration;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const ingestProductionLambda = new NodejsFunction(
      this,
      "IngestProductionHandler",
      {
        functionName: "climate-ledger-ingest-production",
        runtime: Runtime.NODEJS_20_X,
        handler: "handler",
        entry: join(__dirname, "../../services/partners/handler.ts"),
        environment: {
          TABLE_NAME: props.climateLedgerTable?.tableName,
        },
      },
    );

    // props.climateLedgerTable.grantWriteData(ingestProductionLambda);

    ingestProductionLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [props.climateLedgerTable.tableArn],
        actions: [
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
      }),
    );

    const retailerOrdersLambda = new NodejsFunction(
      this,
      "RetailerOrdersHandler",
      {
        functionName: "climate-ledger-retailer-orders",
        runtime: Runtime.NODEJS_20_X,
        handler: "handler",
        // This points to your new service folder
        entry: join(__dirname, "../../services/retailers/handler.ts"),
        environment: {
          TABLE_NAME: props.climateLedgerTable?.tableName,
        },
      },
    );

    retailerOrdersLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [props.climateLedgerTable.tableArn],
        actions: [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
        ],
      }),
    );

    this.climateLedgerLambdaIntegration = new LambdaIntegration(
      ingestProductionLambda,
    );

    this.retailerOrdersLambdaIntegration = new LambdaIntegration(
      retailerOrdersLambda,
    );
  }
}
