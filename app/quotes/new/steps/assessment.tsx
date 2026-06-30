"use client";

import { useState } from "react";
import type { InspectionData, ScreenStatus } from "@/lib/types";

interface Props {
  brand: string;
  model: string;
  initialData: InspectionData;
  onComplete: (data: InspectionData) => void;
  onBack: () => void;
}

const SCREEN_OPTIONS: { value: ScreenStatus; label: string; description: string; color: string }[] =
  [
    {
      value: "Flawless",
      label: "Flawless",
      description: "No scratches, cracks or marks whatsoever",
      color: "border-green-400 bg-green-50 text-green-800",
    },
    {
      value: "Scratched",
      label: "Scratched",
      description: "Minor surface scratches, no cracks",
      color: "border-amber-400 bg-amber-50 text-amber-800",
    },
    {
      value: "Cracked",
      label: "Cracked",
      description: "Visible cracks or chips on display",
      color: "border-red-400 bg-red-50 text-red-800",
    },
  ];

const FUNCTIONALITY_ITEMS: { key: keyof InspectionData["functionality_check"]; label: string; hint: string }[] = [
  { key: "camera", label: "Camera", hint: "Front & rear cameras focus and capture without issues" },
  {
    key: "face_id_touch_id",
    label: "Face ID / Touch ID",
    hint: "Biometric authentication responds correctly",
  },
  {
    key: "speakers",
    label: "Speakers & Microphone",
    hint: "Audio output and input are clear with no distortion",
  },
];

export default function AssessmentStep({ brand, model, initialData, onComplete, onBack }: Props) {
  const [data, setData] = useState<InspectionData>(initialData);

  function setScreenStatus(status: ScreenStatus) {
    setData((d) => ({ ...d, screen_status: status }));
  }

  function setBattery(val: number) {
    setData((d) => ({ ...d, battery_percentage: val }));
  }

  function setLockStatus(val: boolean) {
    setData((d) => ({ ...d, lock_status: val }));
  }

  function setOemVerification(val: boolean) {
    setData((d) => ({ ...d, oem_verification: val }));
  }

  function setFunctionality(key: keyof InspectionData["functionality_check"], val: boolean) {
    setData((d) => ({
      ...d,
      functionality_check: { ...d.functionality_check, [key]: val },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onComplete(data);
  }

  const batteryColor =
    data.battery_percentage >= 85
      ? "text-green-600"
      : data.battery_percentage >= 70
        ? "text-amber-600"
        : data.battery_percentage >= 55
          ? "text-orange-600"
          : "text-red-600";

  const batteryLabel =
    data.battery_percentage >= 85
      ? "Excellent"
      : data.battery_percentage >= 70
        ? "Good"
        : data.battery_percentage >= 55
          ? "Fair"
          : "Poor — replacement likely needed";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Step 2: Condition Assessment</h2>
        <p className="text-sm text-slate-500 mt-1">
          100-Step Inspection for{" "}
          <span className="font-semibold text-blue-800">
            {brand} {model}
          </span>
          . Your answers determine the trade-in value.
        </p>
      </div>

      {/* Screen Status */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs flex items-center justify-center font-bold">
            1
          </span>
          Screen Condition
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCREEN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setScreenStatus(opt.value)}
              className={`border-2 rounded-xl p-4 text-left transition-all duration-150 ${
                data.screen_status === opt.value
                  ? opt.color + " ring-2 ring-offset-1 ring-blue-500"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <p className="font-semibold text-sm">{opt.label}</p>
              <p className="text-xs mt-0.5 opacity-80">{opt.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Battery Health */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs flex items-center justify-center font-bold">
            2
          </span>
          Battery Health
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Battery Capacity / Health Percentage
            </span>
            <span className={`font-bold text-lg tabular-nums ${batteryColor}`}>
              {data.battery_percentage}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={data.battery_percentage}
            onChange={(e) => setBattery(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-800"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>0%</span>
            <span className={`font-medium ${batteryColor}`}>{batteryLabel}</span>
            <span>100%</span>
          </div>
          <p className="text-xs text-slate-400">
            For iPhones: found in Settings → Battery → Battery Health & Charging
          </p>
        </div>
      </section>

      {/* Lock Status */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs flex items-center justify-center font-bold">
            3
          </span>
          iCloud / FRP Lock Status
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLockStatus(true)}
            className={`border-2 rounded-xl p-4 text-left transition-all duration-150 ${
              data.lock_status
                ? "border-green-400 bg-green-50 text-green-800 ring-2 ring-offset-1 ring-blue-500"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <p className="font-semibold text-sm">Unlocked</p>
            <p className="text-xs mt-0.5 opacity-80">
              iCloud / Google FRP signed out — device is ready for new owner
            </p>
          </button>
          <button
            type="button"
            onClick={() => setLockStatus(false)}
            className={`border-2 rounded-xl p-4 text-left transition-all duration-150 ${
              !data.lock_status
                ? "border-red-400 bg-red-50 text-red-800 ring-2 ring-offset-1 ring-blue-500"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <p className="font-semibold text-sm">Locked</p>
            <p className="text-xs mt-0.5 opacity-80">
              iCloud / FRP active — significant value reduction applied
            </p>
          </button>
        </div>
      </section>

      {/* OEM Verification */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs flex items-center justify-center font-bold">
            4
          </span>
          OEM Parts Verification
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOemVerification(true)}
            className={`border-2 rounded-xl p-4 text-left transition-all duration-150 ${
              data.oem_verification
                ? "border-green-400 bg-green-50 text-green-800 ring-2 ring-offset-1 ring-blue-500"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <p className="font-semibold text-sm">All OEM Parts</p>
            <p className="text-xs mt-0.5 opacity-80">
              Screen, battery, and chassis are all original manufacturer parts
            </p>
          </button>
          <button
            type="button"
            onClick={() => setOemVerification(false)}
            className={`border-2 rounded-xl p-4 text-left transition-all duration-150 ${
              !data.oem_verification
                ? "border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-offset-1 ring-blue-500"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <p className="font-semibold text-sm">Third-Party Parts</p>
            <p className="text-xs mt-0.5 opacity-80">
              Screen, battery or other components have been replaced with non-OEM parts
            </p>
          </button>
        </div>
      </section>

      {/* Functionality Check */}
      <section>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs flex items-center justify-center font-bold">
            5
          </span>
          Functionality Check
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Check all components that are fully functional.
        </p>
        <div className="space-y-3">
          {FUNCTIONALITY_ITEMS.map((item) => {
            const checked = data.functionality_check[item.key];
            return (
              <label
                key={item.key}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                  checked
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setFunctionality(item.key, e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-800 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.hint}</p>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* Inspection Summary JSON preview */}
      <section className="bg-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-400 font-mono mb-2">// inspection_data payload</p>
        <pre className="text-xs text-green-400 font-mono overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </section>

      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onBack}>
          ← Back
        </button>
        <button type="submit" className="btn-primary flex-1">
          Generate My Quote →
        </button>
      </div>
    </form>
  );
}
