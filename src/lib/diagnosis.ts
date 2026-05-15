import { prisma } from "./prisma";
import { Syndrome } from '@/generated/prisma-client';

/**
 * Certainty Factor (CF) Calculation Utility
 * Standard CF combination formula:
 * 1. CF1 > 0, CF2 > 0: CF = CF1 + CF2 * (1 - CF1)
 * 2. CF1 < 0, CF2 < 0: CF = CF1 + CF2 * (1 + CF1)
 * 3. CF1 * CF2 < 0: CF = (CF1 + CF2) / (1 - min(|CF1|, |CF2|))
 */
export function calculateCombinedCF(weights: number[]): number {
  if (weights.length === 0) return 0;

  return weights.reduce((cf1, cf2) => {
    // Handle absolute contradiction
    if ((cf1 === 1 && cf2 === -1) || (cf1 === -1 && cf2 === 1)) return 0;
    
    // Handle absolute certainty
    if (cf1 === 1 || cf2 === 1) return 1;
    if (cf1 === -1 || cf2 === -1) return -1;

    if (cf1 >= 0 && cf2 >= 0) {
      return cf1 + cf2 * (1 - cf1);
    } else if (cf1 < 0 && cf2 < 0) {
      return cf1 + cf2 * (1 + cf1);
    } else {
      // Mixed signs
      return (cf1 + cf2) / (1 - Math.min(Math.abs(cf1), Math.abs(cf2)));
    }
  });
}

export type ConfidenceLevel =
  | "Highly Likely"
  | "Likely"
  | "Possible"
  | "Unlikely";

export function mapConfidenceToLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 80) return "Highly Likely";
  if (confidence >= 50) return "Likely";
  if (confidence >= 20) return "Possible";
  return "Unlikely";
}

/**
 * Performs TCM Syndrome diagnosis based on selected symptom options.
 * Calculates CF scores for all matching syndromes.
 * 
 * Production Note: Optional complaintId filtering ensures we only consider 
 * syndromes relevant to the patient's primary complaint.
 */
export async function diagnose(symptomOptionIds: string[], complaintId?: string) {
  // 1. Fetch all rules matching the selected symptoms
  const rules = await prisma.syndromeRule.findMany({
    where: {
      symptomOptionId: { in: symptomOptionIds },
      // Filter by complaint if provided
      syndrome: complaintId ? {
        complaints: {
          some: { complaintId }
        }
      } : undefined
    },
    include: {
      syndrome: true,
    },
  });

  // 2. Group rules by Syndrome
  const syndromeWeights: Record<
    string,
    { syndromeId: string; syndrome: Syndrome; weights: number[] }
  > = {};

  rules.forEach((rule) => {
    const { syndromeId, syndrome, cfWeight } = rule;
    if (!syndromeWeights[syndromeId]) {
      syndromeWeights[syndromeId] = {
        syndromeId,
        syndrome,
        weights: [cfWeight],
      };
    } else {
      syndromeWeights[syndromeId].weights.push(cfWeight);
    }
  });

  // 3. Calculate final CF for each syndrome
  return Object.values(syndromeWeights)
    .map((item) => {
      const cfScore = calculateCombinedCF(item.weights);
      const confidence = Math.round(cfScore * 100);
      return {
        ...item.syndrome,
        syndromeId: item.syndrome.id,
        cfScore,
        confidence,
        confidenceLevel: mapConfidenceToLevel(confidence),
      };
    })
    .sort((a, b) => b.cfScore - a.cfScore);
}
