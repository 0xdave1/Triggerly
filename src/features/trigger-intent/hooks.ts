import { useMutation } from "@tanstack/react-query";
import { parseIntent } from "./api";

export function useParseIntent() {
  return useMutation({ mutationFn: parseIntent });
}
