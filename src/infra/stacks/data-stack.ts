import { Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DataStack extends Stack {
  public readonly climateLedgerTable: ITable;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const climateLedgerTable = new Table(this, "ClimateLedgerTable", {
      partitionKey: {
        name: "pk",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: AttributeType.STRING,
      },
      tableName: "ClimateLedgerTable",
    });
    this.climateLedgerTable = climateLedgerTable;
  }
}
