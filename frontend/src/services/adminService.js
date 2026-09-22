import api from './api';

const adminService = {
  // Get admin stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  // Get all vehicles
  getAllVehicles: async () => {
    const response = await api.get('/admin/vehicles');
    return response.data;
  },
  
  // Get pending vehicles
  getPendingVehicles: async () => {
    const response = await api.get('/admin/vehicles/pending');
    return response.data;
  },
  
  // Approve vehicle
  approveVehicle: async (id) => {
    const response = await api.patch(`/admin/vehicles/${id}/approve`);
    return response.data;
  },
  
  // Reject vehicle
  rejectVehicle: async (id, reason) => {
    const response = await api.patch(`/admin/vehicles/${id}/reject`, { reason });
    return response.data;
  },
  
  // Suspend vehicle
  suspendVehicle: async (id) => {
    const response = await api.patch(`/admin/vehicles/${id}/suspend`);
    return response.data;
  },
};

export default adminService;