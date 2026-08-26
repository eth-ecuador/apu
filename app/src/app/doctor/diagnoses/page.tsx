"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";

const BACKEND_URL = "https://apu-backend-7a8z.onrender.com";

interface Diagnosis {
  id: string;
  patientAddress: string;
  date: string;
  symptoms: string;
  riskScore: number;
  status: "pending" | "completed";
  aiAgent?: {
    name: string;
    tokenId: number;
  };
}

type FilterType = "all" | "pending" | "completed";

export default function DiagnosesPage() {
  const { user } = usePrivy();
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiagnoses();
  }, [user]);

  const fetchDiagnoses = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/doctor/diagnoses`);

      if (response.ok) {
        const data = await response.json();
        console.log("[Doctor Diagnoses] Fetched diagnoses:", data.diagnoses);
        setDiagnoses(data.diagnoses || []);
      } else {
        console.error("[Doctor Diagnoses] Failed to fetch:", response.statusText);
        setDiagnoses([]);
      }
    } catch (err) {
      console.error("[Doctor Diagnoses] Error fetching diagnoses:", err);
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiagnoses = diagnoses.filter((d) =>
    filter === "all" ? true : d.status === filter
  );

  const getRiskColor = (score: number) => {
    if (score >= 40) return "text-[#EF4444] bg-[#EF4444]/10";
    if (score >= 20) return "text-[#F59E0B] bg-[#F59E0B]/10";
    return "text-[#10B981] bg-[#10B981]/10";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-2">
          All Diagnoses
        </h1>
        <p className="text-[#94A3B8]">
          Review and manage all patient diagnoses
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          All ({diagnoses.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "pending"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          Pending ({diagnoses.filter((d) => d.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "completed"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          Completed ({diagnoses.filter((d) => d.status === "completed").length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-sm font-mono text-[#94A3B8]">
            Loading diagnoses...
          </p>
        </div>
      ) : filteredDiagnoses.length === 0 ? (
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
            {filter === "all" ? "No diagnoses yet" : `No ${filter} diagnoses`}
          </h3>
          <p className="text-[#94A3B8]">
            {filter === "all"
              ? "Patient diagnoses will appear here"
              : `No diagnoses with status: ${filter}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiagnoses.map((diagnosis) => (
            <div
              key={diagnosis.id}
              className="p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20 hover:bg-[#1E3A5F]/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-xs text-[#94A3B8]">
                      {new Date(diagnosis.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        diagnosis.status === "completed"
                          ? "bg-[#10B981]/20 text-[#10B981]"
                          : "bg-[#F59E0B]/20 text-[#F59E0B]"
                      }`}
                    >
                      {diagnosis.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-mono text-sm text-[#94A3B8] mb-2">
                    Patient:{" "}
                    {diagnosis.patientAddress.slice(0, 8)}...
                    {diagnosis.patientAddress.slice(-6)}
                  </div>
                  <p className="text-[#F1F5F9] text-sm line-clamp-2">
                    {diagnosis.symptoms}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg font-bold text-lg ${getRiskColor(
                    diagnosis.riskScore
                  )}`}
                >
                  {diagnosis.riskScore}%
                </div>
              </div>

              {diagnosis.aiAgent && (
                <div className="flex items-center gap-2 text-xs text-[#94A3B8] pt-3 border-t border-[#94A3B8]/10">
                  <svg
                    className="w-4 h-4 text-[#14B8A6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>
                    AI Agent: {diagnosis.aiAgent.name} (NFT #
                    {diagnosis.aiAgent.tokenId})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
