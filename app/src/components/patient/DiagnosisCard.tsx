"use client";

import Link from "next/link";

interface DiagnosisCardProps {
  diagnosis: {
    id: string;
    date: string;
    symptoms: string;
    riskScore: number;
    status: "pending" | "completed";
    aiAgent?: {
      name: string;
      tokenId: number;
    };
  };
}

export function DiagnosisCard({ diagnosis }: DiagnosisCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-[#10B981]";
    if (score < 70) return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  return (
    <Link href={`/patient/diagnoses/${diagnosis.id}`}>
      <div className="p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20 hover:border-[#14B8A6]/60 transition-all cursor-pointer group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  diagnosis.status === "completed"
                    ? "bg-[#10B981]"
                    : "bg-[#F59E0B]"
                } animate-pulse`}
              />
              <span className="text-xs font-mono text-[#94A3B8]">
                {formatDate(diagnosis.date)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  diagnosis.status === "completed"
                    ? "bg-[#10B981]/20 text-[#10B981]"
                    : "bg-[#F59E0B]/20 text-[#F59E0B]"
                }`}
              >
                {diagnosis.status}
              </span>
            </div>

            {/* Symptoms */}
            <p className="text-[#F1F5F9] mb-4 line-clamp-2 leading-relaxed">
              {diagnosis.symptoms}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Risk Score:</span>
                <span
                  className={`text-sm font-bold ${getRiskColor(
                    diagnosis.riskScore
                  )}`}
                >
                  {diagnosis.riskScore}
                </span>
              </div>

              {diagnosis.aiAgent && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94A3B8]">AI Agent:</span>
                  <span className="text-xs font-mono text-[#14B8A6]">
                    #{diagnosis.aiAgent.tokenId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow Icon */}
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
      </div>
    </Link>
  );
}
