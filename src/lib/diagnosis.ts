import { prisma } from "./prisma";
import { Syndrome } from '@/generated/prisma-client';

/**
 * Certainty Factor (CF) Calculation Utility
 * CF_combine = CF1 + CF2 * (1 - CF1)
 */
export function calculateCombinedCF(weights: number[]): number {
  if (weights.length === 0) return 0;

  return weights.reduce((cf1, cf2) => {
    return cf1 + cf2 * (1 - cf1);
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
 */
export async function diagnose(symptomOptionIds: string[]) {
  // 1. Fetch all rules matching the selected symptoms
  const rules = await prisma.syndromeRule.findMany({
    where: {
      symptomOptionId: { in: symptomOptionIds },
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
