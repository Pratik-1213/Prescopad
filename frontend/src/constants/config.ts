export const APP_CONFIG = {
  name: 'PrescoPad',
  tagline: 'Digital Clinic for Modern Doctors',
  version: '2.0.0',

  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 10000,
  },

  wallet: {
    costPerPrescription: 1,
    defaultRechargeAmount: 100,
    lowBalanceThreshold: 10,
    currency: 'INR',
    currencySymbol: '\u20B9',
  },

  sync: {
    port: 8765,
    pingInterval: 5000,
    reconnectDelay: 3000,
    maxReconnectAttempts: 5,
  },

  prescription: {
    maxMedicines: 20,
    maxLabTests: 15,
    pdfWidth: 595,
    pdfHeight: 842,
  },

  otp: {
    length: 6,
    expiryMinutes: 5,
    demoPhone: '9876543210',
    demoOtp: '123456',
  },
} as const;
