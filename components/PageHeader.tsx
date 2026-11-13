"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Box, Heading, Text } from "@chakra-ui/react";
import { getMerchantLogo, DEFAULT_LOGO } from "@/src/config/merchant-logos";

interface PageHeaderProps {
  /** Merchant slug — used to look up logo from the client-side logo registry. */
  merchantSlug?: string;
  /** Merchant display name — used for the logo alt text. */
  merchantName?: string;
}

/**
 * Page header with logo, title and subtitle.
 *
 * Logo and alt text are resolved after mount only. During SSR and the initial
 * hydration pass both server and client render the same neutral default
 * (DEFAULT_LOGO / "VIDA Logo"), eliminating the RSC prop serialisation mismatch
 * that caused React's hydration error. The correct branding is applied
 * immediately after the first paint via useEffect — no visible flash occurs
 * because the merchant logo files are preloaded with priority.
 */
export function PageHeader({ merchantSlug, merchantName }: PageHeaderProps) {
  // Start with the neutral default so SSR HTML === client initial render.
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const [logoAlt, setLogoAlt] = useState("VIDA Logo");

  useEffect(() => {
    setLogo(getMerchantLogo(merchantSlug));
    setLogoAlt(merchantSlug && merchantName ? `${merchantName} Logo` : "VIDA Logo");
  }, [merchantSlug, merchantName]);

  return (
    <Box textAlign="center" mb={{ base: 6, md: 10 }}>
      <Box display="flex" justifyContent="center" mb={4}>
        <Image
          src={logo.src}
          alt={logoAlt}
          width={logo.width}
          height={logo.height}
          style={{ height: "auto" }}
          priority
        />
      </Box>
      <Heading as="h1" size={{ base: "xl", md: "2xl" }} color="primary" mb={2}>
        BNPL Loan Calculator
      </Heading>
      <Text color="resultLabel">
        Kindly calculate your buy now, pay later or pay small small repayment plan
      </Text>
    </Box>
  );
}
