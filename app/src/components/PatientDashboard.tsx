"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

interface PatientData {
  symptoms: string;
  medicalHistory: string;
  riskScore: number;
}

export function PatientDashboard() {
  const { user } = usePrivy();
  const [formData, setFormData] = useState<PatientData>({
    symptoms: "",
    medicalHistory: "",
    riskScore: 50
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { encryptNumber } = await import("../lib/fhe");

      const { encrypted, proof } = await encryptNumber(formData.riskScore);

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientAddress: user?.wallet?.address,
          encryptedRiskScore: Buffer.from(encrypted).toString("hex"),
          proof: Buffer.from(proof).toString("hex"),
          symptoms: formData.symptoms,
          medicalHistory: { history: formData.medicalHistory }
        })
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">Data Submitted Successfully</h3>
        <p className="text-gray-600 mb-6">
          Your encrypted medical data has been stored on Sepolia and 0G Network.
          You'll be notified when diagnosis is ready.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold">Submit Medical Data</h2>
        <p className="text-gray-600 mt-1">
          Your data will be encrypted with FHE and stored securely
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symptoms
          </label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Describe your symptoms..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical History
          </label>
          <textarea
            value={formData.medicalHistory}
            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Previous conditions, medications..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Score: {formData.riskScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.riskScore}
            onChange={(e) => setFormData({ ...formData, riskScore: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-medium">Privacy Guaranteed</p>
              <p className="text-blue-700 mt-1">
                • Risk score encrypted with FHE (Zama)<br/>
                • Medical history encrypted with AES-256-GCM<br/>
                • AI diagnosis runs in TEE (0G Compute)
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Data"}
        </button>
      </form>
    </div>
  );
}
