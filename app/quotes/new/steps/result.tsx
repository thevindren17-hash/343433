"use client";

import { useState, useEffect } from "react";
import { BRANCHES } from "@/lib/constants";
import type { QuoteResult, InspectionData, CalculatePremiumRequest } from "@/lib/types";

interface Props {
  brand: string;
  model: string;
  deviceId: string;
  baseMarketPrice: number;
  inspectionData: InspectionData;
  onBack: () => void;
  onStartOver: () => void;
}

export default function ResultStep({
  brand,
  model,
  deviceId,
  baseMarketPrice,
  inspectionData,
  onBack,
  onStartOver,
}: Props) {
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationsOpen, setLocationsOpen] = useState(false);

  const filteredBranches = BRANCHES.filter((b) =>
    b.toLowerCase().includes(locationSearch.toLowerCase())
  );

  async function generateQuote() {
    if (!selectedBranch) return;
    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const payload: CalculatePremiumRequest = {
        device_id: deviceId || undefined,
        brand,
        model,
        base_market_price: baseMarketPrice || undefined,
        location_id: locationId || selectedBranch,
        inspection_data: inspectionData,
      };

      const res = await fetch("/api/calculate-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Quote generation failed");
      setQuote(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedBranch) generateQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Step 3: Your Instant Quote</h2>
        <p className="text-sm text-slate-500 mt-1">
          Select your nearest Mister Mobile branch to receive your personalised trade-in offer.
        </p>
      </div>

      {/* Branch Selector */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs flex items-center justify-center font-bold">
            1
          </span>
          Select Your Nearest Branch
        </h3>
        <div className="relative">
          <input
            className="form-input"
            placeholder="Search from 17 island-wide locations…"
            value={locationSearch}
            onChange={(e) => {
              setLocationSearch(e.target.value);
              setLocationsOpen(true);
              setSelectedBranch("");
              setQuote(null);
            }}
            onFocus={() => setLocationsOpen(true)}
            onBlur={() => setTimeout(() => setLocationsOpen(false), 150)}
            autoComplete="off"
          />
          {locationsOpen && filteredBranches.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {filteredBranches.map((branch) => (
                <li key={branch}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-slate-700 transition-colors"
                    onMouseDown={() => {
                      setSelectedBranch(branch);
                      setLocationSearch(branch);
                      setLocationsOpen(false);
                    }}
                  >
                    {branch}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Branch grid for quick pick */}
        <div className="mt-3 flex flex-wrap gap-2">
          {BRANCHES.map((branch) => (
            <button
              key={branch}
              type="button"
              onClick={() => {
                setSelectedBranch(branch);
                setLocationSearch(branch);
                setLocationsOpen(false);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-100 ${
                selectedBranch === branch
                  ? "bg-blue-800 text-white border-blue-800"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card flex flex-col items-center py-12 gap-4">
          <div className="w-10 h-10 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">
            Calculating your personalised Mister Mobile quote…
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <p className="text-red-700 font-semibold text-sm">{error}</p>
          <button className="btn-secondary mt-3 text-sm py-2 px-4" onClick={generateQuote}>
            Retry
          </button>
        </div>
      )}

      {/* Quote Result */}
      {quote && (
        <>
          {/* Main value card */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-blue-200 text-sm font-medium">Your Trade-In Value</p>
            <p className="text-5xl font-black mt-1">
              S${quote.trade_in_value.toFixed(0)}
            </p>
            {quote.repair_offset > 0 && (
              <p className="text-blue-200 text-xs mt-1">
                (Repair offset: –S${quote.repair_offset.toFixed(0)} applied)
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                30-Day Warranty
              </span>
              <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                7-Day No-Questions Return
              </span>
              <span className="bg-slate-100 text-blue-900 text-xs font-semibold px-3 py-1 rounded-full">
                CaseTrust Accredited
              </span>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Pricing Breakdown</h3>
            <div className="space-y-2">
              {[
                {
                  label: "Base Market Price",
                  value: quote.pricing_breakdown.base_market_price,
                  sign: "",
                },
                {
                  label: "Screen Adjustment",
                  value: quote.pricing_breakdown.screen_adjustment,
                  sign: quote.pricing_breakdown.screen_adjustment >= 0 ? "+" : "",
                },
                {
                  label: "Battery Adjustment",
                  value: quote.pricing_breakdown.battery_adjustment,
                  sign: quote.pricing_breakdown.battery_adjustment >= 0 ? "+" : "",
                },
                {
                  label: "Lock Status Penalty",
                  value: quote.pricing_breakdown.lock_penalty,
                  sign: quote.pricing_breakdown.lock_penalty >= 0 ? "+" : "",
                },
                {
                  label: "OEM Penalty",
                  value: quote.pricing_breakdown.oem_penalty,
                  sign: quote.pricing_breakdown.oem_penalty >= 0 ? "+" : "",
                },
                {
                  label: "Functionality Penalty",
                  value: quote.pricing_breakdown.functionality_penalty,
                  sign: quote.pricing_breakdown.functionality_penalty >= 0 ? "+" : "",
                },
                {
                  label: 'Pricing Power Premium (Mister Mobile advantage)',
                  value: quote.pricing_breakdown.pricing_power_premium,
                  sign: "+",
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      row.value < 0 ? "text-red-600" : row.value > 0 && row.sign ? "text-green-600" : "text-slate-800"
                    }`}
                  >
                    {row.sign}S${Math.abs(row.value).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-slate-800">Final Trade-In Value</span>
                <span className="font-black text-lg text-blue-800">
                  S${quote.trade_in_value.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* PayNow QR */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-1">Instant PayNow Disbursement</h3>
            <p className="text-xs text-slate-500 mb-4">
              Present this QR at any Mister Mobile branch. Payment is disbursed immediately upon
              device handover and inspection confirmation.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="bg-white border-2 border-slate-200 rounded-xl p-3 flex-shrink-0">
                {quote.paynow_qr_data_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={quote.paynow_qr_data_url}
                    alt="PayNow QR Code"
                    width={160}
                    height={160}
                    className="block"
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400">
                    QR loading…
                  </div>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                    Recipient
                  </p>
                  <p className="font-semibold text-slate-800">Mister Mobile Pte. Ltd.</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">UEN</p>
                  <p className="font-mono font-semibold text-slate-800">200814549W</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                    Transaction Reference
                  </p>
                  <p className="font-mono text-xs text-slate-700 break-all">
                    {quote.transaction_reference}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                    Amount
                  </p>
                  <p className="font-bold text-blue-800">S${quote.trade_in_value.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Quote Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  Quote ID
                </p>
                <p className="font-mono text-xs text-slate-700 mt-0.5 break-all">
                  {quote.quote_id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  Quote Expires
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">{formatDate(quote.expiry_date)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  Warranty Until
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(quote.warranty_expiry)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  Return Policy Until
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(quote.return_policy_expiry)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  CaseTrust ID
                </p>
                <p className="font-mono text-xs text-slate-700 mt-0.5">
                  {quote.casetrust_identifier}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                  Branch
                </p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedBranch}</p>
              </div>
            </div>

            {/* Audit hash */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">
                ISO 9001 Audit Hash
              </p>
              <p className="font-mono text-xs text-slate-400 break-all">{quote.audit_hash}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-blue-900 text-sm">
                Ready to complete your trade-in?
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Walk into {selectedBranch} and present your quote ID or this QR code.
              </p>
            </div>
            <button
              className="btn-primary whitespace-nowrap text-sm py-2.5 px-5"
              onClick={() => window.print()}
            >
              Save / Print Quote
            </button>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={onBack}
          disabled={loading}
        >
          ← Back
        </button>
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={onStartOver}
          disabled={loading}
        >
          Start New Quote
        </button>
      </div>
    </div>
  );
}
