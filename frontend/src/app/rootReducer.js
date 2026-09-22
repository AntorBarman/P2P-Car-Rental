import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import vehicleReducer from '../features/vehicles/vehicleSlice';
import bookingReducer from '../features/bookings/bookingSlice';  // ✅ Add

const rootReducer = combineReducers({
  auth: authReducer,
  vehicles: vehicleReducer,
  bookings: bookingReducer,  // ✅ Add
});

export default rootReducer;