import { Box, Text } from "@chakra-ui/react";

export function PageFooter() {
  return (
    <Box as="footer" mt={12} py={6} textAlign="center">
      <Text fontSize="sm" color="resultLabel">
        © 2026 VIDA mycreditprofile. All rights reserved
      </Text>
    </Box>
  );
}
