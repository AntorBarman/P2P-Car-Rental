import api from './api';

const branchService = {
  // Get active branches (public)
  getAll: async () => {
    const response = await api.get('/branches');
    return response.data;
  },
  
  // Get all branches (admin)
  getAllAdmin: async () => {
    const response = await api.get('/branches/admin/all');
    return response.data;
  },
  
  // Get single branch
  getById: async (id) => {
    const response = await api.get(`/branches/admin/${id}`);
    return response.data;
  },
  
  // Create branch
  create: async (data) => {
    const response = await api.post('/branches/admin', data);
    return response.data;
  },
  
  // Update branch
  update: async (id, data) => {
    const response = await api.patch(`/branches/admin/${id}`, data);
    return response.data;
  },
  
  // Suspend branch
  suspend: async (id, reason) => {
    const response = await api.patch(`/branches/admin/${id}/suspend`, { reason });
    return response.data;
  },
  
  // Activate branch
  activate: async (id) => {
    const response = await api.patch(`/branches/admin/${id}/activate`);
    return response.data;
  },
};

export default branchService;