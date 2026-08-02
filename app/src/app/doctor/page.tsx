"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";

interface Patient {
  address: string;
  submittedAt: string;
  diagnosed: boolean;
  ogStorageRoot: string;
}

export default function DoctorPage() {
  const { ready, authenticated, user } = usePrivy();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authenticated) {
      fetchPatients();
    }
  }, [authenticated]);

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    redirect("/");
  }

  // TODO: Check if user is authorized doctor
  // const isAuthorized = await checkDoctorAuthorization(user.wallet.address);

  const handleViewPatient = async (address: string) => {
    setSelectedPatient(address);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientAddress: address,
          doctorAddress: user?.wallet?.address
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Diagnosis: ${result.diagnosis}\nConfidence: ${result.confidence * 100}%`);
      }
    } catch (error) {
      console.error("Failed to fetch diagnosis:", error);
      alert("Failed to fetch diagnosis. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
            <div className="text-sm text-gray-600">
              {user?.email?.address}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Patient Queue</h2>
            <p className="text-gray-600 mt-1">
              Pending diagnoses requiring review
            </p>
          </div>

          {patients.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Patients</h3>
              <p className="text-gray-600">
                New patient submissions will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {patients.map((patient) => (
                <div key={patient.address} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{patient.address}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Submitted: {new Date(patient.submittedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewPatient(patient.address)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-900">
              <p className="font-medium">Authorization Required</p>
              <p className="text-yellow-700 mt-1">
                You must be authorized by the contract owner to access patient data.
                Contact the administrator for authorization.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
