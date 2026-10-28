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
 * Logo resolution is done client-side via getMerchantLogo() rather than
 * relying on optional RSC prop fields, which Next.js can silently drop
 * across the Server → Client serialisation boundary.
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
