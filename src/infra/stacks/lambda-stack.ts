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
  publicDisclosuresTable: ITable;
}

export class LambdaStack extends Stack {
  public readonly climateLedgerLambdaIntegration: LambdaIntegration;

  public readonly retailerOrdersLambdaIntegration: LambdaIntegration;

  public readonly publicReadLambdaIntegration: LambdaIntegration;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const ingestProductionLambda = new NodejsFunction(
      this,
      "IngestProductionHandler",
      {
        functionName: "climate-ledger-ingest-production",
        runtime: Runtime.NODEJS_20_X,
        handler: "handler",
        memorySize: 1024,
        entry: join(__dirname, "../../adapters/input/partners.handler.ts"),
        environment: {
          TABLE_NAME: props.climateLedgerTable?.tableName,
        },
      },
    );

    // props.climateLedgerTable.grantWriteData(ingestProductionLambda);

    ingestProductionLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          props.climateLedgerTable.tableArn,
          `${props.climateLedgerTable.tableArn}/index/PartnerMetadataIndex`,
        ],
        actions: [
          "dynamodb:PutItem",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
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
        memorySize: 1024,
        entry: join(__dirname, "../../adapters/input/retailers.handler.ts"),
        environment: {
          TABLE_NAME: props.climateLedgerTable?.tableName,
          PUBLIC_TABLE_NAME: props.publicDisclosuresTable?.tableName,
        },
      },
    );

    retailerOrdersLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [
          props.climateLedgerTable.tableArn,
          `${props.climateLedgerTable.tableArn}/index/RetailerOrdersIndex`,
          props.publicDisclosuresTable.tableArn,
        ],
        actions: [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:PutItem",
          "dynamodb:Scan",
        ],
      }),
    );

    //public lambda
    const publicReadLambda = new NodejsFunction(this, "PublicReadHandler", {
      functionName: "climate-ledger-public-read",
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      memorySize: 1024,
      entry: join(__dirname, "../../adapters/input/public.handler.ts"),
      environment: {
        PUBLIC_TABLE_NAME: props.publicDisclosuresTable?.tableName,
      },
    });

    publicReadLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: [props.publicDisclosuresTable.tableArn],
        actions: ["dynamodb:GetItem"],
      }),
    );

    this.climateLedgerLambdaIntegration = new LambdaIntegration(
      ingestProductionLambda,
    );

    this.retailerOrdersLambdaIntegration = new LambdaIntegration(
      retailerOrdersLambda,
    );

    this.publicReadLambdaIntegration = new LambdaIntegration(publicReadLambda);
  }
}
