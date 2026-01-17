// Environment configuration for production build
// This file is processed during Vercel build
window.PRODUCTION_API_URL = process.env.PRODUCTION_API_URL || 'https://motor-bersih-production.up.railway.app/api/';

console.log('🔧 Production API URL:', window.PRODUCTION_API_URL);
