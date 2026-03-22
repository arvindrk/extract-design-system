import { z } from "zod";

export const normalizedDesignSystemSchema = z.object({
  source: z.object({
    url: z.url(),
    extractedAt: z.string().datetime(),
    extractor: z.literal("dembrandt")
  }),
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
    background: z.string().optional(),
    foreground: z.string().optional(),
    palette: z.array(z.string()),
    cssVariables: z.record(z.string(), z.string())
  }),
  typography: z.object({
    headingFont: z.string().optional(),
    bodyFont: z.string().optional(),
    monoFont: z.string().optional()
  }),
  spacing: z.object({
    scale: z.array(z.string())
  }),
  radius: z.object({
    scale: z.array(z.string())
  }),
  shadows: z.object({
    scale: z.array(z.string())
  })
});

export type NormalizedDesignSystem = z.infer<typeof normalizedDesignSystemSchema>;
