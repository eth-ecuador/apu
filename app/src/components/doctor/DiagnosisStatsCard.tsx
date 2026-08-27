"use client";

interface DiagnosisStatsCardProps {
  stats: {
    totalPatients: number;
    pendingDiagnoses: number;
    completedToday: number;
  };
}

export function DiagnosisStatsCard({ stats }: DiagnosisStatsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Patients */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#14B8A6]/20 to-[#06B6D4]/20 border border-[#14B8A6]/30">
        <div className="flex items-center justify-between mb-4">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-[#F1F5F9] mb-1">
          {stats.totalPatients}
        </div>
        <div className="text-sm text-[#94A3B8]">Total Patients</div>
      </div>

      {/* Pending Diagnoses */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/10 border border-[#F59E0B]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#F59E0B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-[#F1F5F9] mb-1">
          {stats.pendingDiagnoses}
        </div>
        <div className="text-sm text-[#94A3B8]">Pending Review</div>
      </div>

      {/* Completed Today */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/10 border border-[#10B981]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-[#10B981]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-[#F1F5F9] mb-1">
          {stats.completedToday}
        </div>
        <div className="text-sm text-[#94A3B8]">Completed Today</div>
      </div>
    </div>
  );
}
