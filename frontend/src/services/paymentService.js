import api from './api';

const paymentService = {
  // ✅ Initiate payment — sends bookingId
  initiate: async (bookingId) => {
    console.log('🔍 Payment service initiate:', { bookingId });
    
    // ✅ Make sure we're sending the right field name
    const response = await api.post('/payments/initiate', {
      bookingId: bookingId,  // ✅ Send as bookingId
    });
    return response.data;
  },
  
  // Get payment status
  getStatus: async (bookingId) => {
    const response = await api.get(`/payments/status/${bookingId}`);
    return response.data;
  },
  
  // Get my payments
  getMyPayments: async () => {
    const response = await api.get('/payments/my');
    return response.data;
  },
};

export default paymentService;