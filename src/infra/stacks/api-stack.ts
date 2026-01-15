import { Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
  climateLedgerLambdaIntegration: LambdaIntegration;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new RestApi(this, "climateApi");
    const climateResource = api.root.addResource("climate-ledger");
    climateResource.addMethod("GET", props.climateLedgerLambdaIntegration);
    climateResource.addMethod("POST", props.climateLedgerLambdaIntegration);
  }
}
