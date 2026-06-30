export type DeviceCategory = "New" | "Refurbished";
export type QuoteStatus = "Pending" | "Inspected" | "Accepted" | "Completed" | "Expired";
export type ScreenStatus = "Flawless" | "Scratched" | "Cracked";

export interface Device {
  id: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  base_market_price: number;
  created_at: string;
}

export interface Location {
  id: string;
  branch_name: string;
  is_active: boolean;
  created_at: string;
}

export interface FunctionalityCheck {
  camera: boolean;
  face_id_touch_id: boolean;
  speakers: boolean;
}

export interface InspectionData {
  screen_status: ScreenStatus;
  battery_percentage: number;
  lock_status: boolean;        // true = unlocked (iCloud/FRP clear)
  oem_verification: boolean;   // true = all original OEM parts
  functionality_check: FunctionalityCheck;
}

export interface QuoteFormState {
  step: 1 | 2 | 3;
  // Step 1
  brand: string;
  model: string;
  device_id: string;
  base_market_price: number;
  // Step 2
  inspection: InspectionData;
  // Step 3
  location_id: string;
}

export interface CalculatePremiumRequest {
  device_id?: string;
  brand: string;
  model: string;
  base_market_price?: number;
  location_id: string;
  inspection_data: InspectionData;
}

export interface QuoteResult {
  quote_id: string;
  trade_in_value: number;
  repair_offset: number;
  warranty_expiry: string;
  return_policy_expiry: string;
  expiry_date: string;
  paynow_payload: string;
  paynow_qr_data_url: string;
  transaction_reference: string;
  casetrust_identifier: string;
  audit_hash: string;
  pricing_breakdown: PricingBreakdown;
}

export interface PricingBreakdown {
  base_market_price: number;
  screen_adjustment: number;
  battery_adjustment: number;
  lock_penalty: number;
  oem_penalty: number;
  functionality_penalty: number;
  pricing_power_premium: number;
  final_trade_in_value: number;
}

export interface CalculatePremiumResponse {
  success: boolean;
  data?: QuoteResult;
  error?: string;
}
