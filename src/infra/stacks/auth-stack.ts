import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  CfnUserPoolGroup,
  OAuthScope,
  UserPool,
  UserPoolClient,
} from "aws-cdk-lib/aws-cognito";
import {
  Effect,
  FederatedPrincipal,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface AuthStackProps extends StackProps {
  evidenceBucket: IBucket;
}

export class AuthStack extends Stack {
  private userPool: UserPool;
  private userPoolClient: UserPoolClient;
  private identityPool: CfnIdentityPool;
  private authenticatedRole: Role;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    this.createUserPool();
    this.createUserPoolClient();
    this.createUserGroups();
    this.createIdentityPool();
    this.createRole(props.evidenceBucket);
    this.attachRole();
  }

  getUserPool(): UserPool {
    return this.userPool;
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

  private createUserGroups() {
    new CfnUserPoolGroup(this, "SupplyPartners", {
      userPoolId: this.userPool.userPoolId,
      groupName: "partner-ABC",
    });

    new CfnUserPoolGroup(this, "RetailerZalando", {
      userPoolId: this.userPool.userPoolId,
      groupName: "retailer-Zalando",
    });
  }

  private createIdentityPool() {
    this.identityPool = new CfnIdentityPool(this, "climateLedgerIdentityPool", {
      identityPoolName: "climate-ledger-identity",
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    new CfnOutput(this, "climateLedgerIdentityPoolId", {
      value: this.identityPool.ref,
    });
  }

  private createRole(evidenceBucket: IBucket) {
    this.authenticatedRole = new Role(this, "PartnerRole", {
      assumedBy: new FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
    });
    this.authenticatedRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
        resources: [evidenceBucket.bucketArn, evidenceBucket.bucketArn + "/*"],
      }),
    );
  }

  private attachRole() {
    new CfnIdentityPoolRoleAttachment(this, "RoleAttachment", {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
      },
      roleMappings: {
        adminsMapping: {
          type: "Token",
          ambiguousRoleResolution: "AuthenticatedRole",
          identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
        },
      },
    });
  }
}
