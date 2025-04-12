import { z } from "zod";

const symbolItemSchema = z.object({
    is_valid: z.boolean(),
    rfq_allowed: z.boolean(),
    name: z.string(),
    symbol: z.string(),
    asset: z.string(),
    price_precision: z.number(),
    quantity_precision: z.number(), 
    symbol_id: z.number(),
    trading_fee: z.number(),
    min_acceptable_quote_value: z.number(),
    min_acceptable_portion_lf: z.number(),
    max_leverage: z.number(),
    hedger_fee_open: z.string(),
    hedger_fee_close: z.string(),
    max_notional_value: z.number(),
    max_funding_rate: z.number()
});

const apiResponseSchema = z.object({
    count: z.number(),
    symbols: z.array(symbolItemSchema),
    message: z.string()
});

export type OrbsApiResponse = z.infer<typeof apiResponseSchema>;