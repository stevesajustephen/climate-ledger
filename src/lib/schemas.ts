import { z } from "zod";

export const IngestProductionSchema = z.object({
  batchId: z
    .string()
    .min(1, { message: "batchId is required and cannot be empty" }),
  factoryId: z
    .string()
    .min(1, { message: "factoryId is required and cannot be empty" }),
  totalKwh: z
    .number()
    .positive({ message: "totalKwh must be a positive number" }),
  totalUnits: z
    .number()
    .positive({ message: "totalUnits must be a positive number" }),
  gridFactor: z
    .number()
    .positive({ message: "gridFactor must be a positive number" }),
  evidenceS3Url: z
    .string()
    .url({ message: "evidenceS3Url must be a valid URL" }),
});

export type IngestProductionInput = z.infer<typeof IngestProductionSchema>;
