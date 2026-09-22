import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import vehicleService from '../../services/vehicleService';

const initialState = {
  vehicles: [],
  currentVehicle: null,
  myVehicles: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicles');
    }
  }
);

export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vehicle');
    }
  }
);

export const fetchMyVehicles = createAsyncThunk(
  'vehicles/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getMyVehicles();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your vehicles');
    }
  }
);

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentVehicle: (state) => {
      state.currentVehicle = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vehicles = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchVehicleById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVehicle = action.payload;
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyVehicles.fulfilled, (state, action) => {
        state.myVehicles = action.payload;
      });
  },
});

export const { clearError, clearCurrentVehicle } = vehicleSlice.actions;
export default vehicleSlice.reducer;