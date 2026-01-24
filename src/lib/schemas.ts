import { z } from "zod";

const IdSchema = z
  .string()
  .min(1, { message: "ID is required and cannot be empty" });
const PositiveNumber = z
  .number()
  .positive({ message: "Must be a positive number" });
const PositiveInteger = PositiveNumber.int({
  message: "Must be a positive integer",
});

const IngestProduction = z.object({
  batchId: IdSchema,
  factoryId: IdSchema,
  totalKwh: PositiveNumber,
  totalUnits: PositiveNumber,
  gridFactor: PositiveNumber,
  evidenceS3Url: z.string().url({ message: "Must be a valid URL" }),
});

const AllocateOrder = z.object({
  orderId: IdSchema,
  retailerId: IdSchema,
  orderQuantity: PositiveInteger,
  unitWeight: PositiveNumber,
  destination: z
    .string()
    .min(1, { message: "destination is required and cannot be empty" }),
});

const ConfirmOrder = z.object({
  batchId: IdSchema,
  orderId: IdSchema,
  distanceKm: PositiveNumber,
  productName: z
    .string()
    .trim()
    .min(1, { message: "productName is required and cannot be empty" }),
});

export const Schemas = {
  IngestProduction,
  AllocateOrder,
  ConfirmOrder,
} as const;

export type Schemas = {
  IngestProduction: z.infer<typeof Schemas.IngestProduction>;
  AllocateOrder: z.infer<typeof Schemas.AllocateOrder>;
  ConfirmOrder: z.infer<typeof Schemas.ConfirmOrder>;
};
