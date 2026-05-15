import { 
  Complaint, 
  SymptomCategory, 
  SymptomOption, 
  Syndrome,
  Consultation
} from '@/generated/prisma-client';

/**
 * Custom type for error response
 */
interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Production-grade API client for centralized error handling and consistent fetching.
 */
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error: ApiError = new Error(data.error || 'An unexpected error occurred');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export type AdminStats = {
  complaintsCount: number;
  syndromesCount: number;
  rulesCount: number;
  contributorsCount: number;
  recentConsultations: (Consultation & { complaint: Complaint })[];
};

export const api = {
  admin: {
    stats: () => fetcher<AdminStats>('/api/admin/stats'),
  },
  complaints: {
    list: () => fetcher<Complaint[]>('/api/complaints'),
  },
  symptoms: {
    list: (complaintId?: string) => {
      const url = new URL('/api/symptoms/all', window.location.origin);
      if (complaintId) url.searchParams.set('complaintId', complaintId);
      return fetcher<(SymptomCategory & { 
        options: (SymptomOption & { syndromeRules: { syndromeId: string }[] })[];
        syndromeCount: number;
      })[]>(url.toString());
    },
  },
  diagnose: (data: {
    symptomOptionIds: string[];
    patientData: { age: string; gender: string };
    complaintId: string;
  }) => fetcher<(Syndrome & { confidence: number; confidenceLevel: string })[]>('/api/diagnose', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
