"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "./theme";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import EmotionRegistry from "./EmotionRegistry";

// Start PostHog as soon as this file loads in the browser, before any page
// component runs. Page components fire "calculator_viewed" when they open; if
// PostHog started later (in a useEffect here), that first event would be dropped.
if (typeof window !== "undefined") {
  const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!phKey || !phHost) {
    console.warn("PostHog initialization skipped: NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST is missing.");
  } else if (!posthog.__loaded) {
    posthog.init(phKey, {
      api_host: phHost,
      person_profiles: "identified_only",
      // PostHog normally copies the FIRST page of a visit (e.g. /gloworld) onto
      // every later event in that visit, even events from "/". Drop those fields
      // so an event only ever describes the page it came from. The merchant is
      // sent explicitly as merchant_slug / merchant_name on each event instead.
      property_denylist: [
        "$session_entry_url",
        "$session_entry_pathname",
        "$prev_pageview_pathname",
      ],
    });
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <EmotionRegistry>
        <ChakraProvider value={system}>
          {children}
        </ChakraProvider>
      </EmotionRegistry>
    </PostHogProvider>
  );
}
