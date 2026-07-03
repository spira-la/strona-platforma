import { useQuery } from '@tanstack/react-query';
import { availabilityClient } from '@/clients/availability.client';

export function useAvailabilitySlots(params: {
  coachId: string | null;
  date: string | null; // YYYY-MM-DD
  durationMinutes: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: [
      'availability',
      params.coachId,
      params.date,
      params.durationMinutes,
    ],
    queryFn: () =>
      availabilityClient.getSlots({
        coachId: params.coachId!,
        date: params.date!,
        durationMinutes: params.durationMinutes,
      }),
    enabled: Boolean(params.enabled ?? (params.coachId && params.date)),
    staleTime: 30 * 1000,
  });
}
