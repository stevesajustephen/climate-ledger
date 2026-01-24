import { ValidationError } from "./errors";

// lib/validator.ts
export class MissingFieldError extends ValidationError {
  constructor(missingField: string) {
    super(`Value for ${missingField} expected!`);
  }
}

export class JsonError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = "JsonError";
  }
}

export function validateIngestProdEntry(arg: any): void {
  if (arg.batchId === undefined) throw new MissingFieldError("batchId");
  if (arg.factoryId === undefined) throw new MissingFieldError("factoryId");
  if (arg.gridFactor === undefined) throw new MissingFieldError("gridFactor");
  if (arg.totalKwh === undefined) throw new MissingFieldError("totalKwh");
  if (arg.totalUnits === undefined) throw new MissingFieldError("totalUnits");
  if (arg.evidenceS3Url === undefined)
    throw new MissingFieldError("evidenceS3Url");
}

// You can add more validators here later, e.g. for allocate-order, confirm-order, etc.
