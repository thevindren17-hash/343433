"use client";

import { useState, useEffect, useRef } from "react";
import { BRANDS } from "@/lib/constants";
import type { Device } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface Props {
  initialBrand: string;
  initialModel: string;
  onComplete: (brand: string, model: string, deviceId: string, basePrice: number) => void;
}

export default function IdentificationStep({ initialBrand, initialModel, onComplete }: Props) {
  const [brandSearch, setBrandSearch] = useState(initialBrand);
  const [brandOpen, setBrandOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);

  const [modelSearch, setModelSearch] = useState(initialModel);
  const [modelOpen, setModelOpen] = useState(false);
  const [models, setModels] = useState<Device[]>([]);
  const [filteredModels, setFilteredModels] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  const filteredBrands = BRANDS.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase())
  );

  // Fetch models when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setFilteredModels([]);
      return;
    }
    setLoadingModels(true);
    supabase
      .from("devices")
      .select("*")
      .eq("brand", selectedBrand)
      .order("model")
      .then(({ data, error }) => {
        setLoadingModels(false);
        if (!error && data) {
          setModels(data);
          setFilteredModels(data);
        }
      });
  }, [selectedBrand]);

  // Filter models by search
  useEffect(() => {
    if (!modelSearch) {
      setFilteredModels(models);
      return;
    }
    setFilteredModels(
      models.filter((m) => m.model.toLowerCase().includes(modelSearch.toLowerCase()))
    );
  }, [modelSearch, models]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setBrandOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectBrand(brand: string) {
    setSelectedBrand(brand);
    setBrandSearch(brand);
    setBrandOpen(false);
    setSelectedDevice(null);
    setModelSearch("");
  }

  function selectModel(device: Device) {
    setSelectedDevice(device);
    setModelSearch(device.model);
    setModelOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const brand = selectedBrand;
    const model = selectedDevice?.model || modelSearch;
    if (!brand || !model) return;
    onComplete(brand, model, selectedDevice?.id ?? "", selectedDevice?.base_market_price ?? 0);
  }

  const canProceed = selectedBrand && (selectedDevice || modelSearch.trim().length > 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Step 1: Identify Your Device</h2>
        <p className="text-sm text-slate-500 mt-1">
          Search for your device brand and model to begin the valuation.
        </p>
      </div>

      {/* Brand selector */}
      <div ref={brandRef} className="relative">
        <label className="form-label">Brand</label>
        <input
          className="form-input"
          placeholder="Search brand (e.g. Apple, Samsung…)"
          value={brandSearch}
          onChange={(e) => {
            setBrandSearch(e.target.value);
            setSelectedBrand("");
            setBrandOpen(true);
          }}
          onFocus={() => setBrandOpen(true)}
          autoComplete="off"
        />
        {brandOpen && filteredBrands.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {filteredBrands.map((brand) => (
              <li key={brand}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-slate-700 first:rounded-t-xl last:rounded-b-xl transition-colors"
                  onClick={() => selectBrand(brand)}
                >
                  {brand}
                </button>
              </li>
            ))}
          </ul>
        )}
        {brandOpen && filteredBrands.length === 0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-400">
            No brands found. Please select from the 15 supported brands.
          </div>
        )}
      </div>

      {/* Model selector */}
      <div ref={modelRef} className="relative">
        <label className="form-label">
          Model
          {loadingModels && (
            <span className="ml-2 text-xs text-blue-500 font-normal">Loading…</span>
          )}
        </label>
        <input
          className="form-input disabled:bg-slate-50 disabled:text-slate-400"
          placeholder={
            selectedBrand
              ? `Search model (e.g. ${selectedBrand === "Apple" ? "iPhone 15 Pro" : "model name"})`
              : "Select a brand first"
          }
          value={modelSearch}
          onChange={(e) => {
            setModelSearch(e.target.value);
            setSelectedDevice(null);
            setModelOpen(true);
          }}
          onFocus={() => setModelOpen(true)}
          disabled={!selectedBrand}
          autoComplete="off"
        />
        {modelOpen && selectedBrand && filteredModels.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {filteredModels.map((device) => (
              <li key={device.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  onClick={() => selectModel(device)}
                >
                  <span className="block text-sm font-medium text-slate-800">{device.model}</span>
                  <span className="text-xs text-slate-400">
                    {device.category} · Est. S${device.base_market_price?.toFixed(0)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {modelOpen && selectedBrand && !loadingModels && filteredModels.length === 0 && modelSearch && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
            <p className="text-sm text-slate-500">
              No exact match — we&apos;ll use &quot;{modelSearch}&quot; for your quote.
            </p>
          </div>
        )}
      </div>

      {/* Selected device summary */}
      {selectedDevice && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
            {selectedDevice.brand[0]}
          </div>
          <div>
            <p className="font-semibold text-blue-900 text-sm">{selectedDevice.model}</p>
            <p className="text-xs text-blue-600">
              {selectedDevice.brand} · {selectedDevice.category} · Market Price: S$
              {selectedDevice.base_market_price?.toFixed(0)}
            </p>
          </div>
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={!canProceed}>
        Continue to Condition Assessment →
      </button>
    </form>
  );
}
