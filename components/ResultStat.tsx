import { Box, Text } from "@chakra-ui/react";
import React from "react";

interface ResultStatProps {
  label: string;
  value: React.ReactNode;
}

export function ResultStat({ label, value }: ResultStatProps) {
  return (
    <Box bg="resultCardBg" borderRadius="md" p={4} mb={4} _last={{ mb: 0 }}>
      <Text color="resultLabel" fontSize="sm" mb={1} wordBreak="break-word">
        {label}
      </Text>
      <Text
        color="resultValue"
        fontSize={{ base: "2xl", md: "3xl" }}
        fontFamily="heading"
        fontWeight="bold"
        wordBreak="break-word"
      >
        {value}
      </Text>
    </Box>
  );
}
