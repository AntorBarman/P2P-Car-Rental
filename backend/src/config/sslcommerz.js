const SSLCommerz = require('sslcommerz-lts');
require('dotenv').config();

const createSSLCommerzInstance = () => {
  const store_id = process.env.SSLC_STORE_ID;
  const store_passwd = process.env.SSLC_STORE_PASSWORD;
  const is_live = process.env.SSLC_SANDBOX === 'false';
  
  console.log('🔑 SSLCommerz Config:', {
    store_id: store_id ? '✅ Set' : '❌ Missing',
    store_passwd: store_passwd ? '✅ Set' : '❌ Missing',
    is_live,
  });

  if (!store_id || !store_passwd) {
    throw new Error('SSLCommerz credentials missing in .env file');
  }

  // ✅ সঠিকভাবে instance তৈরি করুন
  return new SSLCommerz(store_id, store_passwd, is_live);
};

module.exports = {
  createSSLCommerzInstance,
};