"use client";

import { useState, useEffect } from "react";

export function EncryptionVisualizer() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      id: 0,
      label: "Medical Data",
      icon: "📋",
      desc: "Symptoms, vitals, history",
      color: "brand-violet"
    },
    {
      id: 1,
      label: "FHE Encryption",
      icon: "🔐",
      desc: "Zama homomorphic encryption",
      color: "brand-violet"
    },
    {
      id: 2,
      label: "TEE Compute",
      icon: "⚡",
      desc: "0G secure computation",
      color: "success"
    },
    {
      id: 3,
      label: "Encrypted Result",
      icon: "✓",
      desc: "Result without exposing data",
      color: "success"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Flow Diagram - Horizontal on desktop, vertical on mobile */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 mb-8">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex md:flex-col items-center gap-4 w-full md:w-auto">
            {/* Step Card */}
            <div className="flex-1 md:flex-auto w-full">
              <div
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-500
                  ${step === idx
                    ? 'border-brand-violet bg-brand-violet/5 shadow-lg'
                    : 'border-apu-borde bg-white'
                  }
                `}
              >
                <div className="text-center">
                  {/* Icon */}
                  <div className="text-4xl mb-3">{s.icon}</div>

                  {/* Label */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        step >= idx ? 'bg-brand-violet animate-pulse' : 'bg-apu-tenue'
                      }`}
                    />
                    <h4
                      className={`font-semibold text-sm transition-colors ${
                        step === idx ? 'text-brand-violet' : 'text-apu-ink'
                      }`}
                    >
                      {s.label}
                    </h4>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-apu-tenue">{s.desc}</p>
                </div>
              </div>
            </div>

            {/* Arrow Connector - only between steps, not after last */}
            {idx < steps.length - 1 && (
              <div className="hidden md:flex items-center">
                <svg
                  className={`w-6 h-6 transition-colors duration-500 ${
                    step > idx ? 'text-brand-violet' : 'text-apu-borde'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-apu-wash rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-violet transition-all duration-500 ease-out rounded-full"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-apu-ink">
          {step === 0 && "Patient data input..."}
          {step === 1 && "Applying homomorphic encryption..."}
          {step === 2 && "Running diagnosis in TEE..."}
          {step === 3 && "Diagnosis complete with total privacy"}
        </p>
      </div>

      {/* Privacy Guarantee */}
      <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
        <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-sm text-apu-ink font-medium">
          Data never exposed • End-to-end encryption • Zero-knowledge computation
        </p>
      </div>
    </div>
  );
}
