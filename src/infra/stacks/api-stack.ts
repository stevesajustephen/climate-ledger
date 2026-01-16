import { Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  MethodOptions,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";

import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
  climateLedgerLambdaIntegration: LambdaIntegration;
  userPool: IUserPool;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const api = new RestApi(this, "climateApi");

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      "ClimateApiAuthorizer",
      {
        cognitoUserPools: [props.userPool],
        identitySource: "method.request.header.authorization",
      }
    );

    authorizer._attachToApi(api);

    const optionWithAuth: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
    };

    const climateResource = api.root.addResource("climate-ledger");

    climateResource.addMethod(
      "GET",
      props.climateLedgerLambdaIntegration,
      optionWithAuth
    );

    climateResource.addMethod(
      "POST",
      props.climateLedgerLambdaIntegration,
      optionWithAuth
    );
  }
}
