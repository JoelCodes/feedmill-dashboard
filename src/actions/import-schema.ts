import { z } from 'zod';

export const productionOrderImportSchema = z.object({
  orderNumber: z.string().min(1, 'Document Number is required'),
  customer: z.string().min(1, 'Customer is required'),
  product: z.string().min(1, 'Product is required'),
  weightLbs: z.number().positive('Weight must be positive'),
  deliveryTime: z.string().min(1, 'Early Delivery Date is required'),
  formulaType: z.string().min(1, 'Formula Type is required'),
  millLine: z.enum(['Premix', 'Excel', 'CGM']).default('Premix'),
  textureType: z.string().nullish(),
  lineCode: z.string().nullish(),
});

export type ProductionOrderImportRow = z.infer<typeof productionOrderImportSchema>;
