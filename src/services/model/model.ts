export interface IngestProdEntry {
  batchId: string;
  factoryId: string;
  totalKwh: number;
  totalUnits: number;
  gridFactor: number;
  evidenceS3Url: string;
}
