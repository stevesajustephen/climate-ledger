import { IngestProdEntry } from "../model/model";

export class MissingFieldError extends Error {
  constructor(missingField: string) {
    super(`Value for ${missingField} expected!`);
  }
}

export class JsonError extends Error {}

export function validateAsIngestProdEntry(arg: any) {
  if ((arg as IngestProdEntry).batchId == undefined) {
    throw new MissingFieldError("batchId");
  }
  if ((arg as IngestProdEntry).factoryId == undefined) {
    throw new MissingFieldError("factoryId");
  }
  if ((arg as IngestProdEntry).gridFactor == undefined) {
    throw new MissingFieldError("gridFactor");
  }
  if ((arg as IngestProdEntry).totalKwh == undefined) {
    throw new MissingFieldError("totalKwh");
  }
  if ((arg as IngestProdEntry).totalUnits == undefined) {
    throw new MissingFieldError("totalUnits");
  }
}
