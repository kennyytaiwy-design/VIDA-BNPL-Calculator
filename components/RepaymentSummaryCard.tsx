import React from "react";
import { Box, Flex, Text, Stack } from "@chakra-ui/react";
import { RepaymentResult } from "@/lib/calculateRepayment";
import { ResultStat } from "./ResultStat";

interface RepaymentSummaryCardProps {
  result: RepaymentResult | null;
}

export function RepaymentSummaryCard({ result }: RepaymentSummaryCardProps) {
  if (!result) {
    return (
      <Flex h="full" minH="250px" align="center" justify="center" p={6}>
        <Text color="resultLabel" textAlign="center" fontSize="md">
          Enter your loan details and click calculate to see your repayment summary
        </Text>
      </Flex>
    );
  }

  const formatCurrency = (val: number) => {
    return `₦${val.toLocaleString("en-US")}`;
  };

  return (
    <Box>
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

      <Text color="resultLabel" fontSize="sm" textAlign="left">
        N.B: Repayment calculation is based on down payment and tenor.
      </Text>
    </Box>
  );
}
