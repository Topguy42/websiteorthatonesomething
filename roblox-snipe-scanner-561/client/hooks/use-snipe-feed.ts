import { useQuery } from "@tanstack/react-query";
import type { SnipeFeedResponse } from "@shared/api";

export function useSnipeFeed() {
  return useQuery({
    queryKey: ["snipe-feed"],
    queryFn: async () => {
      const response = await fetch("/api/snipes/feed");

      if (!response.ok) {
        throw new Error("Failed to load Snipez feed");
      }

      return (await response.json()) as SnipeFeedResponse;
    },
    refetchInterval: 45_000,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
