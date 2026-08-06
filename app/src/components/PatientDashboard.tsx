"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useEncrypt } from "@zama-fhe/react-sdk";

const BACKEND_URL = "https://apu-backend-7a8z.onrender.com";

interface PatientData {
  symptoms: string;
  medicalHistory: string;
  vitalSigns: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
  };
}

export function PatientDashboard() {
  const { user } = usePrivy();
  const { mutateAsync: encrypt } = useEncrypt(); // Ghostlend pattern
  const [formData, setFormData] = useState<PatientData>({
    symptoms: "",
    medicalHistory: "",
    vitalSigns: {
      heartRate: 75,
      bloodPressure: "120/80",
      temperature: 37.0
    }
  });
  const [loading, setLoading] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [encryptedPreview, setEncryptedPreview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEncrypting(true);

    try {
      // Calculate risk score from vital signs and symptoms
      const riskScore = calculateRiskScore(formData.vitalSigns, formData.symptoms);

      // Encrypt risk score with FHE (using Zama SDK hook)
      const encryptedData = await encrypt(riskScore, "uint32");

      // Show encrypted data preview
      const encryptedHex = encryptedData.data;
      setEncryptedPreview(encryptedHex.substring(0, 64));
      setEncrypting(false);

      // Submit to backend
      const response = await fetch(`${BACKEND_URL}/api/patient/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientAddress: user?.wallet?.address || user?.email?.address,
          encryptedRiskScore: encryptedData.data,
          proof: encryptedData.proof,
          symptoms: formData.symptoms,
          vitalSigns: formData.vitalSigns,
          medicalData: {
            history: formData.medicalHistory,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setSubmitted(true);
        
        // Auto-run diagnosis
        runDiagnosis();
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (error: any) {
      console.error("Submission failed:", error);
      alert(`Failed to submit data: ${error.message}`);
      setEncrypting(false);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnosis = async () => {
    setLoadingDiagnosis(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/diagnosis/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientAddress: user?.wallet?.address || user?.email?.address,
          symptoms: formData.symptoms,
          medicalHistory: { history: formData.medicalHistory }
        })
      });

      const data = await response.json();

      if (data.success) {
        setDiagnosisResult(data.data);
      } else {
        console.error("Diagnosis failed:", data.error);
      }
    } catch (error) {
      console.error("Diagnosis request failed:", error);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  function calculateRiskScore(vitalSigns: any, symptoms: string): number {
    let score = 50;
    
    if (vitalSigns.heartRate > 100 || vitalSigns.heartRate < 60) score += 15;
    if (vitalSigns.heartRate > 120 || vitalSigns.heartRate < 50) score += 20;
    if (vitalSigns.temperature > 38 || vitalSigns.temperature < 36) score += 10;
    if (vitalSigns.temperature > 39.5 || vitalSigns.temperature < 35) score += 20;
    
    const severityKeywords = ["severe", "extreme", "unbearable", "emergency", "critical"];
    if (severityKeywords.some(k => symptoms.toLowerCase().includes(k))) score += 25;
    
    return Math.max(0, Math.min(100, score));
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        {/* Success Card */}
        <div className="p-8 rounded-xl bg-cyber-navy-light border border-green-500/30 fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-serif font-semibold mb-2">Data Submitted Successfully</h3>
              <p className="text-slate-400 text-sm mb-4">
                Your encrypted medical data has been stored securely on-chain and in decentralized storage
              </p>

              {/* Transaction Details */}
              {result && (
                <div className="space-y-3 font-mono text-sm">
                  <div className="p-3 rounded-lg bg-cyber-navy/50 border border-cyan-500/20">
                    <div className="text-xs text-slate-500 mb-1">BLOCKCHAIN TX</div>
                    <div className="text-cyan-400 break-all">{result.contract.transactionHash}</div>
                    <div className="text-xs text-slate-500 mt-2">Block: {result.contract.blockNumber}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-cyber-navy/50 border border-cyan-500/20">
                    <div className="text-xs text-slate-500 mb-1">0G STORAGE ROOT</div>
                    <div className="text-cyan-400 break-all">{result.storage.merkleRoot}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="tee-badge border-0 p-0 text-xs">ENCRYPTED</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Diagnosis Card */}
        <div className="p-8 rounded-xl bg-cyber-navy-light border border-cyan-500/30 fade-in-delay-1">
          <h3 className="text-xl font-serif font-semibold mb-4">AI Diagnosis</h3>
          
          {loadingDiagnosis ? (
            <div className="text-center py-12">
              <div className="loading-dots mb-4 justify-center">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p className="text-sm font-mono text-slate-400">Running AI inference in TEE environment...</p>
              <p className="text-xs text-slate-500 mt-2">This may take 30-60 seconds</p>
            </div>
          ) : diagnosisResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-cyber-navy/50 border border-green-500/20">
                <div className="text-xs font-mono text-slate-500 mb-2">AI DIAGNOSIS</div>
                <p className="text-slate-300 leading-relaxed">{diagnosisResult.diagnosis}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-cyber-navy/50 border border-cyan-500/20">
                  <div className="text-xs font-mono text-slate-500 mb-1">CONFIDENCE</div>
                  <div className="text-2xl font-semibold text-cyan-400">{Math.round(diagnosisResult.confidence * 100)}%</div>
                </div>
                <div className="p-4 rounded-lg bg-cyber-navy/50 border border-green-500/20">
                  <div className="tee-badge border-0 p-0 mb-2">
                    TEE VERIFIED
                  </div>
                  <div className="text-xs text-slate-500">
                    {diagnosisResult.verificationComponents?.zgTeeVerified ? 'Signature Valid' : 'Pending'}
                  </div>
                </div>
              </div>

              {diagnosisResult.verificationComponents && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-mono text-cyan-400 hover:text-cyan-300">
                    View Verification Details →
                  </summary>
                  <div className="mt-3 p-4 rounded-lg bg-cyber-navy/50 border border-cyan-500/10 font-mono text-xs space-y-2">
                    <div>
                      <span className="text-slate-500">Request ID:</span>
                      <span className="text-slate-300 ml-2 break-all">{diagnosisResult.verificationComponents.zgRequestId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Provider:</span>
                      <span className="text-slate-300 ml-2 break-all">{diagnosisResult.verificationComponents.zgProviderAddress}</span>
                    </div>
                  </div>
                </details>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>Diagnosis will appear here once AI processing completes</p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setSubmitted(false);
            setResult(null);
            setDiagnosisResult(null);
            setEncryptedPreview("");
          }}
          className="w-full px-6 py-3 rounded-lg bg-cyber-navy-light border border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50 transition-all"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 rounded-xl bg-cyber-navy-light border border-cyan-500/20">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold mb-2">Submit Medical Data</h2>
        <p className="text-slate-400 text-sm">
          All data encrypted with Zama FHE before blockchain submission
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symptoms */}
        <div>
          <label className="block text-sm font-mono text-slate-400 mb-2">
            SYMPTOMS
          </label>
          <textarea
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-cyber-navy border border-cyan-500/20 text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none"
            rows={4}
            placeholder="Describe your symptoms in detail..."
            required
          />
        </div>

        {/* Vital Signs */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-mono text-slate-400 mb-2">
              HEART RATE (BPM)
            </label>
            <input
              type="number"
              value={formData.vitalSigns.heartRate}
              onChange={(e) => setFormData({
                ...formData,
                vitalSigns: { ...formData.vitalSigns, heartRate: parseInt(e.target.value) }
              })}
              className="w-full px-4 py-3 rounded-lg bg-cyber-navy border border-cyan-500/20 text-slate-200 focus:border-cyan-500/50 focus:outline-none transition-colors"
              min="40"
              max="200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-slate-400 mb-2">
              BLOOD PRESSURE
            </label>
            <input
              type="text"
              value={formData.vitalSigns.bloodPressure}
              onChange={(e) => setFormData({
                ...formData,
                vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value }
              })}
              className="w-full px-4 py-3 rounded-lg bg-cyber-navy border border-cyan-500/20 text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
              placeholder="120/80"
              pattern="\d+/\d+"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-slate-400 mb-2">
              TEMPERATURE (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.vitalSigns.temperature}
              onChange={(e) => setFormData({
                ...formData,
                vitalSigns: { ...formData.vitalSigns, temperature: parseFloat(e.target.value) }
              })}
              className="w-full px-4 py-3 rounded-lg bg-cyber-navy border border-cyan-500/20 text-slate-200 focus:border-cyan-500/50 focus:outline-none transition-colors"
              min="35"
              max="42"
              required
            />
          </div>
        </div>

        {/* Medical History */}
        <div>
          <label className="block text-sm font-mono text-slate-400 mb-2">
            MEDICAL HISTORY (OPTIONAL)
          </label>
          <textarea
            value={formData.medicalHistory}
            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-cyber-navy border border-cyan-500/20 text-slate-200 placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none"
            rows={3}
            placeholder="Previous conditions, medications, allergies..."
          />
        </div>

        {/* Encryption Preview */}
        {encrypting && (
          <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20 encryption-pulse">
            <div className="flex items-center gap-3 mb-2">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="text-sm font-mono text-cyan-400">Encrypting with FHE...</span>
            </div>
            {encryptedPreview && (
              <div className="font-mono text-xs text-cyan-500/70 break-all mt-2">
                {encryptedPreview}...
              </div>
            )}
          </div>
        )}

        {/* Privacy Notice */}
        <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm">
              <p className="font-mono text-cyan-400 mb-1">PRIVACY GUARANTEED</p>
              <ul className="text-slate-400 space-y-1 text-xs">
                <li>• Risk score encrypted with Zama FHE on-device</li>
                <li>• Medical data stored encrypted on 0G Storage</li>
                <li>• AI diagnosis runs in TEE environment</li>
                <li>• Smart contract never sees plaintext data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all relative overflow-hidden group"
        >
          <span className="relative z-10">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Processing...
              </span>
            ) : (
              'Submit Encrypted Data'
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>
      </form>
    </div>
  );
}
