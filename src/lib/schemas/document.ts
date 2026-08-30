import { z } from "zod";
import { DOCUMENT_TYPES } from "@/lib/types";

export const documentTypeSchema = z.enum(DOCUMENT_TYPES);

export const saveTemplateSchema = z.object({
  templateId: z.string().min(1),
  body: z.string().min(20, "Template body is too short."),
  changeNote: z.string().max(500).optional().nullable(),
});

export const generateDocumentSchema = z.object({
  claimMirrorId: z.string().min(1),
  documentType: documentTypeSchema,
  notes: z.string().max(2000).optional().nullable(),
});

export const sendForSignatureSchema = z.object({
  generatedDocumentId: z.string().min(1),
  recipientName: z.string().min(1).optional(),
  recipientEmail: z.string().email().optional(),
});

export const nextDocumentQuerySchema = z.object({
  claimId: z.string().min(1).optional(),
  claimNumber: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  aobApplicable: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});
