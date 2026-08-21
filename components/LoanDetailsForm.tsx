"use client";

import React, { useState } from "react";
import { Box, Button, Field, Input, Stack, Text, Flex } from "@chakra-ui/react";
import { calculateRepayment, RepaymentResult } from "@/lib/calculateRepayment";
import { usePostHog } from "posthog-js/react";

const InfoIcon = ({ color = "amberIcon", size = 16 }: { color?: string; size?: number }) => {
  const strokeColor = color === "error" ? "var(--chakra-colors-error)" : "var(--chakra-colors-amber-icon)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
};

function formatCurrencyString(rawInput: string): { display: string; numeric: number; cleaned: string } {
  // Strip non-digits and non-dots
  let cleaned = rawInput.replace(/[^0-9.]/g, "");

  // Allow only one dot
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }

  const [intPart, decPart] = cleaned.split(".");

  if (cleaned === "" || cleaned === ".") {
    return { display: cleaned === "." ? "₦0." : "", numeric: 0, cleaned };
  }

  const formattedInt = intPart ? Number(intPart).toLocaleString("en-US") : "0";

  let display = `₦${formattedInt}`;
  if (decPart !== undefined) {
    const trimmedDec = decPart.slice(0, 2);
    display += `.${trimmedDec}`;
    cleaned = `${intPart || "0"}.${trimmedDec}`;
  }

  const numeric = parseFloat(cleaned) || 0;
  return { display, numeric, cleaned };
}

interface LoanDetailsFormProps {
  onCalculate?: (result: RepaymentResult) => void;
}

export function LoanDetailsForm({ onCalculate }: LoanDetailsFormProps) {
  const posthog = usePostHog();
  const [itemCostRaw, setItemCostRaw] = useState<string>("");
  const [downPaymentRaw, setDownPaymentRaw] = useState<string>("");
  const [tenorRaw, setTenorRaw] = useState<string>("");
  const [isDownPaymentBlurred, setIsDownPaymentBlurred] = useState<boolean>(false);

  const itemCostData = formatCurrencyString(itemCostRaw);
  const downPaymentData = formatCurrencyString(downPaymentRaw);

  const itemCost = itemCostData.numeric;
  const downPayment = downPaymentData.numeric;
  const tenor = tenorRaw ? parseInt(tenorRaw, 10) : 0;

  // 30% threshold calculation
  const required30Percent = itemCost > 0 ? itemCost * 0.3 : 0;

  // Helper text minimum required calculation
  const minRequiredFormatted = itemCost > 0
    ? required30Percent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  // Validation state
  const isItemCostValid = itemCost > 0;
  const isDownPaymentEntered = downPaymentRaw.trim() !== "";
  
  // Down payment valid: >= 30% AND < itemCost
  const isDownPaymentValid = isDownPaymentEntered && downPayment >= required30Percent && downPayment < itemCost;
  const isTenorValid = tenor >= 1 && tenor <= 12;

  // Error checks
  const isDownPaymentTooLow = isItemCostValid && isDownPaymentEntered && downPayment < required30Percent;
  const isDownPaymentTooHigh = isItemCostValid && isDownPaymentEntered && downPayment >= itemCost;

  // Red error state triggers ONLY after user moves off focus (blurs) from down payment input
  const isDownPaymentInvalid = isDownPaymentBlurred && (isDownPaymentTooLow || isDownPaymentTooHigh);

  const helperColor = isDownPaymentInvalid ? "error" : "resultLabel";
  const helperIconColor = isDownPaymentInvalid ? "error" : "amberIcon";

  let helperMessage = `Note that the down payment cannot be less than ₦${minRequiredFormatted}`;
  if (isDownPaymentBlurred && isDownPaymentTooHigh) {
    helperMessage = "Note that the down payment must be less than the item cost";
  }

  const isFormValid = isItemCostValid && isDownPaymentValid && isTenorValid;

  const handleItemCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const rawVal = val.startsWith("₦") ? val.slice(1) : val;
    setItemCostRaw(rawVal);
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const rawVal = val.startsWith("₦") ? val.slice(1) : val;
    setDownPaymentRaw(rawVal);
  };

  const handleDownPaymentBlur = () => {
    if (downPaymentRaw.trim() !== "") {
      if (!isDownPaymentBlurred && itemCost > 0 && downPayment < required30Percent) {
        posthog.capture('calculator_validation_error', {
          item_cost: itemCost,
          down_payment_entered: downPayment,
          minimum_required: required30Percent
        });
      }
      setIsDownPaymentBlurred(true);
    }
  };

  const handleTenorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
    setTenorRaw(digitsOnly);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const result = calculateRepayment(itemCost, downPayment, tenor);
    console.log("Calculated Repayment Result:", result);

    posthog.capture('calculator_submitted', {
      item_cost: itemCost,
      down_payment: downPayment,
      tenor_months: tenor,
      monthly_repayment: result.monthlyRepayment
    });

    if (onCalculate) {
      onCalculate(result);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} display="flex" flexDirection="column" flex="1" w="full">
      <Stack gap={6} flex="1">
        {/* Item Cost Field */}
        <Field.Root w="full">
          <Field.Label fontWeight="medium" fontSize="sm" color="primary" mb={1.5}>
            Cost of the item
          </Field.Label>
          <Input
            value={itemCostData.display}
            onChange={handleItemCostChange}
            placeholder="Enter item cost"
            h="48px"
            w="full"
            borderColor="border"
            borderRadius="md"
            bg="white"
            fontSize="md"
            _focus={{ borderColor: "primary", boxShadow: "none" }}
          />
        </Field.Root>

        {/* Down Payment Field */}
        <Field.Root w="full">
          <Field.Label fontWeight="medium" fontSize="sm" color="primary" mb={1.5}>
            Down Payment
          </Field.Label>
          <Input
            value={downPaymentData.display}
            onChange={handleDownPaymentChange}
            onBlur={handleDownPaymentBlur}
            placeholder="Enter amount"
            h="48px"
            w="full"
            borderColor={isDownPaymentInvalid ? "error" : "border"}
            borderRadius="md"
            bg="white"
            fontSize="md"
            _focus={{ borderColor: isDownPaymentInvalid ? "error" : "primary", boxShadow: "none" }}
          />
          <Flex align="flex-start" gap={1.5} mt={2}>
            <Box mt={0.5} flexShrink={0}>
              <InfoIcon color={helperIconColor} size={16} />
            </Box>
            <Text fontSize={{ base: "sm", md: "16px" }} color={helperColor} lineHeight="short">
              {helperMessage}
            </Text>
          </Flex>
        </Field.Root>

        {/* Tenor Field */}
        <Field.Root w="full">
          <Field.Label fontWeight="medium" fontSize="sm" color="primary" mb={1.5}>
            Loan Tenor (How long do you want to spread your payment?)
          </Field.Label>
          <Box position="relative" w="full">
            <Input
              value={tenorRaw}
              onChange={handleTenorChange}
              placeholder="Enter tenor (1 - 12 months)"
              h="48px"
              w="full"
              pr="75px"
              borderColor="border"
              borderRadius="md"
              bg="white"
              fontSize="md"
              _focus={{ borderColor: "primary", boxShadow: "none" }}
            />
            <Text
              position="absolute"
              right="16px"
              top="50%"
              transform="translateY(-50%)"
              color="resultLabel"
              fontSize="sm"
              pointerEvents="none"
            >
              months
            </Text>
          </Box>
        </Field.Root>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid}
          w="full"
          h="50px"
          mt="auto"
          bg={isFormValid ? "primary" : "disabledButton"}
          color="white"
          fontWeight="semibold"
          fontSize="md"
          borderRadius="md"
          cursor={isFormValid ? "pointer" : "not-allowed"}
          _hover={isFormValid ? { bg: "#1a1754" } : { bg: "disabledButton" }}
          _disabled={{ bg: "disabledButton", opacity: 1, cursor: "not-allowed" }}
        >
          Calculate Repayment Plan
        </Button>
      </Stack>
    </Box>
  );
}
