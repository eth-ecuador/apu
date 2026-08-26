"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { HealthSummary } from "../../../components/patient/HealthSummary";
import { DiagnosisCard } from "../../../components/patient/DiagnosisCard";

const BACKEND_URL = "https://apu-backend-7a8z.onrender.com";

interface Diagnosis {
  id: string;
  date: string;
  symptoms: string;
  riskScore: number;
  status: "pending" | "completed";
  aiAgent?: {
    name: string;
    tokenId: number;
  };
}

export default function PatientDashboardPage() {
  const { user } = usePrivy();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiagnoses();
  }, [user]);

  const fetchDiagnoses = async () => {
    if (!user?.wallet?.address && !user?.email?.address) {
      setLoading(false);
      return;
    }

    try {
      const address = user.wallet?.address || user.email?.address;
      const response = await fetch(
        `${BACKEND_URL}/api/patient/diagnoses?address=${address}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[Dashboard] Fetched diagnoses:", data.diagnoses);
        setDiagnoses(data.diagnoses || []);
      } else {
        console.error("[Dashboard] Failed to fetch diagnoses:", response.statusText);
        setDiagnoses([]);
        setError(`Failed to load diagnoses: ${response.statusText}`);
      }
    } catch (err) {
      console.error("[Dashboard] Error fetching diagnoses:", err);
      setDiagnoses([]);
      setError(err instanceof Error ? err.message : "Failed to fetch diagnoses");
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskLevel = (): "low" | "medium" | "high" => {
    if (diagnoses.length === 0) return "low";
    const latestRisk = diagnoses[0]?.riskScore || 0;
    if (latestRisk < 30) return "low";
    if (latestRisk < 70) return "medium";
    return "high";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-2">
          Welcome back{user?.email?.address ? `, ${user.email.address.split("@")[0]}` : ""}
        </h1>
        <p className="text-[#94A3B8]">
          Your health overview and recent diagnoses
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-sm font-mono text-[#94A3B8]">
            Loading your health data...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Health Summary Cards */}
          <HealthSummary
            totalDiagnoses={diagnoses.length}
            lastDiagnosisDate={diagnoses[0]?.date || null}
            riskLevel={calculateRiskLevel()}
          />

          {/* Recent Diagnoses */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#F1F5F9]">
                Recent Diagnoses
              </h2>
              {diagnoses.length > 3 && (
                <Link
                  href="/patient/diagnoses"
                  className="text-[#14B8A6] hover:text-[#06B6D4] text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  View all
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>

            {diagnoses.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-xl bg-[#1E3A5F]/20 border border-[#94A3B8]/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#14B8A6]/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[#14B8A6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#F1F5F9] mb-2">
                  No diagnoses yet
                </h3>
                <p className="text-[#94A3B8] mb-6">
                  Submit your first symptoms to get an AI-powered diagnosis
                </p>
                <Link
                  href="/patient/submit"
                  className="inline-block px-6 py-3 rounded-lg bg-[#14B8A6] text-[#0A1628] font-medium hover:bg-[#06B6D4] transition-colors"
                >
                  Submit Symptoms
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {diagnoses.slice(0, 3).map((diagnosis) => (
                  <DiagnosisCard key={diagnosis.id} diagnosis={diagnosis} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {diagnoses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/patient/submit"
                className="group p-6 rounded-xl bg-gradient-to-br from-[#14B8A6]/20 to-[#06B6D4]/20 border border-[#14B8A6]/30 hover:border-[#14B8A6]/60 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#14B8A6]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#F1F5F9] mb-1">
                      New Submission
                    </h3>
                    <p className="text-sm text-[#94A3B8]">
                      Submit new symptoms for AI diagnosis
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-[#94A3B8] group-hover:text-[#14B8A6] group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>

              <Link
                href="/patient/diagnoses"
                className="group p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20 hover:border-[#06B6D4]/60 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#06B6D4]/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#06B6D4]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#F1F5F9] mb-1">
                      Full History
                    </h3>
                    <p className="text-sm text-[#94A3B8]">
                      View all your medical diagnoses
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-[#94A3B8] group-hover:text-[#06B6D4] group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-6 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30">
            <div className="flex items-start gap-4">
              <svg
                className="w-6 h-6 text-[#10B981] flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <h3 className="text-[#10B981] font-bold mb-2">
                  Your Privacy is Guaranteed
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  All your medical data is encrypted with Fully Homomorphic
                  Encryption (FHE) using Zama's protocol. Your data is stored
                  on decentralized 0G Storage and AI diagnoses run in a Trusted
                  Execution Environment (TEE). Only authorized doctors can
                  access your information with your explicit permission.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
