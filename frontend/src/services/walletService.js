import api from './api';

const walletService = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },
  
  getTransactions: async (params = {}) => {
    const response = await api.get('/wallet/transactions', { params });
    return response.data;
  },
};

export default walletService;