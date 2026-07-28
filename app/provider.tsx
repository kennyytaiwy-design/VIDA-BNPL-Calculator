"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "./theme";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!phKey || !phHost) {
      console.warn("PostHog initialization skipped: NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST is missing.");
      return;
    }

    posthog.init(phKey, {
      api_host: phHost,
      person_profiles: "identified_only",
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <ChakraProvider value={system}>
        {children}
      </ChakraProvider>
    </PostHogProvider>
  );
}
