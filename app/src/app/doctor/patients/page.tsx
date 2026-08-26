"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { PatientCard } from "../../../components/doctor/PatientCard";

const BACKEND_URL = "https://apu-backend-7a8z.onrender.com";

interface Patient {
  address: string;
  lastSubmission: string;
  diagnosesCount: number;
  pendingCount: number;
  riskLevel: "low" | "medium" | "high";
}

type FilterType = "all" | "pending" | "low" | "medium" | "high";

export default function PatientsPage() {
  const { user } = usePrivy();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/doctor/patients`);

      if (response.ok) {
        const data = await response.json();
        console.log("[Doctor Patients] Fetched patients:", data.patients);
        setPatients(data.patients || []);
      } else {
        console.error("[Doctor Patients] Failed to fetch:", response.statusText);
        setPatients([]);
      }
    } catch (err) {
      console.error("[Doctor Patients] Error fetching patients:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (filter === "all") return true;
    if (filter === "pending") return p.pendingCount > 0;
    return p.riskLevel === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-2">
          All Patients
        </h1>
        <p className="text-[#94A3B8]">
          Manage and review all patients under your care
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          All ({patients.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "pending"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          Pending ({patients.filter((p) => p.pendingCount > 0).length})
        </button>
        <button
          onClick={() => setFilter("high")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "high"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          High Risk ({patients.filter((p) => p.riskLevel === "high").length})
        </button>
        <button
          onClick={() => setFilter("medium")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "medium"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          Medium Risk (
          {patients.filter((p) => p.riskLevel === "medium").length})
        </button>
        <button
          onClick={() => setFilter("low")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === "low"
              ? "bg-[#14B8A6] text-[#0A1628]"
              : "bg-[#1E3A5F]/40 text-[#94A3B8] hover:bg-[#1E3A5F]/60"
          }`}
        >
          Low Risk ({patients.filter((p) => p.riskLevel === "low").length})
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
            Loading patients...
          </p>
        </div>
      ) : filteredPatients.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#F1F5F9] mb-2">
            {filter === "all"
              ? "No patients yet"
              : `No ${filter} patients`}
          </h3>
          <p className="text-[#94A3B8]">
            {filter === "all"
              ? "Patient submissions will appear here"
              : `No patients matching filter: ${filter}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.address} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}
