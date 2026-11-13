"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { Box, Container, Flex, Heading } from "@chakra-ui/react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import { LoanDetailsForm } from "@/components/LoanDetailsForm";
import { RepaymentSummaryCard } from "@/components/RepaymentSummaryCard";
import { RepaymentResult } from "@/lib/calculateRepayment";
import type { MerchantConfig } from "@/src/config/merchants";

interface CalculatorPageProps {
  merchant: MerchantConfig;
}

/**
 * The full calculator page UI, shared by "/" (DEFAULT_MERCHANT) and "/[merchant]".
 * Moved verbatim from app/page.tsx; the only change is that the merchant is a prop.
 */
export function CalculatorPage({ merchant }: CalculatorPageProps) {
  const [repaymentResult, setRepaymentResult] = useState<RepaymentResult | null>(null);
  const posthog = usePostHog();

  // "calculator_viewed" fires once each time a calculator opens, and again if the
  // merchant changes. The ref keeps React strict mode (which runs effects twice
  // in development) from sending it twice.
  const lastViewedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (lastViewedSlug.current === merchant.slug) return;
    lastViewedSlug.current = merchant.slug;
    posthog.capture("calculator_viewed", {
      merchant_slug: merchant.slug,
      merchant_name: merchant.name,
    });
  }, [posthog, merchant.slug, merchant.name]);

  const handleCalculate = (result: RepaymentResult) => {
    console.log("Lifted Repayment Result in app/page.tsx:", result);
    setRepaymentResult(result);
  };

  return (
    <Box bg="background" minH="100vh" py={{ base: 6, md: 12 }}>
      {/* Dev verification log */}
      {repaymentResult && (
        <span style={{ display: "none" }}>
          {JSON.stringify(repaymentResult)}
        </span>
      )}
      <Container maxW="6xl" mx="auto" px={{ base: 4, md: 8 }}>
        <PageHeader
          merchantSlug={merchant.slug}
          merchantName={merchant.name}
        />

        <Flex
          direction={{ base: "column", md: "row" }}
          gap={{ base: 5, md: 8 }}
          alignItems="stretch"
        >
          {/* Loan Details Card */}
          <Box
            flex="1"
            w="full"
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border"
            boxShadow="sm"
            display="flex"
            flexDirection="column"
          >
            <Box px={{ base: 4, md: 6 }} py={{ base: 3, md: 4 }} borderBottomWidth="1px" borderColor="border">
              <Heading as="h2" size="lg" color="primary">
                Loan Details
              </Heading>
            </Box>
            <Box p={{ base: 4, md: 6 }} flex="1" display="flex" flexDirection="column">
              <LoanDetailsForm merchant={merchant} onCalculate={handleCalculate} />
            </Box>
          </Box>

          {/* Repayment Summary Card */}
          <Box
            flex="1"
            w="full"
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border"
            boxShadow="sm"
            display="flex"
            flexDirection="column"
          >
            <Box px={{ base: 4, md: 6 }} py={{ base: 3, md: 4 }} borderBottomWidth="1px" borderColor="border">
              <Heading as="h2" size="lg" color="primary">
                Repayment Summary
              </Heading>
            </Box>
            <Box p={{ base: 4, md: 6 }} flex="1" display="flex" flexDirection="column">
              <RepaymentSummaryCard merchant={merchant} result={repaymentResult} />
            </Box>
          </Box>
        </Flex>

        <PageFooter />
      </Container>
    </Box>
  );
}
