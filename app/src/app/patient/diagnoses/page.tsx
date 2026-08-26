"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
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
        console.log("[Diagnoses] Fetched data:", data.diagnoses);
        setDiagnoses(data.diagnoses || []);
      } else {
        console.error("[Diagnoses] Failed to fetch:", response.statusText);
        setDiagnoses([]);
      }
    } catch (err) {
      console.error("[Diagnoses] Error fetching data:", err);
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiagnoses = diagnoses.filter((d) =>
    filter === "all" ? true : d.status === filter
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-2">
          Medical History
        </h1>
        <p className="text-[#94A3B8]">
          All your diagnoses encrypted with FHE and stored on 0G
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
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "completed"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          Completed (
          {diagnoses.filter((d) => d.status === "completed").length})
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
          <p className="text-[#94A3B8] mb-6">
            {filter === "all"
              ? "Submit your first symptoms to get an AI-powered diagnosis"
              : `No diagnoses with status: ${filter}`}
          </p>
          {filter === "all" && (
            <Link
              href="/patient/submit"
              className="inline-block px-6 py-3 rounded-lg bg-[#14B8A6] text-[#0A1628] font-medium hover:bg-[#06B6D4] transition-colors"
            >
              Submit Your First Symptoms
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDiagnoses.map((diagnosis) => (
            <DiagnosisCard key={diagnosis.id} diagnosis={diagnosis} />
          ))}
        </div>
      )}
    </div>
  );
}
