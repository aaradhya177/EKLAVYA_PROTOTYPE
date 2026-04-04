import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createPlan, getPlan } from "../api/modules/career";

import { handleMutationError, handleMutationSuccess } from "./helpers";

export const careerKeys = {
  all: ["career"] as const,
  plan: (athleteId: string) => [...careerKeys.all, "plan", athleteId] as const
};

export const useCareerPlan = (athleteId: string) =>
  useQuery({
    queryKey: careerKeys.plan(athleteId),
    queryFn: () => getPlan(athleteId),
    enabled: Boolean(athleteId)
  });

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlan,
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries({
        queryKey: careerKeys.plan(plan.athlete_id)
      });
      handleMutationSuccess("Development plan saved");
    },
    onError: () => {
      handleMutationError("Unable to save development plan");
    }
  });
};
