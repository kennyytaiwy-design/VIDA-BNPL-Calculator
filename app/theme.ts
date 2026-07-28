import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        primary: { value: "#0F0D35" },
        background: { value: "#F9FAFB" },
        border: { value: "#DCDBEA" },
        resultValue: { value: "#060089" },
        resultLabel: { value: "#565568" },
        resultCardBg: { value: "#F5F5FF" },
        amberIcon: { value: "#E5A330" },
        disabledButton: { value: "#9F9EAE" },
        error: { value: "#FF5656" },
      },
      fonts: {
        heading: { value: "var(--font-clash-display)" },
        body: { value: "var(--font-clash-grotesk)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
