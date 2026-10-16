import { CalculatorPage } from "@/components/CalculatorPage";
import { DEFAULT_MERCHANT } from "@/src/config/merchants";

export default function Home() {
  return <CalculatorPage merchant={DEFAULT_MERCHANT} />;
}
