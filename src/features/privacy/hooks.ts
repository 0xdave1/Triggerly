import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPrivacySettings, updatePrivacySettings } from "./api";

export const privacyKeys = {
  settings: ["privacy", "settings"] as const
};

export function usePrivacySettings() {
  return useQuery({ queryKey: privacyKeys.settings, queryFn: getPrivacySettings });
}

export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePrivacySettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: privacyKeys.settings })
  });
}
