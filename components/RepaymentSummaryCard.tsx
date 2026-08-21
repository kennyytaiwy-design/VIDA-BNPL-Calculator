"use client";

import React from "react";
import { Box, Button, Flex, Text, Stack } from "@chakra-ui/react";
import { RepaymentResult } from "@/lib/calculateRepayment";
import { ResultStat } from "./ResultStat";
import { usePostHog } from "posthog-js/react";

const WHATSAPP_URL =
  "https://wa.me/2349069890516?text=Hi,%20I%20am%20interested%20in%20your%20Buy%20Now%20Pay%20Later%20Service";

interface RepaymentSummaryCardProps {
  result: RepaymentResult | null;
}

export function RepaymentSummaryCard({ result }: RepaymentSummaryCardProps) {
  const posthog = usePostHog();

  if (!result) {
    return (
      <Flex flex="1" w="full" minH="250px" align="center" justify="center" p={6}>
        <Text color="resultLabel" textAlign="center" fontSize="md">
          Enter your loan details and click calculate to see your repayment summary
        </Text>
      </Flex>
    );
  }

  const formatCurrency = (val: number) => {
    return `₦${val.toLocaleString("en-US")}`;
  };

  const handleGetStarted = () => {
    posthog.capture("whatsapp_cta_clicked");
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Box display="flex" flexDirection="column" flex="1" w="full">
      <Stack gap={4} mb={6}>
        <ResultStat
          label="Down Payment"
          value={formatCurrency(result.downPayment)}
        />
        <ResultStat
          label="Monthly Repayment"
          value={formatCurrency(result.monthlyRepayment)}
        />
        <ResultStat
          label={`Payment of ${formatCurrency(result.monthlyRepayment)} every month for`}
          value={`${result.tenor} months`}
        />
      </Stack>

      <Text color="resultLabel" fontSize="sm" textAlign="left" mb={5}>
        N.B: Repayment calculation is based on down payment and tenor.
      </Text>

      <Button
        onClick={handleGetStarted}
        w="full"
        h="50px"
        bg="primary"
        color="white"
        fontWeight="semibold"
        fontSize="md"
        borderRadius="md"
        cursor="pointer"
        _hover={{ bg: "#1a1754" }}
        mt="auto"
      >
        Get Started
      </Button>
    </Box>
  );
}
