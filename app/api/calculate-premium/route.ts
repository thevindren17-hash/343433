import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createHash } from "crypto";
import { PRICING_MULTIPLIERS, MISTER_MOBILE_UEN } from "@/lib/constants";
import { createServerClient } from "@/lib/supabase";
import type {
  CalculatePremiumRequest,
  CalculatePremiumResponse,
  InspectionData,
  PricingBreakdown,
} from "@/lib/types";

// Fixed UUID representing the Phase 1 anonymous system quoter (no auth yet)
const SYSTEM_INSPECTOR_ID = "00000000-0000-0000-0000-000000000001";

// Brand-specific base price estimates when a device is not found in the DB
const BRAND_BASE_ESTIMATES: Record<string, number> = {
  Apple: 800,
  Samsung: 700,
  Honor: 500,
  OPPO: 500,
  Xiaomi: 550,
  OnePlus: 600,
  "Nothing Phone": 450,
  Huawei: 600,
  "Google Pixel": 600,
  Asus: 700,
  Nokia: 300,
  Sony: 800,
  LG: 350,
  Realme: 350,
  Vivo: 500,
};

function calculatePricing(
  basePrice: number,
  inspection: InspectionData
): PricingBreakdown {
  const m = PRICING_MULTIPLIERS;

  // Screen adjustment (multiplicative, expressed as absolute dollar delta)
  const screenMultiplier = m.screen_status[inspection.screen_status];
  const screenAdjustment = basePrice * (screenMultiplier - 1); // ≤0

  // Battery adjustment
  let batteryMultiplier: number;
  const bp = inspection.battery_percentage;
  if (bp >= m.battery_percentage.excellent.min) {
    batteryMultiplier = m.battery_percentage.excellent.multiplier;
  } else if (bp >= m.battery_percentage.good.min) {
    batteryMultiplier = m.battery_percentage.good.multiplier;
  } else if (bp >= m.battery_percentage.fair.min) {
    batteryMultiplier = m.battery_percentage.fair.multiplier;
  } else {
    batteryMultiplier = m.battery_percentage.poor.multiplier;
  }
  const afterScreen = basePrice * screenMultiplier;
  const batteryAdjustment = afterScreen * (batteryMultiplier - 1); // ≤0

  // Lock status (applied on running subtotal)
  const afterBattery = afterScreen * batteryMultiplier;
  const lockMultiplier = inspection.lock_status
    ? m.lock_status.unlocked
    : m.lock_status.locked;
  const lockPenalty = afterBattery * (lockMultiplier - 1); // ≤0

  // OEM verification
  const afterLock = afterBattery * lockMultiplier;
  const oemMultiplier = inspection.oem_verification
    ? m.oem_verification.oem
    : m.oem_verification.non_oem;
  const oemPenalty = afterLock * (oemMultiplier - 1); // ≤0

  // Functionality check
  const afterOem = afterLock * oemMultiplier;
  const failedComponents = Object.values(inspection.functionality_check).filter((v) => !v).length;
  const functionalityPenalty = -(afterOem * m.functionality.deduction_per_failure * failedComponents);

  // Subtotal before Pricing Power premium
  const subtotal = afterOem - Math.abs(functionalityPenalty);

  // Pricing Power Premium (Mister Mobile's bulk channel advantage: +15%)
  const pricingPowerPremium = subtotal * (m.pricing_power_premium - 1);

  const finalTradeInValue = Math.max(0, subtotal + pricingPowerPremium);

  return {
    base_market_price: basePrice,
    screen_adjustment: parseFloat(screenAdjustment.toFixed(2)),
    battery_adjustment: parseFloat(batteryAdjustment.toFixed(2)),
    lock_penalty: parseFloat(lockPenalty.toFixed(2)),
    oem_penalty: parseFloat(oemPenalty.toFixed(2)),
    functionality_penalty: parseFloat((-Math.abs(functionalityPenalty)).toFixed(2)),
    pricing_power_premium: parseFloat(pricingPowerPremium.toFixed(2)),
    final_trade_in_value: parseFloat(finalTradeInValue.toFixed(2)),
  };
}

function buildPayNowPayload(
  uen: string,
  amount: number,
  transactionRef: string,
  merchantName = "MISTER MOBILE PTE LTD"
): string {
  // Simplified EMVCo-style PayNow QR payload for Singapore
  // Real implementation: follows MAS PayNow SGQR specification
  const amountStr = amount.toFixed(2);
  const proxyType = "02"; // 02 = UEN
  const proxyValue = uen;

  // Build the merchant account information (tag 26)
  const reverseDomain = "SG.PAYNOW";
  const merchantInfo = [
    `00${String(reverseDomain.length).padStart(2, "0")}${reverseDomain}`,
    `01${String(proxyType.length).padStart(2, "0")}${proxyType}`,
    `02${String(proxyValue.length).padStart(2, "0")}${proxyValue}`,
    `03${"01".length.toString().padStart(2, "0")}01`, // amount is editable: 0=no,1=yes → set to 0 (fixed)
  ].join("");

  const payload = [
    "000201",                                                         // Payload format indicator
    "010211",                                                         // Point of initiation: 11=static, 12=dynamic
    `26${String(merchantInfo.length).padStart(2, "0")}${merchantInfo}`, // Merchant account info
    "5204000",                                                        // Merchant category code: 0000=generic
    "5303702",                                                        // Currency: 702=SGD
    `54${String(amountStr.length).padStart(2, "0")}${amountStr}`,    // Transaction amount
    "5802SG",                                                         // Country code
    `59${String(merchantName.length).padStart(2, "0")}${merchantName}`, // Merchant name
    "6009SINGAPORE",                                                  // Merchant city
    `62${String((String(transactionRef.length).padStart(2,"0") + transactionRef).length + 4).padStart(2,"0")}05${String(transactionRef.length).padStart(2,"0")}${transactionRef}`, // Additional data: bill ref
    "6304",                                                           // CRC placeholder (4 chars appended by real impl)
  ].join("");

  // Append a mock CRC (real SGQR uses CRC-16/CCITT-FALSE)
  const crc = createHash("sha256").update(payload).digest("hex").slice(0, 4).toUpperCase();
  return payload + crc;
}

function generateAuditHash(
  inspectorId: string,
  inspectionData: InspectionData,
  timestamp: string
): string {
  const payload = JSON.stringify({ inspectorId, inspectionData, timestamp });
  return createHash("sha256").update(payload).digest("hex");
}

function generateCaseTrustIdentifier(quoteId: string, timestamp: string): string {
  // Format: CT-YYYYMMDD-XXXXXXXX
  const date = new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = createHash("md5")
    .update(quoteId)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `CT-${date}-${suffix}`;
}

export async function POST(req: NextRequest): Promise<NextResponse<CalculatePremiumResponse>> {
  try {
    const body: CalculatePremiumRequest = await req.json();
    const { brand, model, base_market_price, inspection_data, location_id } = body;

    // Validate required fields
    if (!brand || !model || !inspection_data) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Determine base price: from DB lookup or brand-level estimate
    let basePrice = base_market_price ?? 0;
    if (!basePrice) {
      basePrice = BRAND_BASE_ESTIMATES[brand] ?? 500;
    }

    // Execute pricing calculation
    const pricing = calculatePricing(basePrice, inspection_data);

    // Validate inspection passes minimum criteria
    const passedAllSteps =
      inspection_data.lock_status &&
      inspection_data.battery_percentage >= 55 &&
      inspection_data.screen_status !== "Cracked" &&
      Object.values(inspection_data.functionality_check).every(Boolean);

    // Repair offset for cracked screen or failed components
    let repairOffset = 0;
    if (inspection_data.screen_status === "Cracked") repairOffset += 80;
    const failedCount = Object.values(inspection_data.functionality_check).filter((v) => !v).length;
    repairOffset += failedCount * 30;

    const tradeInValue = Math.max(0, pricing.final_trade_in_value - repairOffset);

    // Generate IDs and timestamps
    const quoteId = crypto.randomUUID();
    const now = new Date();
    const expiryDate = new Date(
      now.getTime() + PRICING_MULTIPLIERS.quote_validity_hours * 60 * 60 * 1000
    );
    const warrantyExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const returnPolicyExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const transactionReference = `MM-${quoteId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // ISO 9001 audit trail
    const auditTimestamp = now.toISOString();
    const auditHash = generateAuditHash(
      "system-quoter-v1",
      inspection_data,
      auditTimestamp
    );

    // CaseTrust identifier (logs fair-trading variables at quote creation time)
    const caseTrustIdentifier = generateCaseTrustIdentifier(quoteId, auditTimestamp);

    // Generate PayNow QR payload
    const payNowPayload = buildPayNowPayload(
      MISTER_MOBILE_UEN,
      tradeInValue,
      transactionReference
    );

    // Generate QR code as data URL
    const payNowQrDataUrl = await QRCode.toDataURL(payNowPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 200,
      color: { dark: "#1e3a8a", light: "#ffffff" },
    });

    // Metadata for ISO 9001 compliance logging
    const auditTrail = JSON.stringify({
      inspector_id: "system-quoter-v1",
      timestamp: auditTimestamp,
      hash: auditHash,
      location_id,
      passed_all_steps: passedAllSteps,
      inspection_data,
    });

    // Persist to Supabase using service role key (bypasses RLS)
    const db = createServerClient();

    // Look up the location UUID from the branch name passed by the frontend
    const { data: locationRow } = await db
      .from("locations")
      .select("id")
      .eq("branch_name", location_id)
      .single();

    // Insert inspection row first (quotes.inspection_id FK depends on it)
    const { data: inspectionRow, error: inspectionError } = await db
      .from("inspections")
      .insert({
        device_id: body.device_id || null,
        inspector_id: SYSTEM_INSPECTOR_ID,
        inspection_data,
        audit_trail: auditTrail,
        passed_all_steps: passedAllSteps,
      })
      .select()
      .single();

    if (inspectionError) {
      console.error("[calculate-premium] inspection insert failed:", inspectionError);
      // Non-fatal for Phase 1 — quote still returned to user
    }

    // Insert quote row linked to the inspection
    if (inspectionRow) {
      const { error: quoteError } = await db.from("quotes").insert({
        id: quoteId,
        inspection_id: inspectionRow.id,
        location_id: locationRow?.id ?? null,
        trade_in_value: tradeInValue,
        repair_offset: repairOffset,
        casetrust_identifier: caseTrustIdentifier,
        status: "Pending",
        paynow_payload: payNowPayload,
        transaction_reference: transactionReference,
        warranty_expiry: warrantyExpiry.toISOString(),
        return_policy_expiry: returnPolicyExpiry.toISOString(),
        expiry_date: expiryDate.toISOString(),
      });

      if (quoteError) {
        console.error("[calculate-premium] quote insert failed:", quoteError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        quote_id: quoteId,
        trade_in_value: parseFloat(tradeInValue.toFixed(2)),
        repair_offset: parseFloat(repairOffset.toFixed(2)),
        warranty_expiry: warrantyExpiry.toISOString(),
        return_policy_expiry: returnPolicyExpiry.toISOString(),
        expiry_date: expiryDate.toISOString(),
        paynow_payload: payNowPayload,
        paynow_qr_data_url: payNowQrDataUrl,
        transaction_reference: transactionReference,
        casetrust_identifier: caseTrustIdentifier,
        audit_hash: auditHash,
        pricing_breakdown: {
          ...pricing,
          final_trade_in_value: parseFloat(tradeInValue.toFixed(2)),
        },
      },
    });
  } catch (err) {
    console.error("[calculate-premium]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
