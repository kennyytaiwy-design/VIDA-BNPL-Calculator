import { notFound, permanentRedirect } from "next/navigation";
import { CalculatorPage } from "@/components/CalculatorPage";
import { getMerchant, MERCHANTS } from "@/src/config/merchants";

// Pre-build every registered merchant page at deploy time.
// dynamicParams stays at its default (true) so that non-canonical slugs such as
// "/GloWorld" still reach this component and get redirected instead of a bare 404.
export function generateStaticParams(): { merchant: string }[] {
  return Object.keys(MERCHANTS).map((merchant) => ({ merchant }));
}

export default async function MerchantPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant: slug } = await params;
  const canonical = slug.trim().toLowerCase();

  // "/GloWorld" → 308 → "/gloworld" is normally done by proxy.ts before this
  // page runs (see the comment there for why). This is a safety net only.
  if (canonical !== "" && slug !== canonical) {
    permanentRedirect(`/${encodeURIComponent(canonical)}`);
  }

  const config = getMerchant(slug);
  if (!config) {
    notFound();
  }

  return <CalculatorPage merchant={config} />;
}
