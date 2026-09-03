"use client";

import { useState, useEffect } from "react";

export function EncryptionVisualizer() {
  const [step, setStep] = useState(0);
  const [encrypting, setEncrypting] = useState(false);

  const steps = [
    { id: 0, label: "Medical Data", desc: "Symptoms, vitals, history" },
    { id: 1, label: "FHE Encryption", desc: "Zama homomorphic encryption" },
    { id: 2, label: "TEE Compute", desc: "0G secure computation" },
    { id: 3, label: "Encrypted Result", desc: "Result without exposing data" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (step === 1 || step === 2) {
      setEncrypting(true);
      const timeout = setTimeout(() => setEncrypting(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Flow Diagram */}
      <div className="flex items-center justify-between gap-4">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-4 flex-1">
            {/* Step Node */}
            <div className="flex-1">
              <div
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-500
                  ${step === idx
                    ? 'border-brand-violet bg-brand-violet/5 shadow-lg shadow-brand-violet/20'
                    : 'border-apu-borde bg-white'
                  }
                `}
              >
                {/* Encryption Animation Overlay */}
                {encrypting && step === idx && (
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="encryption-flow absolute inset-0" />
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        step >= idx ? 'bg-brand-violet animate-pulse' : 'bg-apu-tenue'
                      }`}
                    />
                    <h4
                      className={`font-mono text-xs uppercase tracking-wider transition-colors ${
                        step === idx ? 'text-brand-violet' : 'text-apu-tenue'
                      }`}
                    >
                      {s.label}
                    </h4>
                  </div>
                  <p className="text-xs text-apu-tenue">{s.desc}</p>
                </div>
              </div>
            </div>

            {/* Arrow Connector */}
            {idx < steps.length - 1 && (
              <div className="flex items-center">
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

      {/* Status Bar */}
      <div className="mt-6 p-4 rounded-lg bg-white border border-apu-borde">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-violet animate-pulse" />
            <span className="font-mono text-apu-ink">
              {step === 0 && "Patient data input..."}
              {step === 1 && "Applying homomorphic encryption..."}
              {step === 2 && "Running diagnosis in TEE..."}
              {step === 3 && "Diagnosis complete with total privacy"}
            </span>
          </div>
          <span className="font-mono text-xs text-brand-violet">
            {((step + 1) / steps.length * 100).toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-apu-wash rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-violet transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Privacy Guarantee Badge */}
      <div className="mt-6 flex items-center justify-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-sm text-apu-ink font-medium">
          Data never exposed • End-to-end encryption • Zero-knowledge computation
        </p>
      </div>
    </div>
  );
}
