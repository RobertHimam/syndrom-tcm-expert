import { z } from "zod";

export const patientSchema = z.object({
  age: z.coerce.number().min(0).max(120),
  gender: z.enum(["Male", "Female"]),
});

export const diagnoseSchema = z.object({
  symptomOptionIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one symptom"),
  patientData: patientSchema,
  complaintId: z.string().uuid(),
});

export const syndromeRuleSchema = z.object({
  syndromeId: z.string().uuid(),
  symptomOptionId: z.string().uuid(),
  cfWeight: z.number().min(-1).max(1),
});

export const syndromeSchema = z.object({
  name: z.string().min(2),
  therapyPrinciple: z.string().min(5),
  acupoints: z.string().min(2),
  complaintIds: z.array(z.string().uuid()).optional(),
});

export const complaintSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  syndromeIds: z.array(z.string().uuid()).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
