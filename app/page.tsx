"use client";

import { useState } from "react";
import { Box, Container, Flex, Heading } from "@chakra-ui/react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import { LoanDetailsForm } from "@/components/LoanDetailsForm";
import { RepaymentSummaryCard } from "@/components/RepaymentSummaryCard";
import { RepaymentResult } from "@/lib/calculateRepayment";

export default function Home() {
  const [repaymentResult, setRepaymentResult] = useState<RepaymentResult | null>(null);

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
        <PageHeader />

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
            <Box p={{ base: 4, md: 6 }} flex="1">
              <LoanDetailsForm onCalculate={handleCalculate} />
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
            <Box p={{ base: 4, md: 6 }} flex="1">
              <RepaymentSummaryCard result={repaymentResult} />
            </Box>
          </Box>
        </Flex>

        <PageFooter />
      </Container>
    </Box>
  );
}
