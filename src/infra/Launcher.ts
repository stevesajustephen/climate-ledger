import { App } from "aws-cdk-lib";
import { DataStack } from "./stacks/data-stack";
import { LambdaStack } from "./stacks/lambda-stack";
import { ApiStack } from "./stacks/api-stack";
import { AuthStack } from "./stacks/auth-stack";

const app = new App();

const dataStack = new DataStack(app, "DataStack");

const lambdaStack = new LambdaStack(app, "LambdaStack", {
  climateLedgerTable: dataStack.climateLedgerTable,
});

const authStack = new AuthStack(app, "AuthStack", {
  evidenceBucket: dataStack.evidenceBucket,
});

new ApiStack(app, "ApiStack", {
  climateLedgerLambdaIntegration: lambdaStack.climateLedgerLambdaIntegration,
  userPool: authStack.getUserPool(),
});
