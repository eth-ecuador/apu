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
      <div className="min-h-screen flex items-center justify-center">
        <div className="cyber-grid" />
        <div className="relative z-10 text-center">
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-sm font-mono text-slate-400">Initializing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Animated Background Grid */}
      <div className="cyber-grid" />

      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/20 backdrop-blur-sm bg-cyber-navy-light/80">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-lg">
                  APU
                </div>
                <div>
                  <h1 className="text-xl font-semibold font-serif">APU Medical</h1>
                  <p className="text-xs font-mono text-cyan-400">Confidential AI Diagnosis</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 fade-in-delay-1">
              {/* Backend Status */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-navy-light border border-cyan-500/20">
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-green-500' :
                  backendStatus === 'offline' ? 'bg-red-500' :
                  'bg-amber-500'
                } ${backendStatus === 'online' ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-mono">
                  {backendStatus === 'online' ? 'Backend Live' :
                   backendStatus === 'offline' ? 'Offline' : 'Checking...'}
                </span>
              </div>

              {authenticated ? (
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-cyber-navy-light border border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50 transition-all"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={login}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {authenticated ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="fade-in">
              <h2 className="text-3xl font-serif font-semibold mb-2">
                Welcome back
              </h2>
              <p className="text-slate-400 font-mono text-sm">
                {user?.wallet?.address ?
                  `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` :
                  user?.email?.address || 'User'}
              </p>
            </div>

            {/* Network Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in-delay-1">
              <div className="p-6 rounded-xl bg-cyber-navy-light border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-slate-400">NETWORK STATUS</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">Sepolia</span>
                    <span className="text-xs text-green-500">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">0G Galileo</span>
                    <span className="text-xs text-green-500">Connected</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-cyber-navy-light border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-xs font-mono text-slate-400">ENCRYPTION</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">Zama FHE</span>
                    <span className="text-xs text-cyan-400">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">AES-256</span>
                    <span className="text-xs text-cyan-400">Active</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-cyber-navy-light border border-green-500/20 hover:border-green-500/40 transition-all">
                <div className="tee-badge border-0 p-0">
                  <span className="text-xs font-mono text-slate-400">TEE VERIFIED</span>
                </div>
                <div className="mt-3">
                  <span className="text-sm font-mono text-green-500">0G Compute</span>
                  <p className="text-xs text-slate-500 mt-1">Trusted Execution Environment</p>
                </div>
              </div>
            </div>

            {/* Portal Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in-delay-2">
              <a
                href="/patient"
                className="group relative p-8 rounded-xl bg-cyber-navy-light border-2 border-cyan-500/30 hover:border-cyan-500 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]"
              >
                <div className="encryption-pulse absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-2">Patient Portal</h3>
                  <p className="text-slate-400 mb-4">
                    Submit encrypted medical data and receive AI-powered diagnosis with complete privacy
                  </p>
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm group-hover:translate-x-2 transition-transform">
                    <span>Enter Portal</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              <a
                href="/doctor"
                className="group relative p-8 rounded-xl bg-cyber-navy-light border-2 border-green-500/30 hover:border-green-500 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              >
                <div className="encryption-pulse absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-semibold mb-2">Doctor Portal</h3>
                  <p className="text-slate-400 mb-4">
                    Review patient diagnoses, access encrypted medical data, and store verified diagnoses
                  </p>
                  <div className="flex items-center gap-2 text-green-400 font-mono text-sm group-hover:translate-x-2 transition-transform">
                    <span>Enter Portal</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="fade-in">
              <div className="inline-block mb-8 p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-2xl">
                  APU
                </div>
              </div>
              <h2 className="text-5xl font-serif font-semibold mb-4">
                Confidential Medical AI
              </h2>
              <p className="text-xl text-slate-400 mb-3 max-w-2xl mx-auto">
                AI-powered diagnosis with cryptographic privacy guarantees
              </p>
              <p className="text-sm font-mono text-cyan-400 mb-12">
                Zama FHE × 0G Storage × 0G Compute TEE
              </p>

              <button
                onClick={login}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
              >
                Connect Wallet to Start
              </button>

              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto fade-in-delay-2">
                <div className="p-6 rounded-xl bg-cyber-navy-light border border-cyan-500/20">
                  <div className="text-cyan-400 mb-3 font-mono text-sm">FULLY HOMOMORPHIC</div>
                  <p className="text-sm text-slate-400">Compute on encrypted data without decryption using Zama's FHE protocol</p>
                </div>
                <div className="p-6 rounded-xl bg-cyber-navy-light border border-cyan-500/20">
                  <div className="text-cyan-400 mb-3 font-mono text-sm">TEE VERIFIED</div>
                  <p className="text-sm text-slate-400">AI inference runs in 0G Compute's trusted execution environment with attestation</p>
                </div>
                <div className="p-6 rounded-xl bg-cyber-navy-light border border-cyan-500/20">
                  <div className="text-cyan-400 mb-3 font-mono text-sm">DECENTRALIZED STORAGE</div>
                  <p className="text-sm text-slate-400">Medical records stored encrypted across 0G's distributed storage network</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
