"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { EncryptionVisualizer } from "../components/EncryptionVisualizer";
import { ArchitectureShowcase } from "../components/ArchitectureShowcase";
import { Logo } from "../components/ui/Logo";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { Language, useTranslation } from "../lib/i18n";

export default function HomePage() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lang, setLang] = useState<Language>('es');

  const t = useTranslation(lang);

  useEffect(() => {
    // Check backend status
    fetch('https://apu-backend-7a8z.onrender.com/health')
      .then(res => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-apu-paper">
        <div className="relative z-10 text-center">
          <div className="loading-dots mb-4">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="text-sm font-mono text-apu-tenue">{t('status.checking')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-apu-paper">
      {/* Header - Clean and minimal */}
      <header className="relative z-10 border-b border-apu-borde backdrop-blur-sm bg-white/70">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo - Official brand */}
            <div className="flex items-center gap-3 fade-in">
              <Logo variant="black" width={140} height={47} />
            </div>

            <div className="flex items-center gap-4 fade-in-delay-1">
              {/* Language Toggle */}
              <LanguageToggle currentLang={lang} onLanguageChange={setLang} />

              {/* Backend Status - Subtle indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-apu-wash border border-apu-borde">
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-success' :
                  backendStatus === 'offline' ? 'bg-error' :
                  'bg-apu-tenue'
                } ${backendStatus === 'online' ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-mono text-apu-tenue">
                  {backendStatus === 'online' ? t('status.productionReady') :
                   backendStatus === 'offline' ? t('status.offline') : t('status.checking')}
                </span>
              </div>

              {authenticated ? (
                <button
                  onClick={logout}
                  className="px-5 py-2 bg-apu-wash hover:bg-apu-borde text-apu-ink rounded-lg transition-colors font-medium text-sm"
                >
                  {t('nav.logout')}
                </button>
              ) : (
                <button
                  onClick={login}
                  className="px-6 py-2 bg-brand-violet hover:bg-brand-pressed text-white rounded-lg transition-all font-medium shadow-md"
                >
                  {t('nav.connectWallet')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {authenticated ? (
          <div className="space-y-16">
            {/* Welcome Section - Clean */}
            <div className="fade-in">
              <h2 className="text-4xl font-bold text-apu-ink mb-2">
                {t('welcome.title')}
              </h2>
              <p className="text-apu-tenue font-mono text-sm">
                {user?.wallet?.address ?
                  `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` :
                  user?.email?.address || 'Usuario'}
              </p>
            </div>

            {/* Security Metrics - Professional stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 fade-in-delay-1">
              <div className="p-6 rounded-xl bg-white border border-apu-borde hover:shadow-lg transition-shadow">
                <div className="text-xs font-mono text-apu-tenue uppercase tracking-wider mb-2">{t('metrics.encryption')}</div>
                <div className="text-3xl font-bold text-brand-violet mb-1">{t('metrics.encryptionValue')}</div>
                <p className="text-xs text-apu-tenue">{t('metrics.encryptionDesc')}</p>
              </div>

              <div className="p-6 rounded-xl bg-white border border-apu-borde hover:shadow-lg transition-shadow">
                <div className="text-xs font-mono text-apu-tenue uppercase tracking-wider mb-2">{t('metrics.tee')}</div>
                <div className="text-3xl font-bold text-success mb-1">{t('metrics.teeValue')}</div>
                <p className="text-xs text-apu-tenue">{t('metrics.teeDesc')}</p>
              </div>

              <div className="p-6 rounded-xl bg-white border border-apu-borde hover:shadow-lg transition-shadow">
                <div className="text-xs font-mono text-apu-tenue uppercase tracking-wider mb-2">{t('metrics.uptime')}</div>
                <div className="text-3xl font-bold text-brand-violet mb-1">{t('metrics.uptimeValue')}</div>
                <p className="text-xs text-apu-tenue">{t('metrics.uptimeDesc')}</p>
              </div>

              <div className="p-6 rounded-xl bg-white border border-apu-borde hover:shadow-lg transition-shadow">
                <div className="text-xs font-mono text-apu-tenue uppercase tracking-wider mb-2">{t('metrics.network')}</div>
                <div className="text-3xl font-bold text-warning mb-1">{t('metrics.networkValue')}</div>
                <p className="text-xs text-apu-tenue">{t('metrics.networkDesc')}</p>
              </div>
            </div>

            {/* Portal Selection - Clean cards with hover effects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in-delay-2">
              <a
                href="/patient"
                className="group relative p-8 rounded-xl bg-white border border-apu-borde hover:border-brand-violet hover:shadow-xl transition-all"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center mb-6 group-hover:bg-brand-violet/20 transition-colors">
                    <svg className="w-6 h-6 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-apu-ink mb-3">{t('portal.patient.title')}</h3>
                  <p className="text-apu-tenue leading-relaxed mb-6">
                    {t('portal.patient.desc')}
                  </p>
                  <div className="flex items-center gap-2 text-brand-violet font-medium text-sm group-hover:translate-x-2 transition-transform">
                    <span>{t('portal.patient.cta')}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>

              <a
                href="/doctor"
                className="group relative p-8 rounded-xl bg-white border border-apu-borde hover:border-brand-violet hover:shadow-xl transition-all"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center mb-6 group-hover:bg-success/20 transition-colors">
                    <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-apu-ink mb-3">{t('portal.doctor.title')}</h3>
                  <p className="text-apu-tenue leading-relaxed mb-6">
                    {t('portal.doctor.desc')}
                  </p>
                  <div className="flex items-center gap-2 text-success font-medium text-sm group-hover:translate-x-2 transition-transform">
                    <span>{t('portal.doctor.cta')}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Hero Section - Professional pitch */}
            <div className="text-center max-w-5xl mx-auto fade-in">
              <div className="inline-block mb-8">
                <Logo variant="black" width={160} height={53} className="mx-auto" />
              </div>

              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-apu-ink mb-6 leading-tight">
                {t('hero.title')}<br />
                <span className="text-brand-violet">
                  {t('hero.titleHighlight')}
                </span>
              </h2>

              <p className="text-xl md:text-2xl text-apu-tenue mb-6 leading-relaxed max-w-3xl mx-auto">
                {t('hero.subtitle')}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <div className="px-4 py-2 rounded-full bg-brand-violet/10 border border-brand-violet/30 text-brand-violet text-sm font-medium">
                  Zama FHE Protocol
                </div>
                <div className="px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success text-sm font-medium">
                  0G Compute TEE
                </div>
                <div className="px-4 py-2 rounded-full bg-brand-violet/10 border border-brand-violet/30 text-brand-violet text-sm font-medium">
                  0G Distributed Storage
                </div>
              </div>

              <button
                onClick={login}
                className="bg-brand-violet hover:bg-brand-pressed text-white text-lg px-12 py-4 rounded-lg font-semibold hover:scale-105 transform transition-all shadow-xl shadow-brand-violet/30 mb-6"
              >
                {t('hero.cta')}
              </button>

              <p className="text-sm text-apu-tenue font-mono">
                Zama FHE • 0G Compute TEE • 0G Storage
              </p>
            </div>

            {/* Live Encryption Demo - Signature element */}
            <div className="fade-in-delay-1">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-apu-ink mb-2">
                  {t('demo.title')}
                </h3>
                <p className="text-apu-tenue">
                  {t('demo.subtitle')}
                </p>
              </div>
              <EncryptionVisualizer />
            </div>

            {/* Architecture Showcase */}
            <div className="fade-in-delay-2">
              <ArchitectureShowcase />
            </div>

            {/* Value Proposition - Why it matters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto fade-in-delay-3">
              <div className="text-center p-8 bg-white rounded-xl border border-apu-borde hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-apu-ink mb-3">{t('value.zkMedical.title')}</h4>
                <p className="text-apu-tenue leading-relaxed">
                  {t('value.zkMedical.desc')}
                </p>
              </div>

              <div className="text-center p-8 bg-white rounded-xl border border-apu-borde hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-success/10 border border-success/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-apu-ink mb-3">{t('value.verified.title')}</h4>
                <p className="text-apu-tenue leading-relaxed">
                  {t('value.verified.desc')}
                </p>
              </div>

              <div className="text-center p-8 bg-white rounded-xl border border-apu-borde hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-violet/10 border border-brand-violet/30 flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-apu-ink mb-3">{t('value.storage.title')}</h4>
                <p className="text-apu-tenue leading-relaxed">
                  {t('value.storage.desc')}
                </p>
              </div>
            </div>

            {/* Impact Statement */}
            <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-brand-violet/5 to-brand-violet/10 border border-brand-violet/20 fade-in-delay-3">
              <h3 className="text-3xl font-bold text-apu-ink mb-4">
                {t('impact.title')}
              </h3>
              <p className="text-lg text-apu-tenue mb-6 leading-relaxed">
                {t('impact.subtitle')}
              </p>
              <div className="flex items-center justify-center gap-6 text-sm font-mono text-apu-tenue">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>{t('status.productionReady')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-violet animate-pulse" />
                  <span>{t('status.fullyEncrypted')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>{t('status.teeVerified')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="relative z-10 border-t border-apu-borde mt-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="mb-4">
                <Logo variant="black" width={100} height={33} />
              </div>
              <p className="text-sm text-apu-tenue">
                {t('footer.tagline')}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-apu-ink mb-3">{t('footer.tech')}</h4>
              <ul className="space-y-2 text-sm text-apu-tenue">
                <li><a href="https://www.zama.ai" target="_blank" rel="noopener" className="hover:text-brand-violet transition-colors">Zama FHE</a></li>
                <li><a href="https://0g.ai" target="_blank" rel="noopener" className="hover:text-brand-violet transition-colors">0G Labs</a></li>
                <li><a href="https://sepolia.etherscan.io" target="_blank" rel="noopener" className="hover:text-brand-violet transition-colors">Ethereum Sepolia</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-apu-ink mb-3">{t('footer.status')}</h4>
              <ul className="space-y-2 text-sm text-apu-tenue">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>{t('status.productionReady')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-violet animate-pulse" />
                  <span>{t('status.fullyEncrypted')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-apu-borde flex items-center justify-between text-sm text-apu-tenue">
            <p className="font-mono">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
