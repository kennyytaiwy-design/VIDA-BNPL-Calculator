import Image from "next/image";
import { Box, Heading, Text } from "@chakra-ui/react";

export function PageHeader() {
  return (
    <Box textAlign="center" mb={{ base: 6, md: 10 }}>
      <Box display="flex" justifyContent="center" mb={4}>
        <Image
          src="/logo.png"
          alt="VIDA Logo"
          width={133}
          height={40}
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
