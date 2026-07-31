"use client";

import { useAccount } from "wagmi";
import { useHasSubmittedV2, useIsDoctorAuthorized } from "@/lib/hooks";
import { useAuthorizeDoctor, useRevokeDoctor } from "@/app/hooks/useMedicalData";
import { useState } from "react";
import { isAddress } from "viem";

export default function ManageAccessPage() {
  const { address, isConnected } = useAccount();
  const hasSubmitted = useHasSubmittedV2(address);

  const [doctorAddress, setDoctorAddress] = useState("");
  const [authorizedDoctors, setAuthorizedDoctors] = useState<string[]>([]);
  const [checkingDoctor, setCheckingDoctor] = useState("");

  const { authorizeDoctor, isPending: isAuthorizing } = useAuthorizeDoctor();
  const { revokeDoctor, isPending: isRevoking } = useRevokeDoctor();

  const { isAuthorized: isDoctorAuthorizedCheck } = useIsDoctorAuthorized(
    address as `0x${string}`,
    checkingDoctor as `0x${string}`
  );

  const handleAuthorizeDoctor = async () => {
    if (!isAddress(doctorAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }

    try {
      await authorizeDoctor(doctorAddress as `0x${string}`);
      setAuthorizedDoctors([...authorizedDoctors, doctorAddress]);
      setDoctorAddress("");
      alert("Doctor authorized successfully!");
    } catch (error: any) {
      console.error("Authorization error:", error);
      alert(`Error: ${error.message || "Failed to authorize doctor"}`);
    }
  };

  const handleRevokeDoctor = async (doctor: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${doctor}?`)) {
      return;
    }

    try {
      await revokeDoctor(doctor as `0x${string}`);
      setAuthorizedDoctors(authorizedDoctors.filter((d) => d !== doctor));
      alert("Doctor access revoked successfully!");
    } catch (error: any) {
      console.error("Revocation error:", error);
      alert(`Error: ${error.message || "Failed to revoke access"}`);
    }
  };

  const handleCheckAuthorization = () => {
    if (!isAddress(doctorAddress)) {
      alert("Please enter a valid Ethereum address");
      return;
    }
    setCheckingDoctor(doctorAddress);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-purple-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Required</h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to manage doctor access
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-purple-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Records Found</h2>
            <p className="text-gray-600 mb-6">
              You need to submit medical records before managing doctor access.
            </p>
            <a
              href="/medical-records"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Submit Medical Records
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Access</h1>
              <p className="text-gray-600">
                Control who can view your encrypted medical records
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Patient: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
        </div>

        {/* Authorize New Doctor */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 md:p-8 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Authorize Healthcare Provider</h2>
          <p className="text-purple-100 mb-6">
            Enter the Ethereum address of a healthcare provider to grant them access to your encrypted medical records.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-2">
                Doctor's Ethereum Address
              </label>
              <input
                type="text"
                value={doctorAddress}
                onChange={(e) => setDoctorAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAuthorizeDoctor}
                disabled={isAuthorizing || !doctorAddress}
                className="flex-1 bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isAuthorizing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Authorize Doctor</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCheckAuthorization}
                disabled={!doctorAddress}
                className="bg-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Check Status</span>
              </button>
            </div>

            {checkingDoctor && (
              <div className={`p-4 rounded-lg ${isDoctorAuthorizedCheck ? 'bg-green-500 bg-opacity-20 border border-green-300' : 'bg-red-500 bg-opacity-20 border border-red-300'}`}>
                <div className="flex items-center space-x-2">
                  {isDoctorAuthorizedCheck ? (
                    <>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">This doctor is authorized</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">This doctor is NOT authorized</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-purple-700 bg-opacity-30 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-purple-100 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">How it works</h3>
                <p className="text-sm text-purple-100">
                  When you authorize a doctor, they will be able to retrieve and decrypt your medical records.
                  You can revoke access at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Authorized Doctors List */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Authorized Healthcare Providers</h2>
              <p className="text-gray-600 mt-1">Providers who currently have access to your records</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">{authorizedDoctors.length}</span>
            </div>
          </div>

          {authorizedDoctors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Authorized Providers</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You haven't authorized any healthcare providers yet. Use the form above to grant access to a doctor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {authorizedDoctors.map((doctor, index) => (
                <div
                  key={doctor}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-gray-900 font-medium">
                        {doctor.slice(0, 6)}...{doctor.slice(-4)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Healthcare Provider</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeDoctor(doctor)}
                    disabled={isRevoking}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
                  >
                    {isRevoking ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Revoking...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Revoke Access</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Your Privacy, Your Control</h3>
                <p className="text-sm text-blue-800">
                  You have complete control over your medical data. Revoking access is immediate and prevents the provider from viewing your records.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <a
              href="/my-records"
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>View My Records</span>
            </a>
            <a
              href="/doctor-dashboard"
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-2"
            >
              <span>Doctor Dashboard</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
