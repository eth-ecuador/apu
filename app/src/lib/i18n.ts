/**
 * Internationalization (i18n) utilities for APU
 * Supports English and Spanish
 */

export type Language = 'en' | 'es';

export const translations = {
  en: {
    // Navigation
    'nav.patientPortal': 'Patient Portal',
    'nav.doctorPortal': 'Doctor Portal',
    'nav.connectWallet': 'Connect Wallet',
    'nav.logout': 'Sign Out',

    // Status
    'status.productionReady': 'Production Ready',
    'status.offline': 'Offline',
    'status.checking': 'Checking...',
    'status.fullyEncrypted': 'Fully Encrypted',
    'status.teeVerified': 'TEE Verified',

    // Hero
    'hero.title': 'Medical AI Diagnosis',
    'hero.titleHighlight': 'Absolute Privacy',
    'hero.subtitle': 'First medical diagnosis platform with fully homomorphic encryption and verifiable execution',
    'hero.cta': 'Connect Wallet to Begin',

    // Welcome
    'welcome.title': 'Welcome back',

    // Metrics
    'metrics.encryption': 'Encryption',
    'metrics.encryptionValue': '256-bit',
    'metrics.encryptionDesc': 'FHE + AES',
    'metrics.tee': 'TEE Status',
    'metrics.teeValue': 'Verified',
    'metrics.teeDesc': '0G Compute',
    'metrics.uptime': 'Uptime',
    'metrics.uptimeValue': '99.9%',
    'metrics.uptimeDesc': 'Last 30 days',
    'metrics.network': 'Network',
    'metrics.networkValue': 'Active',
    'metrics.networkDesc': 'Sepolia + 0G',

    // Portals
    'portal.patient.title': 'Patient Portal',
    'portal.patient.desc': 'Send encrypted medical data and receive AI diagnosis with total privacy preservation',
    'portal.patient.cta': 'Enter portal',
    'portal.doctor.title': 'Doctor Portal',
    'portal.doctor.desc': 'Review diagnoses, access encrypted medical data and store verified diagnoses',
    'portal.doctor.cta': 'Enter portal',

    // Demo
    'demo.title': 'Live Demo',
    'demo.subtitle': 'See how homomorphic encryption works in real-time',

    // Value Props
    'value.zkMedical.title': 'Zero Knowledge Medical AI',
    'value.zkMedical.desc': 'Medical data never exposed. AI performs diagnoses on encrypted data using Zama FHE.',
    'value.verified.title': 'Verified Execution',
    'value.verified.desc': 'All AI inference runs in 0G Compute TEE with cryptographic attestation verifiable on-chain.',
    'value.storage.title': 'Decentralized Storage',
    'value.storage.desc': 'Medical records stored encrypted in 0G Storage with high availability and redundancy.',

    // Impact
    'impact.title': 'Production-Grade Medical AI',
    'impact.subtitle': 'Medical diagnosis system combining Zama\'s fully homomorphic encryption with 0G Labs\' decentralized infrastructure, ensuring absolute patient privacy at every stage.',

    // Footer
    'footer.tagline': 'Medical AI diagnosis preserving absolute privacy',
    'footer.tech': 'Technology',
    'footer.status': 'Status',
    'footer.copyright': '© 2026 APU Medical. Built with Zama × 0G Labs',
  },
  es: {
    // Navigation
    'nav.patientPortal': 'Portal de Pacientes',
    'nav.doctorPortal': 'Portal de Médicos',
    'nav.connectWallet': 'Conectar Wallet',
    'nav.logout': 'Cerrar sesión',

    // Status
    'status.productionReady': 'Production Ready',
    'status.offline': 'Sin conexión',
    'status.checking': 'Verificando...',
    'status.fullyEncrypted': 'Fully Encrypted',
    'status.teeVerified': 'TEE Verified',

    // Hero
    'hero.title': 'Diagnóstico Médico con IA',
    'hero.titleHighlight': 'Privacidad Absoluta',
    'hero.subtitle': 'Primera plataforma de diagnóstico médico con encriptación homomórfica completa y ejecución verificable',
    'hero.cta': 'Conectar Wallet para Comenzar',

    // Welcome
    'welcome.title': 'Bienvenido de vuelta',

    // Metrics
    'metrics.encryption': 'Encriptación',
    'metrics.encryptionValue': '256-bit',
    'metrics.encryptionDesc': 'FHE + AES',
    'metrics.tee': 'TEE Status',
    'metrics.teeValue': 'Verified',
    'metrics.teeDesc': '0G Compute',
    'metrics.uptime': 'Uptime',
    'metrics.uptimeValue': '99.9%',
    'metrics.uptimeDesc': 'Últimos 30 días',
    'metrics.network': 'Network',
    'metrics.networkValue': 'Active',
    'metrics.networkDesc': 'Sepolia + 0G',

    // Portals
    'portal.patient.title': 'Portal de Pacientes',
    'portal.patient.desc': 'Envía datos médicos encriptados y recibe diagnóstico con IA preservando privacidad total',
    'portal.patient.cta': 'Ingresar al portal',
    'portal.doctor.title': 'Portal de Médicos',
    'portal.doctor.desc': 'Revisa diagnósticos, accede a datos médicos encriptados y almacena diagnósticos verificados',
    'portal.doctor.cta': 'Ingresar al portal',

    // Demo
    'demo.title': 'Demostración en Vivo',
    'demo.subtitle': 'Visualiza cómo funciona la encriptación homomórfica en tiempo real',

    // Value Props
    'value.zkMedical.title': 'Zero Knowledge Medical AI',
    'value.zkMedical.desc': 'Los datos médicos nunca se exponen. La IA realiza diagnósticos sobre datos encriptados usando FHE de Zama.',
    'value.verified.title': 'Verified Execution',
    'value.verified.desc': 'Toda inferencia de IA corre en 0G Compute TEE con attestation criptográfica verificable on-chain.',
    'value.storage.title': 'Decentralized Storage',
    'value.storage.desc': 'Registros médicos almacenados encriptados en 0G Storage con alta disponibilidad y redundancia.',

    // Impact
    'impact.title': 'IA Médica de Producción',
    'impact.subtitle': 'Sistema de diagnóstico médico que combina encriptación homomórfica completa de Zama con la infraestructura descentralizada de 0G Labs, garantizando privacidad absoluta del paciente en cada etapa.',

    // Footer
    'footer.tagline': 'Diagnóstico médico con IA preservando privacidad absoluta',
    'footer.tech': 'Tecnología',
    'footer.status': 'Estado',
    'footer.copyright': '© 2026 APU Medical. Built with Zama × 0G Labs',
  }
} as const;

export function useTranslation(lang: Language) {
  return (key: keyof typeof translations.en): string => {
    return translations[lang][key];
  };
}
