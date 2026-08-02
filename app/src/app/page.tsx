"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function HomePage() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">APU Medical AI</h1>
            {authenticated ? (
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={login}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {authenticated ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user?.email?.address}</h2>
            <p className="text-gray-600">
              Your medical data is encrypted and stored securely across two blockchain networks
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Network Status</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Ethereum Sepolia</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">0G Network</span>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Encryption</div>
                <div className="text-sm mt-2">
                  FHE + AES-256-GCM
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  End-to-end encrypted
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Privacy-Preserving Medical AI
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Get AI-powered medical diagnosis with complete privacy using FHE encryption
            </p>
            <button
              onClick={login}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
            >
              Get Started
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
