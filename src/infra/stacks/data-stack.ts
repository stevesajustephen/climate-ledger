import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  AttributeType,
  ITable,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import {
  BlockPublicAccess,
  Bucket,
  HttpMethods,
  IBucket,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class DataStack extends Stack {
  public readonly climateLedgerTable: Table;
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
          allowedOrigins: ["http://localhost:5173", "http://localhost:4173"],
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

    this.climateLedgerTable.addGlobalSecondaryIndex({
      indexName: "PartnerMetadataIndex",
      partitionKey: {
        name: "partner_id",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    this.climateLedgerTable.addGlobalSecondaryIndex({
      indexName: "RetailerOrdersIndex",
      partitionKey: {
        name: "retailer_id",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
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
