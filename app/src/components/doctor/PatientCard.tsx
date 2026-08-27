"use client";

import Link from "next/link";

interface PatientCardProps {
  patient: {
    address: string;
    lastSubmission: string;
    diagnosesCount: number;
    pendingCount: number;
    riskLevel: "low" | "medium" | "high";
  };
}

export function PatientCard({ patient }: PatientCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30";
      case "medium":
        return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30";
      default:
        return "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30";
    }
  };

  return (
    <Link
      href={`/doctor/patients/${patient.address}`}
      className="block p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20 hover:bg-[#1E3A5F]/50 hover:border-[#14B8A6]/40 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="font-mono text-sm text-[#F1F5F9] mb-2">
            {patient.address.slice(0, 8)}...{patient.address.slice(-6)}
          </div>
          <div className="text-xs text-[#94A3B8]">
            Last submission:{" "}
            {new Date(patient.lastSubmission).toLocaleDateString()}
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRiskColor(
            patient.riskLevel
          )}`}
        >
          {patient.riskLevel.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-[#0A1628]/50 border border-[#94A3B8]/10">
          <div className="text-xs text-[#94A3B8] mb-1">Total Diagnoses</div>
          <div className="text-xl font-bold text-[#F1F5F9]">
            {patient.diagnosesCount}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-[#0A1628]/50 border border-[#94A3B8]/10">
          <div className="text-xs text-[#94A3B8] mb-1">Pending Review</div>
          <div className="text-xl font-bold text-[#F59E0B]">
            {patient.pendingCount}
          </div>
        </div>
      </div>
    </Link>
  );
}
