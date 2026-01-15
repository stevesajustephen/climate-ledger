import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "node:path";

interface LambdaStackProps extends StackProps {
  climateLedgerTable: ITable;
}

export class LambdaStack extends Stack {
  public readonly climateLedgerLambdaIntegration: LambdaIntegration;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const climateLedgerLambda = new NodejsFunction(
      this,
      "ClimateLedgerLambda",
      {
        runtime: Runtime.NODEJS_20_X,
        handler: "handler",
        entry: join(__dirname, "../../services/climateLedger/handler.ts"),
        environment: {
          TABLE_NAME: props.climateLedgerTable?.tableName,
        },
      }
    );

    this.climateLedgerLambdaIntegration = new LambdaIntegration(
      climateLedgerLambda
    );
  }
}
