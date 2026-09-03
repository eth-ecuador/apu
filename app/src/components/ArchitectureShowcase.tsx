"use client";

import { useState } from "react";

export function ArchitectureShowcase() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const layers = [
    {
      id: "frontend",
      name: "Frontend",
      tech: "Next.js 16",
      description: "Modern UI with client-side encryption",
      icon: "🎨",
      color: "brand-violet"
    },
    {
      id: "encryption",
      name: "Encryption",
      tech: "Zama FHE",
      description: "Fully homomorphic encryption for private computation",
      icon: "🔐",
      color: "brand-violet"
    },
    {
      id: "compute",
      name: "Compute",
      tech: "0G TEE",
      description: "Trusted execution with verifiable attestation",
      icon: "⚡",
      color: "success"
    },
    {
      id: "storage",
      name: "Storage",
      tech: "0G Network",
      description: "Distributed encrypted storage with high availability",
      icon: "💾",
      color: "success"
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-apu-ink mb-3">
          Complete Security Architecture
        </h3>
        <p className="text-apu-tenue max-w-2xl mx-auto">
          Production-grade tech stack combining the best of Zama and 0G Labs
        </p>
      </div>

      {/* Architecture Layers - Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
            className={`
              text-center p-6 rounded-xl border-2 transition-all duration-300
              ${activeLayer === layer.id
                ? 'border-brand-violet bg-brand-violet/5 shadow-xl scale-105'
                : 'border-apu-borde bg-white hover:border-brand-violet/50'
              }
            `}
          >
            {/* Icon */}
            <div className="text-5xl mb-4">{layer.icon}</div>

            {/* Name */}
            <h4 className="font-bold text-apu-ink text-lg mb-2">{layer.name}</h4>

            {/* Tech Badge */}
            <div className="mb-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                layer.color === 'brand-violet'
                  ? 'bg-brand-violet/10 text-brand-violet border border-brand-violet/30'
                  : 'bg-success/10 text-success border border-success/30'
              }`}>
                {layer.tech}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-apu-tenue leading-relaxed">
              {layer.description}
            </p>
          </button>
        ))}
      </div>

      {/* Simplified Data Flow */}
      <div className="p-8 rounded-xl bg-white border border-apu-borde">
        <h4 className="text-sm font-semibold text-apu-ink uppercase tracking-wider mb-6 text-center">
          Secure Data Flow
        </h4>

        {/* Flow Steps */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Step 1 */}
          <div className="flex-1 min-w-[120px] text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-sm font-medium text-apu-ink">Patient Data</p>
            <p className="text-xs text-apu-tenue mt-1">Unencrypted</p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:block">
            <svg className="w-6 h-6 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Step 2 */}
          <div className="flex-1 min-w-[120px] text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center">
              <span className="text-3xl">🔐</span>
            </div>
            <p className="text-sm font-medium text-apu-ink">FHE Encryption</p>
            <p className="text-xs text-apu-tenue mt-1">Zama Protocol</p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:block">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Step 3 */}
          <div className="flex-1 min-w-[120px] text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center">
              <span className="text-3xl">⚡</span>
            </div>
            <p className="text-sm font-medium text-apu-ink">TEE Compute</p>
            <p className="text-xs text-apu-tenue mt-1">0G Compute</p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:block">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Step 4 */}
          <div className="flex-1 min-w-[120px] text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center">
              <span className="text-3xl">💾</span>
            </div>
            <p className="text-sm font-medium text-apu-ink">Distributed Storage</p>
            <p className="text-xs text-apu-tenue mt-1">0G Network</p>
          </div>
        </div>

        {/* Privacy Guarantee */}
        <div className="mt-8 p-4 rounded-xl bg-success/5 border border-success/20 text-center">
          <p className="text-sm font-medium text-apu-ink">
            <span className="text-success">100% Privacy</span> • Data remains encrypted at all times
          </p>
        </div>
      </div>
    </div>
  );
}
