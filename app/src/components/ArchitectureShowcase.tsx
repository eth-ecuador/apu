"use client";

import { useState } from "react";

export function ArchitectureShowcase() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const layers = [
    {
      id: "frontend",
      name: "Frontend Layer",
      tech: "Next.js 16 + React 19",
      description: "Modern UI with client-side encryption",
      items: ["Privy Auth", "Wagmi", "Zama React SDK"]
    },
    {
      id: "encryption",
      name: "Encryption Layer",
      tech: "Zama FHE",
      description: "Fully homomorphic encryption for private computation",
      items: ["FHE Encryption", "Key Management", "Proof Generation"]
    },
    {
      id: "compute",
      name: "Compute Layer",
      tech: "0G Compute TEE",
      description: "Trusted execution with verifiable attestation",
      items: ["AI Inference", "TEE Attestation", "Secure Execution"]
    },
    {
      id: "storage",
      name: "Storage Layer",
      tech: "0G Storage",
      description: "Distributed encrypted storage with high availability",
      items: ["Distributed Network", "Encrypted Storage", "Redundancy"]
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-apu-ink mb-3">
          Complete Security Architecture
        </h3>
        <p className="text-apu-tenue max-w-2xl mx-auto">
          Production-grade tech stack combining the best of Zama and 0G Labs
        </p>
      </div>

      {/* Architecture Layers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
            className={`
              text-left p-6 rounded-xl border-2 transition-all duration-300
              ${activeLayer === layer.id
                ? 'border-brand-violet bg-brand-violet/5 shadow-xl shadow-brand-violet/20 scale-105'
                : 'border-apu-borde bg-white hover:border-apu-borde/60'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  activeLayer === layer.id ? 'bg-brand-violet animate-pulse' : 'bg-apu-tenue'
                }`}
              />
              <h4 className="font-bold text-apu-ink text-sm">{layer.name}</h4>
            </div>

            <div className="mb-3">
              <span className="inline-block px-2 py-1 rounded bg-brand-violet/10 border border-brand-violet/30 text-brand-violet text-xs font-mono">
                {layer.tech}
              </span>
            </div>

            <p className="text-xs text-apu-tenue leading-relaxed mb-4">
              {layer.description}
            </p>

            {/* Expandable Details */}
            <div
              className={`
                overflow-hidden transition-all duration-300
                ${activeLayer === layer.id ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div className="pt-3 border-t border-apu-borde space-y-2">
                {layer.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-brand-violet" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-apu-ink">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Data Flow Visualization */}
      <div className="p-6 rounded-xl bg-white border border-apu-borde">
        <h4 className="text-sm font-mono text-apu-ink uppercase tracking-wider mb-4">
          Secure Data Flow
        </h4>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs text-apu-ink font-medium">Patient Data</p>
            <p className="text-xs text-apu-tenue mt-1">Unencrypted</p>
          </div>

          <div className="flex items-center">
            <div className="h-px w-12 bg-gradient-to-r from-brand-violet to-transparent" />
            <svg className="w-4 h-4 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 text-center encryption-flow rounded-lg p-3">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-apu-ink font-medium">FHE Encryption</p>
            <p className="text-xs text-apu-tenue mt-1">Zama Protocol</p>
          </div>

          <div className="flex items-center">
            <div className="h-px w-12 bg-gradient-to-r from-success to-transparent" />
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-apu-ink font-medium">TEE Compute</p>
            <p className="text-xs text-apu-tenue mt-1">0G Compute</p>
          </div>

          <div className="flex items-center">
            <div className="h-px w-12 bg-gradient-to-r from-success to-transparent" />
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <p className="text-xs text-apu-ink font-medium">Distributed Storage</p>
            <p className="text-xs text-apu-tenue mt-1">0G Network</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-success/5 border border-success/20 text-center">
          <p className="text-xs text-apu-ink font-medium">
            <span className="text-success">100% Privacy</span> • Data remains encrypted at all times
          </p>
        </div>
      </div>
    </div>
  );
}
