import type { Metadata } from "next";
import { CalculatorPage } from "@/components/CalculatorPage";
import { DEFAULT_MERCHANT } from "@/src/config/merchants";

// Manifest link only on "/" — merchant and not-found pages must not carry it.
export const metadata: Metadata = {
  manifest: "/manifest.json",
};

export default function Home() {
  return <CalculatorPage merchant={DEFAULT_MERCHANT} />;
}
