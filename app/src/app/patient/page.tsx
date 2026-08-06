"use client";

import { usePrivy } from "@privy-io/react-auth";
import { PatientDashboard } from "../../components/PatientDashboard";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function PatientPage() {
  const { ready, authenticated } = usePrivy();

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
          <p className="text-sm font-mono text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    redirect("/");
  }

  return (
    <div className="min-h-screen relative">
      <div className="cyber-grid" />

      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/20 backdrop-blur-sm bg-cyber-navy-light/80">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold">Patient Portal</h1>
              <p className="text-sm font-mono text-cyan-400">Confidential Medical Submission</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-cyber-navy-light border border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50 transition-all text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 fade-in">
            <PatientDashboard />
          </div>

          {/* Sidebar */}
          <div className="space-y-6 fade-in-delay-1">
            {/* How It Works */}
            <div className="p-6 rounded-xl bg-cyber-navy-light border border-cyan-500/20">
              <h3 className="text-lg font-serif font-semibold mb-4">Data Flow</h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-mono text-sm text-cyan-400">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">FHE Encryption</div>
                    <p className="text-xs text-slate-400">Risk score encrypted client-side with Zama</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-mono text-sm text-cyan-400">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">Blockchain Storage</div>
                    <p className="text-xs text-slate-400">Encrypted data submitted to Sepolia contract</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-mono text-sm text-cyan-400">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">0G Storage</div>
                    <p className="text-xs text-slate-400">Medical history encrypted in decentralized storage</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-mono text-sm text-cyan-400">
                    4
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">AI TEE Diagnosis</div>
                    <p className="text-xs text-slate-400">Secure AI inference with attestation</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Privacy Guarantees */}
            <div className="p-6 rounded-xl bg-cyber-navy-light border border-green-500/20">
              <div className="tee-badge border-0 p-0 mb-4">
                PRIVACY GUARANTEED
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Zero-knowledge computation on encrypted values</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>TEE-verified AI with cryptographic attestation</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Decentralized storage with client-side encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>On-chain encrypted data with ACL permissions</span>
                </li>
              </ul>
            </div>

            {/* Technical Stack */}
            <div className="p-6 rounded-xl bg-cyber-navy-light border border-cyan-500/20">
              <h3 className="text-sm font-mono text-slate-400 mb-3">TECH STACK</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-cyan-500/10">
                  <span className="text-slate-400">Encryption</span>
                  <span className="font-mono text-cyan-400">Zama FHE</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-cyan-500/10">
                  <span className="text-slate-400">Blockchain</span>
                  <span className="font-mono text-cyan-400">Sepolia</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-cyan-500/10">
                  <span className="text-slate-400">Storage</span>
                  <span className="font-mono text-cyan-400">0G Network</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400">AI Compute</span>
                  <span className="font-mono text-cyan-400">0G TEE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
