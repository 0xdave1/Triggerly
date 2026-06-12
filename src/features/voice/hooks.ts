import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getVoiceSettings, updateVoiceSettings } from "./api";

export const voiceKeys = {
  settings: ["voice", "settings"] as const
};

export function useVoiceSettings() {
  return useQuery({ queryKey: voiceKeys.settings, queryFn: getVoiceSettings });
}

export function useUpdateVoiceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVoiceSettings,
    onSuccess: (settings) => queryClient.setQueryData(voiceKeys.settings, settings)
  });
}
