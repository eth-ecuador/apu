"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { DiagnosisStatsCard } from "../../../components/doctor/DiagnosisStatsCard";
import { PatientCard } from "../../../components/doctor/PatientCard";

const BACKEND_URL = "https://apu-backend-7a8z.onrender.com";

interface Patient {
  address: string;
  lastSubmission: string;
  diagnosesCount: number;
  pendingCount: number;
  riskLevel: "low" | "medium" | "high";
}

export default function DoctorDashboardPage() {
  const { user } = usePrivy();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    pendingDiagnoses: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch both patients and stats in parallel
      const [patientsRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/doctor/patients`),
        fetch(`${BACKEND_URL}/api/doctor/stats`),
      ]);

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        console.log("[Doctor Dashboard] Fetched patients:", data.patients);
        setPatients(data.patients || []);
      } else {
        console.error("[Doctor Dashboard] Failed to fetch patients:", patientsRes.statusText);
        setPatients([]);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        console.log("[Doctor Dashboard] Fetched stats:", data.stats);
        setStats(data.stats || { totalPatients: 0, pendingDiagnoses: 0, completedToday: 0 });
      } else {
        console.error("[Doctor Dashboard] Failed to fetch stats:", statsRes.statusText);
      }
    } catch (err) {
      console.error("[Doctor Dashboard] Error fetching data:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const pendingPatients = patients.filter((p) => p.pendingCount > 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-2">
          Doctor Dashboard
        </h1>
        <p className="text-[#94A3B8]">
          Welcome back,{" "}
          {user?.wallet?.address
            ? `Dr. ${user.wallet.address.slice(0, 6)}`
            : "Doctor"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <DiagnosisStatsCard stats={stats} />
      </div>

      {/* Patients Requiring Attention */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#F1F5F9] mb-1">
              Patients Requiring Attention
            </h2>
            <p className="text-sm text-[#94A3B8]">
              {pendingPatients.length} patients with pending diagnoses
            </p>
          </div>
          <Link
            href="/doctor/patients"
            className="px-4 py-2 rounded-lg bg-[#14B8A6] text-[#0A1628] font-medium hover:bg-[#06B6D4] transition-colors"
          >
            View All Patients
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="loading-dots mb-4">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p className="text-sm font-mono text-[#94A3B8]">
              Loading patients...
            </p>
          </div>
        ) : pendingPatients.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-xl bg-[#1E3A5F]/20 border border-[#94A3B8]/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#10B981]/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#10B981]"
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
            <h3 className="text-xl font-bold text-[#F1F5F9] mb-2">
              All caught up!
            </h3>
            <p className="text-[#94A3B8]">
              No pending diagnoses at the moment
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPatients.map((patient) => (
              <PatientCard key={patient.address} patient={patient} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-4">
          Recent Activity
        </h2>
        <div className="p-6 rounded-xl bg-[#1E3A5F]/30 border border-[#94A3B8]/20">
          <div className="space-y-4">
            {[
              {
                action: "Diagnosis completed",
                patient: "0x742d...0bEb1",
                time: "2 hours ago",
                type: "success",
              },
              {
                action: "New submission",
                patient: "0x5B38...ddC4",
                time: "5 hours ago",
                type: "info",
              },
              {
                action: "Diagnosis completed",
                patient: "0xAb84...5cb2",
                time: "1 day ago",
                type: "success",
              },
            ].map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-[#94A3B8]/10 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "success"
                        ? "bg-[#10B981]"
                        : "bg-[#14B8A6]"
                    }`}
                  />
                  <div>
                    <div className="text-[#F1F5F9] font-medium">
                      {activity.action}
                    </div>
                    <div className="text-sm text-[#94A3B8] font-mono">
                      Patient: {activity.patient}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-[#94A3B8]">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 p-6 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30">
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
              Privacy-Preserving Access
            </h3>
            <p className="text-sm text-[#94A3B8]">
              All patient data is encrypted with FHE. You can only access data
              for which you have been granted explicit permission via on-chain
              ACL (Access Control List).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
