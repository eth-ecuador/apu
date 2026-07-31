"use client";
import dynamic from "next/dynamic";

// Pattern from ghostlend (mainnet-s3 winner): Client-only rendering with ssr:false
// Ensures FHE SDK and wallet providers are fully initialized before rendering
const HealthAggregateContent = dynamic(() => import("./_components/HealthAggregateContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">Loading APU Health Platform...</div>
    </div>
  ),
});

export default function HealthAggregatePage() {
  return <HealthAggregateContent />;
}
