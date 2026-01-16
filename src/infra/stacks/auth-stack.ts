import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { OAuthScope, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class AuthStack extends Stack {
  public userPool: UserPool;
  public userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.createUserPool();
    this.createUserPoolClient();
  }

  private createUserPool() {
    this.userPool = new UserPool(this, "ClimateLedgerUserPool", {
      userPoolName: "climate-ledger-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
    });

    this.userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: "climate-ledger-auth-unique",
      },
    });

    new CfnOutput(this, "ClimateLedgerUserPoolId", {
      value: this.userPool.userPoolId,
    });
  }
  private createUserPoolClient() {
    this.userPoolClient = this.userPool.addClient("ClimateLedgerClient", {
      userPoolClientName: "PartnerAppSupplier",
      oAuth: {
        flows: {
          authorizationCodeGrant: true, // Gold standard for 2026
        },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: ["http://localhost:5173/"], // Redirect here after login
        logoutUrls: ["http://localhost:5173/"], // Redirect here after logout
      },
    });
    new CfnOutput(this, "ClimateLedgerClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
