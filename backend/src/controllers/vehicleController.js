const vehicleService = require('../services/vehicleService');
const vehicleRepository = require('../repositories/vehicleRepository'); // ✅ ADD THIS LINE
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createVehicle = asyncHandler(async (req, res) => {
  console.log('🔍 Creating vehicle with data:', req.body);
  console.log('🔍 User ID:', req.user.id);
  
  const vehicle = await vehicleService.createVehicle(req.body, req.user.id);
  
  res.status(201).json(
    ApiResponse.created('Vehicle created successfully', vehicle)
  );
});

const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(req.params.id);
  
  res.status(200).json(
    ApiResponse.ok('Vehicle retrieved successfully', vehicle)
  );
});

const getMyVehicles = asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.getMyVehicles(req.user.id);
  
  res.status(200).json(
    ApiResponse.ok('Vehicles retrieved successfully', vehicles)
  );
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body, req.user.id);
  
  res.status(200).json(
    ApiResponse.ok('Vehicle updated successfully', vehicle)
  );
});

const deleteVehicle = asyncHandler(async (req, res) => {
  await vehicleService.deleteVehicle(req.params.id, req.user.id);
  
  res.status(200).json(
    ApiResponse.ok('Vehicle deleted successfully')
  );
});

const uploadImages = asyncHandler(async (req, res) => {
  const images = await vehicleService.uploadImages(
    req.params.id,
    req.files,
    req.user.id
  );
  
  res.status(201).json(
    ApiResponse.created('Images uploaded successfully', images)
  );
});

// ✅ FIXED: searchVehicles - uses vehicleRepository
const searchVehicles = asyncHandler(async (req, res) => {
  const { 
    branch_id, vehicle_type, transmission, fuel_type,
    min_price, max_price, brand, seats,
    pickup_date, return_date,
    sort_by, sort_order,
    page = 1, limit = 9 
  } = req.query;

  const result = await vehicleRepository.search({
    branch_id,
    vehicle_type,
    transmission,
    fuel_type,
    min_price,
    max_price,
    brand,
    seats,
    pickup_date,
    return_date,
    sort_by: sort_by || 'created_at',
    sort_order: sort_order || 'desc',
    page,
    limit
  });

  res.status(200).json(
    ApiResponse.ok('Vehicles retrieved successfully', result.vehicles, result.pagination)
  );
});

module.exports = {
  createVehicle,
  getVehicleById,
  getMyVehicles,
  updateVehicle,
  deleteVehicle,
  uploadImages,
  searchVehicles,
};