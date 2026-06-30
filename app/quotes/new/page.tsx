"use client";

import { useState } from "react";
import IdentificationStep from "./steps/identification";
import AssessmentStep from "./steps/assessment";
import ResultStep from "./steps/result";
import type { QuoteFormState, InspectionData } from "@/lib/types";

const INITIAL_INSPECTION: InspectionData = {
  screen_status: "Flawless",
  battery_percentage: 85,
  lock_status: true,
  oem_verification: true,
  functionality_check: {
    camera: true,
    face_id_touch_id: true,
    speakers: true,
  },
};

const INITIAL_STATE: QuoteFormState = {
  step: 1,
  brand: "",
  model: "",
  device_id: "",
  base_market_price: 0,
  inspection: INITIAL_INSPECTION,
  location_id: "",
};

const STEPS = [
  { num: 1, label: "Identify Device" },
  { num: 2, label: "Condition" },
  { num: 3, label: "Get Quote" },
] as const;

export default function NewQuotePage() {
  const [form, setForm] = useState<QuoteFormState>(INITIAL_STATE);

  function goToStep(step: 1 | 2 | 3) {
    setForm((f) => ({ ...f, step }));
  }

  function handleIdentificationComplete(
    brand: string,
    model: string,
    deviceId: string,
    basePrice: number
  ) {
    setForm((f) => ({ ...f, brand, model, device_id: deviceId, base_market_price: basePrice }));
    goToStep(2);
  }

  function handleAssessmentComplete(inspection: InspectionData) {
    setForm((f) => ({ ...f, inspection }));
    goToStep(3);
  }

  function handleStartOver() {
    setForm(INITIAL_STATE);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Instant Trade-In Quote</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Complete 3 simple steps to receive Singapore&apos;s best trade-in offer — backed by the
          Mister Mobile 100-Step Inspection and our{" "}
          <span className="text-blue-800 font-semibold">Pricing Power</span> guarantee.
        </p>
      </div>

      {/* Step progress indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`step-badge ${
                  form.step === step.num
                    ? "bg-blue-800 text-white ring-4 ring-blue-100"
                    : form.step > step.num
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {form.step > step.num ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium whitespace-nowrap ${
                  form.step === step.num ? "text-blue-800" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 ${
                  form.step > step.num ? "bg-green-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card">
        {form.step === 1 && (
          <IdentificationStep
            initialBrand={form.brand}
            initialModel={form.model}
            onComplete={handleIdentificationComplete}
          />
        )}
        {form.step === 2 && (
          <AssessmentStep
            brand={form.brand}
            model={form.model}
            initialData={form.inspection}
            onComplete={handleAssessmentComplete}
            onBack={() => goToStep(1)}
          />
        )}
        {form.step === 3 && (
          <ResultStep
            brand={form.brand}
            model={form.model}
            deviceId={form.device_id}
            baseMarketPrice={form.base_market_price}
            inspectionData={form.inspection}
            onBack={() => goToStep(2)}
            onStartOver={handleStartOver}
          />
        )}
      </div>

      {/* Trust badges */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Carousell InstantBuy Award Winner
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Up to 2× peer-to-peer rates
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Instant PayNow disbursement
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> 17 locations island-wide
        </span>
      </div>
    </div>
  );
}
