import { Stack, StackProps } from "aws-cdk-lib";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  MethodOptions,
  ResourceOptions,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";

import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
  climateLedgerLambdaIntegration: LambdaIntegration;
  retailerOrdersLambdaIntegration: LambdaIntegration;
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
      },
    );

    authorizer._attachToApi(api);

    const optionWithAuth: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.authorizerId,
      },
    };

    const optionsWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    const climateResource = api.root.addResource(
      "climate-ledger",
      optionsWithCors,
    );
    const batchResource = climateResource.addResource("{id}");
    const allocationResource = batchResource.addResource(
      "allocations",
      optionsWithCors,
    );

    allocationResource.addMethod(
      "POST",
      props.climateLedgerLambdaIntegration,
      optionWithAuth,
    );
    climateResource.addMethod(
      "GET",
      props.climateLedgerLambdaIntegration,
      optionWithAuth,
    );
    climateResource.addMethod(
      "POST",
      props.climateLedgerLambdaIntegration,
      optionWithAuth,
    );

    //retailer

    const retailerResource = api.root.addResource("retailer", optionsWithCors);
    const specificRetailer = retailerResource.addResource("{retailerId}");
    const retailerOrders = specificRetailer.addResource(
      "orders",
      optionsWithCors,
    );
    retailerOrders.addMethod(
      "GET",
      props.retailerOrdersLambdaIntegration,
      optionWithAuth,
    );
  }
}
