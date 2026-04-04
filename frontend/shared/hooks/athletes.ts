import { useQuery } from "@tanstack/react-query";

import { getAthlete } from "../api/modules/athletes";

export const athleteKeys = {
  all: ["athletes"] as const,
  detail: (id: string) => [...athleteKeys.all, id] as const
};

export const useAthlete = (id: string) =>
  useQuery({
    queryKey: athleteKeys.detail(id),
    queryFn: () => getAthlete(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5
  });
