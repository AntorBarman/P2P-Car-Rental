const vehicleRepository = require('../repositories/vehicleRepository');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');

class VehicleService {
  async createVehicle(vehicleData, ownerId) {
    // ✅ FIXED: Check ALL 5 identity documents
    const requiredDocs = [
      'nid_front',
      'nid_back', 
      'driving_license_front',
      'driving_license_back',
      'face_photo'
    ];
    
    const kycResult = await db.query(
      `SELECT 
        COUNT(DISTINCT document_type) FILTER (WHERE status = 'approved' AND is_active = true) as approved_count,
        COUNT(DISTINCT document_type) as total_required
       FROM documents 
       WHERE user_id = $1 
       AND document_type = ANY($2::text[])
       AND is_active = true`,
      [ownerId, requiredDocs]
    );
    
    const approvedCount = parseInt(kycResult.rows[0].approved_count);
    const totalRequired = parseInt(kycResult.rows[0].total_required);
    
    console.log('🔍 Owner KYC Check:', { approvedCount, totalRequired, requiredDocs });
    
    // ALL 5 identity documents must be uploaded
    if (totalRequired < 5) {
      throw ApiError.forbidden(
        `KYC incomplete. Please upload all identity documents. (${totalRequired}/5 uploaded)`
      );
    }
    
    // ALL 5 must be approved
    if (approvedCount < 5) {
      const missingDocs = requiredDocs.filter(doc => {
        // Check which docs are not approved
        return true; // Simplified
      });
      throw ApiError.forbidden(
        `KYC verification incomplete. ${approvedCount}/5 documents verified. ` +
        `All identity documents must be approved before listing vehicles.`
      );
    }
    
    // Business validation
    if (vehicleData.daily_rate < 500) {
      throw ApiError.badRequest('Daily rate must be at least ৳500');
    }
    
    if (vehicleData.deposit_amount < vehicleData.daily_rate * 2) {
      throw ApiError.badRequest('Deposit amount must be at least 2x daily rate');
    }
    
    // ✅ FIXED: Use owner_id not ownerId
    const vehicle = await vehicleRepository.create({
      ...vehicleData,
      owner_id: ownerId,
      status: 'pending',
    });
    
    return vehicle;
  }
  
  async getVehicleById(id) {
    const vehicle = await vehicleRepository.findById(id);
    
    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }
    
    const images = await vehicleRepository.getImages(id);
    vehicle.images = images;
    
    return vehicle;
  }
  
  async getMyVehicles(ownerId) {
    return vehicleRepository.findByOwnerId(ownerId);
  }
  
  async updateVehicle(id, vehicleData, ownerId) {
    const vehicle = await vehicleRepository.findById(id);
    
    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }
    
    if (vehicle.owner_id !== ownerId) {
      throw ApiError.forbidden('You can only update your own vehicles');
    }
    
    return vehicleRepository.update(id, vehicleData);
  }
  
  async deleteVehicle(id, ownerId) {
    const vehicle = await vehicleRepository.findById(id);
    
    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }
    
    if (vehicle.owner_id !== ownerId) {
      throw ApiError.forbidden('You can only delete your own vehicles');
    }
    
    const hasBookings = await vehicleRepository.hasActiveBookings(id);
    if (hasBookings) {
      throw ApiError.conflict('Cannot delete vehicle with active bookings');
    }
    
    await vehicleRepository.softDelete(id);
    return true;
  }
  
  async uploadImages(vehicleId, files, ownerId) {
    const vehicle = await vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      throw ApiError.notFound('Vehicle not found');
    }
    
    if (vehicle.owner_id !== ownerId) {
      throw ApiError.forbidden('You can only upload images for your own vehicles');
    }
    
    const uploadedImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const image = await vehicleRepository.addImage(
        vehicleId,
        file.path || file.filename,
        file.filename || file.public_id,
        i === 0,
        i
      );
      
      uploadedImages.push(image);
    }
    
    return uploadedImages;
  }
  
  async searchVehicles(filters) {
    return vehicleRepository.search(filters);
  }
}

module.exports = new VehicleService();