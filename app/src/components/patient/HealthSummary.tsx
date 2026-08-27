"use client";

interface HealthSummaryProps {
  totalDiagnoses: number;
  lastDiagnosisDate: string | null;
  riskLevel: "low" | "medium" | "high";
}

export function HealthSummary({
  totalDiagnoses,
  lastDiagnosisDate,
  riskLevel,
}: HealthSummaryProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case "low":
        return "text-[#10B981]";
      case "medium":
        return "text-[#F59E0B]";
      case "high":
        return "text-[#EF4444]";
      default:
        return "text-[#94A3B8]";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Diagnoses */}
      <div className="p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20">
        <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">
          Total Diagnoses
        </div>
        <div className="text-4xl font-bold text-[#14B8A6] mb-1">
          {totalDiagnoses}
        </div>
        <p className="text-xs text-[#94A3B8]">All time</p>
      </div>

      {/* Last Checkup */}
      <div className="p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20">
        <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">
          Last Checkup
        </div>
        <div className="text-xl font-bold text-[#F1F5F9] mb-1">
          {formatDate(lastDiagnosisDate)}
        </div>
        <p className="text-xs text-[#94A3B8]">Most recent</p>
      </div>

      {/* Risk Level */}
      <div className="p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20">
        <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider mb-2">
          Current Risk
        </div>
        <div className={`text-3xl font-bold ${getRiskColor()} mb-1`}>
          {riskLevel.toUpperCase()}
        </div>
        <p className="text-xs text-[#94A3B8]">Based on last diagnosis</p>
      </div>
    </div>
  );
}
