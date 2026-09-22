import api from './api';

const vehicleService = {
  // Get all vehicles with filters (public)
  getAll: async (params = {}) => {
    const response = await api.get('/vehicles', { params });
    return response.data;
  },
  
  // Get single vehicle details (public)
  getById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },
  
  // Get my vehicles (owner only)
  getMyVehicles: async () => {
    const response = await api.get('/vehicles/my');
    return response.data;
  },
  
  // Create vehicle (owner only)
  createVehicle: async (data) => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },
  
  // Update vehicle (owner only)
  updateVehicle: async (id, data) => {
    const response = await api.patch(`/vehicles/${id}`, data);
    return response.data;
  },
  
  // Delete vehicle (owner only)
  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
  
  // Upload images for vehicle (owner only)
  uploadImages: async (id, formData) => {
    const response = await api.post(`/vehicles/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  // Delete image (owner only)
  deleteImage: async (vehicleId, imageId) => {
    const response = await api.delete(`/vehicles/${vehicleId}/images/${imageId}`);
    return response.data;
  },
  
  // Search vehicles with filters (public)
  searchVehicles: async (filters = {}) => {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
    };
    
    if (filters.brand) params.brand = filters.brand;
    if (filters.vehicle_type) params.vehicle_type = filters.vehicle_type;
    if (filters.transmission) params.transmission = filters.transmission;
    if (filters.fuel_type) params.fuel_type = filters.fuel_type;
    if (filters.seats) params.seats = filters.seats;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.branch_id) params.branch_id = filters.branch_id;
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;
    
    const response = await api.get('/vehicles', { params });
    return response.data;
  },
};

export default vehicleService;