// frontend/src/services/bookingService.js

import api from './api';

const bookingService = {
  // Create booking
  create: async (data) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },
  
  // Get my bookings (customer)
  getMyBookings: async (params = {}) => {
    const response = await api.get('/bookings/my', { params });
    return response.data;
  },
  
  // Get booking by ID - with validation
  getById: async (id) => {
    // ✅ Validate ID before making API call
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ Invalid booking ID:', id);
      throw new Error('Invalid booking ID');
    }
    
    console.log('🔍 Fetching booking:', id);
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  
  // Cancel booking
  cancel: async (id, reason = '') => {
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ Invalid booking ID:', id);
      throw new Error('Invalid booking ID');
    }
    
    const response = await api.post(`/bookings/${id}/cancel`, {
      cancel_reason: reason,
    });
    return response.data;
  },
  
  // Get owner bookings
  getOwnerBookings: async () => {
    const response = await api.get('/bookings/owner/all');
    return response.data;
  },
};

export default bookingService;