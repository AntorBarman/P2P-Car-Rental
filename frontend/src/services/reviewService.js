// frontend/src/services/reviewService.js

import api from './api';

const reviewService = {
  createReview: async (data) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
  
  getVehicleReviews: async (vehicleId, page = 1, limit = 10) => {
    const response = await api.get(`/reviews/vehicle/${vehicleId}?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getVehicleRating: async (vehicleId) => {
    const response = await api.get(`/reviews/vehicle/${vehicleId}/rating`);
    return response.data;
  },
  
  getOwnerReviews: async (page = 1, limit = 20) => {
    const response = await api.get(`/reviews/owner?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  // ✅ NEW: Get recent reviews for home page
  getRecentReviews: async (limit = 3) => {
    const response = await api.get(`/reviews/recent?limit=${limit}`);
    return response.data;
  },
  
  updateReview: async (reviewId, data) => {
    const response = await api.put(`/reviews/${reviewId}`, data);
    return response.data;
  },
  
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
  
  checkCanReview: async (bookingId) => {
    const response = await api.get(`/reviews/check/${bookingId}`);
    return response.data;
  }
};

export default reviewService;