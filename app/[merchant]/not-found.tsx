"use client";

import Image from "next/image";
import NextLink from "next/link";
import { Box, Button, Container, Flex, Heading, Text } from "@chakra-ui/react";
import { PageFooter } from "@/components/PageFooter";

/** Outline storefront icon, drawn inline like InfoIcon in LoanDetailsForm. */
const StoreIcon = ({ size = 32 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--chakra-colors-primary)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: "block" }}
  >
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 12v8h14v-8" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

export default function MerchantNotFound() {
  return (
    <Box bg="background" minH="100vh" py={{ base: 6, md: 12 }} display="flex" flexDirection="column">
      <Container maxW="6xl" mx="auto" px={{ base: 4, md: 8 }} flex="1" display="flex" flexDirection="column">
        <Box display="flex" justifyContent="center" mb={{ base: 6, md: 10 }}>
          <NextLink href="/" aria-label="Go to the default calculator">
            <Image
              src="/logo.png"
              alt="VIDA Logo"
              width={133}
              height={40}
              style={{ height: "auto" }}
              priority
            />
          </NextLink>
        </Box>

        <Flex flex="1" align="center" justify="center">
          <Box
            as="main"
            w="full"
            maxW="480px"
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border"
            boxShadow="sm"
            px={{ base: 5, md: 10 }}
            py={{ base: 8, md: 12 }}
            textAlign="center"
          >
            <Flex
              mx="auto"
              mb={{ base: 5, md: 6 }}
              w={{ base: "72px", md: "80px" }}
              h={{ base: "72px", md: "80px" }}
              borderRadius="full"
              bg="resultCardBg"
              align="center"
              justify="center"
            >
              <StoreIcon size={32} />
            </Flex>

            <Heading as="h1" size={{ base: "xl", md: "2xl" }} color="primary" mb={3}>
              Merchant not found
            </Heading>

            <Text color="resultLabel" fontSize={{ base: "sm", md: "md" }} lineHeight="tall" mb={{ base: 6, md: 8 }}>
              We couldn&apos;t find a calculator for this link. Please check the link or contact the merchant.
            </Text>

            <Button
              asChild
              id="open-default-calculator"
              w="full"
              h="50px"
              bg="primary"
              color="white"
              fontWeight="semibold"
              fontSize="md"
              borderRadius="md"
              _hover={{ bg: "#1a1754" }}
            >
              <NextLink href="/">Open default calculator</NextLink>
            </Button>
          </Box>
        </Flex>

        <PageFooter />
      </Container>
    </Box>
  );
}
