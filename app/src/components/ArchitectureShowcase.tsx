"use client";

import { useState } from "react";

export function ArchitectureShowcase() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const layers = [
    {
      id: "frontend",
      name: "Frontend Layer",
      tech: "Next.js 16 + React 19",
      description: "Interfaz de usuario moderna con encriptación del lado del cliente",
      color: "#14B8A6",
      items: ["Privy Auth", "Wagmi", "Zama React SDK"]
    },
    {
      id: "encryption",
      name: "Encryption Layer",
      tech: "Zama FHE",
      description: "Encriptación homomórfica completa para cómputo sin exponer datos",
      color: "#06B6D4",
      items: ["FHE Encryption", "Key Management", "Proof Generation"]
    },
    {
      id: "compute",
      name: "Compute Layer",
      tech: "0G Compute TEE",
      description: "Ambiente de ejecución confiable con attestation verificable",
      color: "#10B981",
      items: ["AI Inference", "TEE Attestation", "Secure Execution"]
    },
    {
      id: "storage",
      name: "Storage Layer",
      tech: "0G Storage",
      description: "Almacenamiento distribuido encriptado con alta disponibilidad",
      color: "#F59E0B",
      items: ["Distributed Network", "Encrypted Storage", "Redundancy"]
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-[#F1F5F9] mb-3">
          Arquitectura de Seguridad Completa
        </h3>
        <p className="text-[#94A3B8] max-w-2xl mx-auto">
          Stack tecnológico de nivel producción combinando lo mejor de Zama y 0G Labs
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
                ? 'border-[#14B8A6] bg-[#1E3A5F]/60 shadow-xl shadow-[#14B8A6]/20 scale-105'
                : 'border-[#94A3B8]/20 bg-[#1E3A5F]/30 hover:border-[#94A3B8]/40'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  activeLayer === layer.id ? 'animate-pulse' : ''
                }`}
                style={{ backgroundColor: layer.color }}
              />
              <h4 className="font-bold text-[#F1F5F9] text-sm">{layer.name}</h4>
            </div>

            <div className="mb-3">
              <span className="inline-block px-2 py-1 rounded bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] text-xs font-mono">
                {layer.tech}
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
              {layer.description}
            </p>

            {/* Expandable Details */}
            <div
              className={`
                overflow-hidden transition-all duration-300
                ${activeLayer === layer.id ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div className="pt-3 border-t border-[#94A3B8]/20 space-y-2">
                {layer.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-[#14B8A6]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-[#F1F5F9]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Data Flow Visualization */}
      <div className="p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/10">
        <h4 className="text-sm font-mono text-[#94A3B8] uppercase tracking-wider mb-4">
          Flujo de Datos Seguro
        </h4>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs text-[#F1F5F9] font-medium">Datos del Paciente</p>
            <p className="text-xs text-[#94A3B8] mt-1">Sin cifrar</p>
          </div>

          <div className="flex items-center">
            <div className="h-px w-12 bg-gradient-to-r from-[#14B8A6] to-transparent" />
            <svg className="w-4 h-4 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 text-center encryption-flow rounded-lg p-3">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-[#F1F5F9] font-medium">Encriptación FHE</p>
            <p className="text-xs text-[#94A3B8] mt-1">Zama Protocol</p>
          </div>

          <div className="flex items-center">
            <div className="h-px w-12 bg-gradient-to-r from-[#06B6D4] to-transparent" />
            <svg className="w-4 h-4 text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-[#F1F5F9] font-medium">Cómputo TEE</p>
            <p className="text-xs text-[#94A3B8] mt-1">0G Compute</p>
          </div>

          <div className="flex items-center">
            <div className="h-px w-12 bg-gradient-to-r from-[#10B981] to-transparent" />
            <svg className="w-4 h-4 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <p className="text-xs text-[#F1F5F9] font-medium">Storage Distribuido</p>
            <p className="text-xs text-[#94A3B8] mt-1">0G Network</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-[#14B8A6]/5 border border-[#14B8A6]/20 text-center">
          <p className="text-xs text-[#F1F5F9] font-medium">
            <span className="text-[#14B8A6]">100% Privacidad</span> • Los datos permanecen encriptados en todo momento
          </p>
        </div>
      </div>
    </div>
  );
}
