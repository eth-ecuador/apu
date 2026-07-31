"use client";
import dynamic from "next/dynamic";

// Pattern from ghostlend (mainnet-s3 winner): Client-only rendering with ssr:false
// Ensures FHE SDK and wallet providers are fully initialized before rendering
const MedicalRecordsContent = dynamic(() => import("./_components/MedicalRecordsContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Loading Medical Records Platform...</div>
    </div>
  ),
});

export default function MedicalRecordsPage() {
  return <MedicalRecordsContent />;
}
