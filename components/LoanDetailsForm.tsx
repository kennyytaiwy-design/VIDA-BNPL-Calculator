"use client";

import React, { useState } from "react";
import { Box, Button, Field, Input, Stack, Text, Flex } from "@chakra-ui/react";
import { calculateRepayment, getMinimumDownPayment, getTotalFees, RepaymentResult } from "@/lib/calculateRepayment";
import type { MerchantConfig } from "@/src/config/merchants";
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

/** Format a plain number as a Naira amount string (no ₦ prefix), e.g. 6,300.00 */
function formatNairaAmount(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface LoanDetailsFormProps {
  merchant: MerchantConfig;
  onCalculate?: (result: RepaymentResult) => void;
}

export function LoanDetailsForm({ merchant, onCalculate }: LoanDetailsFormProps) {
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

  // ── Computed thresholds ─────────────────────────────────────────────────────

  const hasMinDownPayment = merchant.minDownPaymentPct > 0;

  /**
   * Total fees the down payment must cover, via the shared helper.
   * This is the single source of truth — same value used in calculateRepayment.
   */
  const totalFees = itemCost > 0 ? getTotalFees(itemCost, merchant) : 0;

  /**
   * The true minimum the borrower must pay (whole-naira ceiling of the larger of
   * the pct floor and the total fees). Enforced by validation and shown in messages.
   */
  const minimumDownPayment = itemCost > 0 ? getMinimumDownPayment(itemCost, merchant) : 0;

  /**
   * Which constraint is the binding one when the down payment is below the minimum?
   *   "fees" → the fee floor is the binding constraint (fees > pct floor).
   *   "pct"  → the percentage floor wins (or they are equal — pct shown for clarity).
   */
  const bindingConstraint: "fees" | "pct" = totalFees > (merchant.minDownPaymentPct / 100) * itemCost
    ? "fees"
    : "pct";

  // ── Validation ──────────────────────────────────────────────────────────────

  const isItemCostValid = itemCost > 0;
  const isDownPaymentEntered = downPaymentRaw.trim() !== "";

  const isDownPaymentBelowMin = isItemCostValid && isDownPaymentEntered && downPayment < minimumDownPayment;
  const isDownPaymentTooHigh = isItemCostValid && isDownPaymentEntered && downPayment >= itemCost;

  const isDownPaymentInvalid = isDownPaymentBlurred && (isDownPaymentBelowMin || isDownPaymentTooHigh);
  const isDownPaymentValid = isDownPaymentEntered && !isDownPaymentBelowMin && !isDownPaymentTooHigh;

  const isTenorValid = tenor >= 1 && tenor <= 12;
  const isFormValid = isItemCostValid && isDownPaymentValid && isTenorValid;

  // ── Message logic ───────────────────────────────────────────────────────────
  //
  // Priority (only one message shown at a time):
  //   1. "too high" — down payment >= item cost (all merchants, incl. minDownPaymentPct = 0)
  //   2. "fee error" — below minimum because fees are the binding constraint
  //   3. amber pct helper — shown whenever minDownPaymentPct > 0 (always visible for those merchants)
  //
  // "too high" takes priority over the fee error because a user who has gone
  // above the item cost must fix that first before the fee message is relevant.

  // Only active after blur.
  const showTooHighError  = isDownPaymentBlurred && isDownPaymentTooHigh;
  const showFeeError      = isDownPaymentBlurred && isDownPaymentBelowMin && !isDownPaymentTooHigh && bindingConstraint === "fees";
  const showPctError      = isDownPaymentBlurred && isDownPaymentBelowMin && !isDownPaymentTooHigh && bindingConstraint === "pct";

  // Amber block: visible whenever minDownPaymentPct > 0, unless the fee error or
  // "too high" error is already covering the full message area.
  const showAmberBlock = hasMinDownPayment && !showFeeError && !showTooHighError;

  // Amber text turns red when the pct constraint is the active error.
  const amberHelperColor     = showPctError ? "error" : "resultLabel";
  const amberHelperIconColor = showPctError ? "error" : "amberIcon";

  // Amber message: show minimumDownPayment (same enforced number). The reason in
  // brackets must match whichever constraint actually sets that number.
  const amberHelperReason = bindingConstraint === "fees"
    ? "to cover the fees"
    : `${merchant.minDownPaymentPct}% of item cost`;
  const amberHelperMessage = `Note that the down payment cannot be less than ₦${formatNairaAmount(minimumDownPayment)} (${amberHelperReason})`;

  // Fee error message: uses minimumDownPayment (the enforced, rounded number).
  const feeErrorMessage = `Down payment must cover the fees (₦${formatNairaAmount(minimumDownPayment)})`;

  // "Too high" message: always in error style, shown for every merchant.
  const tooHighMessage = "Note that the down payment must be less than the item cost";

  // Input border / focus colour
  const inputBorderColor      = isDownPaymentInvalid ? "error" : "border";
  const inputFocusBorderColor = isDownPaymentInvalid ? "error" : "primary";

  // ── Event handlers ──────────────────────────────────────────────────────────

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
      if (!isDownPaymentBlurred && isDownPaymentBelowMin) {
        posthog.capture("calculator_validation_error", {
          merchant_slug: merchant.slug,
          merchant_name: merchant.name,
          item_cost: itemCost,
          down_payment_entered: downPayment,
          minimum_required: minimumDownPayment,
          binding_constraint: bindingConstraint,
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
    const result = calculateRepayment(itemCost, downPayment, tenor, merchant);
    console.log("Calculated Repayment Result:", result);

    posthog.capture("calculator_submitted", {
      merchant_slug: merchant.slug,
      merchant_name: merchant.name,
      item_cost: itemCost,
      down_payment: downPayment,
      tenor_months: tenor,
      monthly_repayment: result.monthlyRepayment,
    });

    if (onCalculate) {
      onCalculate(result);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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
            borderColor={inputBorderColor}
            borderRadius="md"
            bg="white"
            fontSize="md"
            _focus={{ borderColor: inputFocusBorderColor, boxShadow: "none" }}
          />

          {/* 1. "Too high" error — all merchants, incl. those with minDownPaymentPct = 0 */}
          {showTooHighError && (
            <Flex align="flex-start" gap={1.5} mt={2}>
              <Box mt={0.5} flexShrink={0}>
                <InfoIcon color="error" size={16} />
              </Box>
              <Text fontSize={{ base: "sm", md: "16px" }} color="error" lineHeight="short">
                {tooHighMessage}
              </Text>
            </Flex>
          )}

          {/* 2. Fee error — binding constraint is the fee floor (not pct, not "too high") */}
          {showFeeError && (
            <Flex align="flex-start" gap={1.5} mt={2}>
              <Box mt={0.5} flexShrink={0}>
                <InfoIcon color="error" size={16} />
              </Box>
              <Text fontSize={{ base: "sm", md: "16px" }} color="error" lineHeight="short">
                {feeErrorMessage}
              </Text>
            </Flex>
          )}

          {/* 3. Amber pct helper — only for merchants with minDownPaymentPct > 0,
                 hidden when fee error or "too high" is active */}
          {showAmberBlock && (
            <Flex align="flex-start" gap={1.5} mt={2}>
              <Box mt={0.5} flexShrink={0}>
                <InfoIcon color={amberHelperIconColor} size={16} />
              </Box>
              <Text fontSize={{ base: "sm", md: "16px" }} color={amberHelperColor} lineHeight="short">
                {amberHelperMessage}
              </Text>
            </Flex>
          )}
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
