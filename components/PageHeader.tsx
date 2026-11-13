"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { Box, Heading, Text } from "@chakra-ui/react";
import { getMerchantLogo } from "@/src/config/merchant-logos";
import { getMerchant } from "@/src/config/merchants";

/**
 * Page header with logo, title and subtitle.
 *
 * The merchant slug is derived from usePathname() rather than from RSC props.
 * usePathname() is hydration-safe: Next.js guarantees it returns the same path
 * on both the server SSR pass and the client hydration pass, eliminating the
 * mismatch that occurred when merchantSlug arrived via the RSC→Client boundary
 * (where the payload can be missing on the client's first render).
 *
 * No props needed — PageHeader is fully self-contained.
 */
export function PageHeader() {
  const pathname = usePathname() ?? "";
  // "/greenbay" → "greenbay", "/" → "" (root page uses DEFAULT_LOGO)
  const slug = pathname.split("/").filter(Boolean)[0] ?? "";

  const merchant = getMerchant(slug);
  const logo = getMerchantLogo(slug);
  const logoAlt = merchant ? `${merchant.name} Logo` : "VIDA Logo";

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
