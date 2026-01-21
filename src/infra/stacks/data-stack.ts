import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import {
  BlockPublicAccess,
  Bucket,
  HttpMethods,
  IBucket,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class DataStack extends Stack {
  public readonly climateLedgerTable: ITable;
  public readonly publicDisclosuresTable: ITable;

  public readonly evidenceBucket: IBucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.evidenceBucket = new Bucket(this, "EvidenceBucket", {
      bucketName: `evidence-bucket-${Stack.of(this).account}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
          allowedOrigins: ["http://localhost:5173"],
          allowedHeaders: ["*"],
        },
      ],
    });

    new CfnOutput(this, "BucketName", {
      value: this.evidenceBucket.bucketName,
    });

    this.climateLedgerTable = new Table(this, "ClimateLedgerTable", {
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      tableName: "climate-ledger-table",
    });

    this.publicDisclosuresTable = new Table(this, "PublicDisclosuresTable", {
      partitionKey: {
        name: "slug", // Unique ID for the QR code link
        type: AttributeType.STRING,
      },
      tableName: "public-disclosures-table",
    });
  }
}
