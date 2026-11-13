"use client";

import Image from "next/image";
import { Box, Heading, Text } from "@chakra-ui/react";
import { getMerchantLogo } from "@/src/config/merchant-logos";

interface PageHeaderProps {
  /** Merchant slug — used to look up logo from the client-side logo registry. */
  merchantSlug?: string;
  /** Merchant display name — used for the logo alt text. */
  merchantName?: string;
}

/**
 * Page header with logo, title and subtitle.
 *
 * Logo is resolved synchronously from props via getMerchantLogo() so it is
 * available on the very first render (no flash of default logo).
 *
 * suppressHydrationWarning on <Image> silences the React hydration warning
 * that can fire when the RSC-serialised merchantSlug arrives a tick later than
 * the server-rendered HTML. The logo src — the visually meaningful attribute —
 * is always correct because getMerchantLogo() is deterministic given the slug.
 */
export function PageHeader({ merchantSlug, merchantName }: PageHeaderProps) {
  const logo = getMerchantLogo(merchantSlug);
  const logoAlt = merchantSlug && merchantName ? `${merchantName} Logo` : "VIDA Logo";

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
          suppressHydrationWarning
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
