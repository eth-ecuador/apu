"use client";

import { useAccount } from "wagmi";
import { useIsDoctorAuthorized } from "@/lib/hooks";
import { useDecryptPatientRecords } from "@/app/hooks/useMedicalData";
import { useState } from "react";
import { isAddress } from "viem";

export default function DoctorDashboardPage() {
  const { address: doctorAddress, isConnected } = useAccount();
  const [patientAddress, setPatientAddress] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const { isAuthorized, refetch: refetchAuth } = useIsDoctorAuthorized(
    selectedPatient as `0x${string}`,
    doctorAddress as `0x${string}`
  );

  const { decryptRecords, isDecrypting, decryptedRecords, revealed } = useDecryptPatientRecords(
    selectedPatient as `0x${string}`,
    doctorAddress as `0x${string}`
  );

  const handleCheckPatient = () => {
    if (!isAddress(patientAddress)) {
      alert("Please enter a valid patient address");
      return;
    }
    setSelectedPatient(patientAddress);
    refetchAuth();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access the doctor dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">View authorized patient records</p>
          <div className="text-sm text-gray-500 mt-2">
            Doctor: {doctorAddress?.slice(0, 6)}...{doctorAddress?.slice(-4)}
          </div>
        </div>

        {/* Patient Lookup */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Access Patient Records</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              placeholder="Enter patient address (0x...)"
              className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-green-200 font-mono text-sm"
            />
            <button
              onClick={handleCheckPatient}
              disabled={!patientAddress}
              className="w-full bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50"
            >
              Check Authorization
            </button>
          </div>
        </div>

        {/* Authorization Status & Records */}
        {selectedPatient && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {isAuthorized ? (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Authorized Access</h2>
                    <p className="text-gray-600">Patient: {selectedPatient.slice(0, 6)}...{selectedPatient.slice(-4)}</p>
                  </div>
                </div>

                {!revealed && (
                  <button
                    onClick={() => decryptRecords()}
                    disabled={isDecrypting}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 mb-6"
                  >
                    {isDecrypting ? "Decrypting..." : "Decrypt Patient Records"}
                  </button>
                )}

                {revealed && decryptedRecords && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Risk Score</div>
                      <div className="text-2xl font-bold">{decryptedRecords.riskScore}/100</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Pain Level</div>
                      <div className="text-2xl font-bold">{decryptedRecords.painLevel}/10</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Symptoms</div>
                      <div className="text-lg font-mono">{decryptedRecords.symptomsBitmask?.toString(2).padStart(8, '0')}</div>
                    </div>
                    {decryptedRecords.systolicBP && (
                      <>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">BP (Sys/Dia)</div>
                          <div className="text-2xl font-bold">{decryptedRecords.systolicBP}/{decryptedRecords.diastolicBP}</div>
                        </div>
                        <div className="bg-pink-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Heart Rate</div>
                          <div className="text-2xl font-bold">{decryptedRecords.heartRate} bpm</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Temp</div>
                          <div className="text-2xl font-bold">{(decryptedRecords.temperature / 10).toFixed(1)}°C</div>
                        </div>
                        <div className="bg-cyan-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">O₂ Sat</div>
                          <div className="text-2xl font-bold">{decryptedRecords.oxygenSaturation}%</div>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">ESI Level</div>
                          <div className="text-2xl font-bold">Level {decryptedRecords.esiLevel}</div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">
                  Patient has not authorized you to view their records.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
