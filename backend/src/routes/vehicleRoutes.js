// backend/src/routes/vehicleRoutes.js (COMPLETE FIXED)

const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
// ✅ FIX: Destructure from upload object
const { uploadVehicleImages } = require('../middlewares/upload');
const {
  validateCreateVehicle,
  validateUpdateVehicle,
  validateSearchQuery,
} = require('../validators/vehicleValidator');
const db = require('../config/database');
const complianceService = require('../services/complianceService');
const ApiResponse = require('../utils/ApiResponse');

const router = express.Router();

// ============================================
// ✅ SPECIFIC ROUTES FIRST
// ============================================

// ✅ Check vehicle availability
router.get(
  '/check-availability',
  authMiddleware,
  async (req, res) => {
    const { vehicleId, pickupDate, returnDate } = req.query;

    console.log('🔍 Availability check:', { vehicleId, pickupDate, returnDate });

    if (!vehicleId || !pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID, pickup date, and return date are required'
      });
    }

    try {
      const result = await db.query(
        `SELECT COUNT(*) as count 
         FROM bookings 
         WHERE vehicle_id = $1 
         AND status IN ('pending_payment', 'confirmed', 'ongoing')
         AND (
           (pickup_date <= $2 AND return_date >= $2) OR
           (pickup_date <= $3 AND return_date >= $3) OR
           (pickup_date >= $2 AND return_date <= $3)
         )`,
        [vehicleId, pickupDate, returnDate]
      );

      const overlapCount = parseInt(result.rows[0].count);
      const available = overlapCount === 0;

      console.log(`✅ Vehicle ${vehicleId} - Available: ${available}, Overlaps: ${overlapCount}`);

      res.json({
        success: true,
        data: { available, vehicleId, pickupDate, returnDate, overlapCount }
      });

    } catch (error) {
      console.error('❌ Availability check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check availability'
      });
    }
  }
);

// ✅ Get documents for a specific vehicle (Owner View)
router.get(
  '/:id/documents',
  authMiddleware,
  async (req, res) => {
    const { id } = req.params;
    
    console.log('🔍 Fetching documents for vehicle:', id);
    
    try {
      const vehicleCheck = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1 AND is_deleted = FALSE',
        [id]
      );
      
      if (vehicleCheck.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Vehicle not found' 
        });
      }
      
      if (vehicleCheck.rows[0].owner_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not own this vehicle' 
        });
      }
      
      const result = await db.query(
        `SELECT * FROM documents 
         WHERE vehicle_id = $1 
         AND is_active = true
         ORDER BY created_at DESC`,
        [id]
      );
      
      console.log(`✅ Found ${result.rows.length} documents for vehicle ${id}`);
      
      res.json({
        success: true,
        data: result.rows
      });
      
    } catch (error) {
      console.error('❌ Error fetching vehicle documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle documents'
      });
    }
  }
);

// Owner: My vehicles
router.get(
  '/my',
  authMiddleware,
  requireRole('owner'),
  vehicleController.getMyVehicles
);

// ✅ Owner: Upload images - FIXED
router.post(
  '/:id/images',
  authMiddleware,
  requireRole('owner'),
  uploadVehicleImages.array('images', 5),
  vehicleController.uploadImages
);

// ✅ Check vehicle compliance
router.get(
  '/:id/compliance',
  authMiddleware,
  async (req, res) => {
    const { id } = req.params;
    
    try {
      const compliance = await complianceService.checkVehicleCompliance(id);
      
      res.json({
        success: true,
        data: compliance
      });
      
    } catch (error) {
      console.error('❌ Compliance check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check compliance'
      });
    }
  }
);

// ✅ Admin - Get compliance details
router.get(
  '/:id/compliance/details',
  authMiddleware,
  requireRole('admin', 'staff'),
  async (req, res) => {
    const { id } = req.params;
    
    try {
      const details = await complianceService.getComplianceDetails(id);
      
      res.json({
        success: true,
        data: details
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get compliance details'
      });
    }
  }
);

// ✅ Request document upload
router.post(
  '/:id/request-document',
  authMiddleware,
  requireRole('owner'),
  async (req, res) => {
    const { id } = req.params;
    const { documentType, message } = req.body;

    console.log('📤 Document request:', { vehicleId: id, documentType, message });

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
    }

    try {
      const vehicleResult = await db.query(
        `SELECT v.*, u.name as owner_name, u.email as owner_email 
         FROM vehicles v
         JOIN users u ON v.owner_id = u.id
         WHERE v.id = $1 AND v.owner_id = $2`,
        [id, req.user.id]
      );

      if (vehicleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found or you are not the owner'
        });
      }

      const vehicle = vehicleResult.rows[0];

      console.log('📧 Would send email to:', vehicle.owner_email);
      console.log('📧 Message:', message || `Please upload ${documentType} for ${vehicle.brand} ${vehicle.model}`);

      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, data, created_at)
         VALUES ($1, 'document_request', $2, $3, $4, NOW())`,
        [
          req.user.id,
          'Document Upload Required',
          message || `Please upload ${documentType.replace('_', ' ')} document for ${vehicle.brand} ${vehicle.model}`,
          JSON.stringify({ vehicleId: id, documentType })
        ]
      );

      res.json({
        success: true,
        message: 'Document upload request sent successfully',
        data: {
          vehicleId: id,
          documentType,
          message: message || `Please upload ${documentType} for ${vehicle.brand} ${vehicle.model}`
        }
      });

    } catch (error) {
      console.error('❌ Document request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send document request'
      });
    }
  }
);

// ============================================
// ✅ COLLECTION ROUTES
// ============================================

// Public: Search vehicles
router.get(
  '/',
  validateSearchQuery,
  vehicleController.searchVehicles
);

// Owner: Create vehicle
router.post(
  '/',
  authMiddleware,
  requireRole('owner'),
  validateCreateVehicle,
  vehicleController.createVehicle
);

// ============================================
// ✅ DYNAMIC ROUTES LAST
// ============================================

// Owner: Update vehicle
router.patch(
  '/:id',
  authMiddleware,
  requireRole('owner'),
  validateUpdateVehicle,
  vehicleController.updateVehicle
);

// Owner: Delete vehicle
router.delete(
  '/:id',
  authMiddleware,
  requireRole('owner'),
  vehicleController.deleteVehicle
);

// Public: Get single vehicle (LAST!)
router.get(
  '/:id',
  vehicleController.getVehicleById
);

module.exports = router;