"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check backend status
    fetch('https://apu-backend-7a8z.onrender.com/health')
      .then(res => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
        <div className="clinical-grid" />
        <div className="relative z-10 text-center">
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-sm font-mono text-[#94A3B8]">Inicializando conexión segura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#0A1628]">
      {/* Subtle Clinical Grid Background */}
      <div className="clinical-grid" />

      {/* Header - Clean and minimal */}
      <header className="relative z-10 border-b border-[#94A3B8]/10 backdrop-blur-sm bg-[#1E3A5F]/30">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo - Simple and professional */}
            <div className="flex items-center gap-3 fade-in">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center">
                <span className="text-[#0A1628] font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#F1F5F9]">APU</h1>
                <p className="text-xs font-mono text-[#94A3B8]">Diagnóstico Confidencial</p>
              </div>
            </div>

            <div className="flex items-center gap-4 fade-in-delay-1">
              {/* Backend Status - Subtle indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E3A5F]/40 border border-[#94A3B8]/15">
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-[#10B981]' :
                  backendStatus === 'offline' ? 'bg-[#EF4444]' :
                  'bg-[#94A3B8]'
                } ${backendStatus === 'online' ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-mono text-[#94A3B8]">
                  {backendStatus === 'online' ? 'Sistema activo' :
                   backendStatus === 'offline' ? 'Sin conexión' : 'Verificando...'}
                </span>
              </div>

              {authenticated ? (
                <button
                  onClick={logout}
                  className="portal-button portal-button-secondary text-sm"
                >
                  Cerrar sesión
                </button>
              ) : (
                <button
                  onClick={login}
                  className="portal-button portal-button-primary"
                >
                  Conectar Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {authenticated ? (
          <div className="space-y-12">
            {/* Welcome Section - Clean */}
            <div className="fade-in">
              <h2 className="text-4xl font-bold text-[#F1F5F9] mb-2">
                Bienvenido de vuelta
              </h2>
              <p className="text-[#94A3B8] font-mono text-sm">
                {user?.wallet?.address ?
                  `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` :
                  user?.email?.address || 'Usuario'}
              </p>
            </div>

            {/* Tech Stack Status - Inspired by BitMind's metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in-delay-1">
              <div className="tech-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                  <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">Encriptación FHE</span>
                </div>
                <div className="text-2xl font-bold text-[#F1F5F9] mb-1">Zama</div>
                <p className="text-sm text-[#94A3B8]">Cómputo homomórfico completo</p>
              </div>

              <div className="tech-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                  <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">Ejecución Verificada</span>
                </div>
                <div className="text-2xl font-bold text-[#F1F5F9] mb-1">0G TEE</div>
                <p className="text-sm text-[#94A3B8]">Ambiente de ejecución confiable</p>
              </div>

              <div className="tech-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">Almacenamiento</span>
                </div>
                <div className="text-2xl font-bold text-[#F1F5F9] mb-1">0G Storage</div>
                <p className="text-sm text-[#94A3B8]">Red distribuida encriptada</p>
              </div>
            </div>

            {/* Portal Selection - Clean cards with hover effects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in-delay-2">
              <a
                href="/patient"
                className="group relative p-8 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20 hover:border-[#14B8A6]/60 transition-all hover:bg-[#1E3A5F]/50"
              >
                <div className="encryption-flow absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#F1F5F9] mb-3">Portal de Pacientes</h3>
                  <p className="text-[#94A3B8] leading-relaxed mb-6">
                    Envía datos médicos encriptados y recibe diagnóstico con IA preservando privacidad total
                  </p>
                  <div className="flex items-center gap-2 text-[#14B8A6] font-medium text-sm group-hover:translate-x-2 transition-transform">
                    <span>Ingresar al portal</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              <a
                href="/doctor"
                className="group relative p-8 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20 hover:border-[#06B6D4]/60 transition-all hover:bg-[#1E3A5F]/50"
              >
                <div className="encryption-flow absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#F1F5F9] mb-3">Portal de Médicos</h3>
                  <p className="text-[#94A3B8] leading-relaxed mb-6">
                    Revisa diagnósticos, accede a datos médicos encriptados y almacena diagnósticos verificados
                  </p>
                  <div className="flex items-center gap-2 text-[#06B6D4] font-medium text-sm group-hover:translate-x-2 transition-transform">
                    <span>Ingresar al portal</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 max-w-4xl mx-auto">
            <div className="fade-in">
              {/* Hero - Clean and focused */}
              <div className="inline-block mb-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#14B8A6]/20">
                  <span className="text-[#0A1628] font-bold text-3xl">A</span>
                </div>
              </div>

              <h2 className="text-5xl md:text-6xl font-bold text-[#F1F5F9] mb-6 leading-tight">
                Diagnóstico Médico<br />Confidencial
              </h2>

              <p className="text-xl text-[#94A3B8] mb-4 leading-relaxed">
                IA médica con encriptación homomórfica total
              </p>

              <p className="text-sm font-mono text-[#14B8A6] mb-12 tracking-wide">
                Zama FHE × 0G Storage × 0G Compute TEE
              </p>

              <button
                onClick={login}
                className="portal-button portal-button-primary text-lg px-12 py-4 hover:scale-105 transform transition-transform shadow-lg shadow-[#14B8A6]/20"
              >
                Conectar Wallet para Empezar
              </button>

              {/* Trust Statement - Inspired by Pulsar's clarity */}
              <div className="mt-16 p-6 rounded-xl bg-[#1E3A5F]/20 border border-[#94A3B8]/10">
                <p className="text-[#F1F5F9] font-medium mb-2">
                  Sus datos nunca salen sin cifrar
                </p>
                <p className="text-sm text-[#94A3B8]">
                  La encriptación homomórfica completa permite realizar diagnósticos con IA sin exponer información sensible
                </p>
              </div>

              {/* Tech Features - Clean grid */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-delay-2">
                <div className="tech-card text-left">
                  <div className="status-badge mb-4 border-0 p-0">
                    <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">FHE Total</span>
                  </div>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Cómputo sobre datos encriptados sin necesidad de descifrado usando el protocolo FHE de Zama
                  </p>
                </div>

                <div className="tech-card text-left">
                  <div className="status-badge mb-4 border-0 p-0">
                    <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">TEE Verificado</span>
                  </div>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Inferencia de IA en el ambiente de ejecución confiable de 0G Compute con attestation
                  </p>
                </div>

                <div className="tech-card text-left">
                  <div className="status-badge mb-4 border-0 p-0">
                    <span className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">Storage Distribuido</span>
                  </div>
                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    Registros médicos almacenados encriptados en la red de almacenamiento distribuido de 0G
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#94A3B8]/10 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-[#94A3B8]">
            <p className="font-mono">APU Medical © 2026</p>
            <p className="font-mono">0G Apollo Accelerator</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
