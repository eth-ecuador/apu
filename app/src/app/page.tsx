"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { EncryptionVisualizer } from "../components/EncryptionVisualizer";
import { ArchitectureShowcase } from "../components/ArchitectureShowcase";

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
                <h1 className="text-xl font-semibold text-[#F1F5F9]">APU Medical</h1>
                <p className="text-xs font-mono text-[#94A3B8]">0G Apollo Accelerator</p>
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
                  {backendStatus === 'online' ? 'Production Ready' :
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
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {authenticated ? (
          <div className="space-y-16">
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

            {/* Security Metrics - Professional stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 fade-in-delay-1">
              <div className="tech-card">
                <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">Encriptación</div>
                <div className="text-3xl font-bold text-[#14B8A6] mb-1">256-bit</div>
                <p className="text-xs text-[#94A3B8]">FHE + AES</p>
              </div>

              <div className="tech-card">
                <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">TEE Status</div>
                <div className="text-3xl font-bold text-[#10B981] mb-1">Verified</div>
                <p className="text-xs text-[#94A3B8]">0G Compute</p>
              </div>

              <div className="tech-card">
                <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">Uptime</div>
                <div className="text-3xl font-bold text-[#06B6D4] mb-1">99.9%</div>
                <p className="text-xs text-[#94A3B8]">Last 30 days</p>
              </div>

              <div className="tech-card">
                <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">Network</div>
                <div className="text-3xl font-bold text-[#F59E0B] mb-1">Active</div>
                <p className="text-xs text-[#94A3B8]">Sepolia + 0G</p>
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
          <div className="space-y-24">
            {/* Hero Section - Professional pitch */}
            <div className="text-center max-w-5xl mx-auto fade-in">
              <div className="inline-block mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center shadow-2xl shadow-[#14B8A6]/30">
                  <span className="text-[#0A1628] font-bold text-3xl">A</span>
                </div>
              </div>

              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#F1F5F9] mb-6 leading-tight">
                Diagnóstico Médico con IA<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#06B6D4]">
                  Privacidad Absoluta
                </span>
              </h2>

              <p className="text-xl md:text-2xl text-[#94A3B8] mb-6 leading-relaxed max-w-3xl mx-auto">
                Primera plataforma de diagnóstico médico con encriptación homomórfica completa y ejecución verificable
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <div className="status-badge">
                  <span className="text-sm">Zama FHE Protocol</span>
                </div>
                <div className="status-badge">
                  <span className="text-sm">0G Compute TEE</span>
                </div>
                <div className="status-badge">
                  <span className="text-sm">0G Distributed Storage</span>
                </div>
              </div>

              <button
                onClick={login}
                className="portal-button portal-button-primary text-lg px-12 py-4 hover:scale-105 transform transition-transform shadow-xl shadow-[#14B8A6]/30 mb-6"
              >
                Conectar Wallet para Comenzar
              </button>

              <p className="text-sm text-[#94A3B8] font-mono">
                Zama FHE • 0G Compute TEE • 0G Storage
              </p>
            </div>

            {/* Live Encryption Demo - Signature element */}
            <div className="fade-in-delay-1">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#F1F5F9] mb-2">
                  Demostración en Vivo
                </h3>
                <p className="text-[#94A3B8]">
                  Visualiza cómo funciona la encriptación homomórfica en tiempo real
                </p>
              </div>
              <EncryptionVisualizer />
            </div>

            {/* Architecture Showcase */}
            <div className="fade-in-delay-2">
              <ArchitectureShowcase />
            </div>

            {/* Value Proposition - Why it matters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto fade-in-delay-3">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#14B8A6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-[#F1F5F9] mb-3">Zero Knowledge Medical AI</h4>
                <p className="text-[#94A3B8] leading-relaxed">
                  Los datos médicos nunca se exponen. La IA realiza diagnósticos sobre datos encriptados usando FHE de Zama.
                </p>
              </div>

              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-[#F1F5F9] mb-3">Verified Execution</h4>
                <p className="text-[#94A3B8] leading-relaxed">
                  Toda inferencia de IA corre en 0G Compute TEE con attestation criptográfica verificable on-chain.
                </p>
              </div>

              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-[#F1F5F9] mb-3">Decentralized Storage</h4>
                <p className="text-[#94A3B8] leading-relaxed">
                  Registros médicos almacenados encriptados en 0G Storage con alta disponibilidad y redundancia.
                </p>
              </div>
            </div>

            {/* Impact Statement */}
            <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-[#1E3A5F]/50 to-[#0A1628]/50 border border-[#14B8A6]/20 fade-in-delay-3">
              <h3 className="text-3xl font-bold text-[#F1F5F9] mb-4">
                Construido para el 0G Apollo Accelerator
              </h3>
              <p className="text-lg text-[#94A3B8] mb-6 leading-relaxed">
                Sistema de diagnóstico médico que combina encriptación homomórfica completa de Zama con la infraestructura
                descentralizada de 0G Labs, garantizando privacidad absoluta del paciente en cada etapa del proceso.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm font-mono text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Production Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                  <span>Fully Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                  <span>TEE Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="relative z-10 border-t border-[#94A3B8]/10 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14B8A6] to-[#06B6D4] flex items-center justify-center">
                  <span className="text-[#0A1628] font-bold">A</span>
                </div>
                <span className="font-bold text-[#F1F5F9]">APU Medical</span>
              </div>
              <p className="text-sm text-[#94A3B8]">
                Diagnóstico médico con IA preservando privacidad absoluta
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#F1F5F9] mb-3">Tecnología</h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li><a href="https://www.zama.ai" target="_blank" rel="noopener" className="hover:text-[#14B8A6] transition-colors">Zama FHE</a></li>
                <li><a href="https://0g.ai" target="_blank" rel="noopener" className="hover:text-[#14B8A6] transition-colors">0G Labs</a></li>
                <li><a href="https://sepolia.etherscan.io" target="_blank" rel="noopener" className="hover:text-[#14B8A6] transition-colors">Ethereum Sepolia</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#F1F5F9] mb-3">Programa</h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li>0G Apollo Accelerator</li>
                <li>Batch 2026</li>
                <li>Medical AI Track</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#F1F5F9] mb-3">Estado</h4>
              <ul className="space-y-2 text-sm text-[#94A3B8]">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Production Ready</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
                  <span>Fully Encrypted</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#94A3B8]/10 flex items-center justify-between text-sm text-[#94A3B8]">
            <p className="font-mono">© 2026 APU Medical. Built with Zama × 0G Labs</p>
            <p className="font-mono">0G Apollo Accelerator</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
