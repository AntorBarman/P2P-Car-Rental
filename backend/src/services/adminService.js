const vehicleRepository = require('../repositories/vehicleRepository');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const db = require('../config/database');
const notificationService = require('./notificationService'); // ✅ ADD

class AdminService {
  async getPendingVehicles() {
    const query = `
      SELECT v.*, 
             u.name as owner_name,
             u.email as owner_email,
             u.phone as owner_phone,
             b.name as branch_name
      FROM vehicles v
      JOIN users u ON v.owner_id = u.id
      JOIN branches b ON v.branch_id = b.id
      WHERE v.status = 'pending' AND v.is_deleted = FALSE
      ORDER BY v.created_at ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
  
  async getAllVehicles() {
    const query = `
      SELECT v.*, 
             u.name as owner_name,
             b.name as branch_name
      FROM vehicles v
      JOIN users u ON v.owner_id = u.id
      JOIN branches b ON v.branch_id = b.id
      WHERE v.is_deleted = FALSE
      ORDER BY v.created_at DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
  
  // ✅ Approve vehicle with notification
  async approveVehicle(vehicleId, adminId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      console.log('🔵 Approving vehicle:', vehicleId);
      console.log('🔵 Admin:', adminId);
      
      const vehicleResult = await client.query(
        `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`,
        [vehicleId]
      );
      
      if (vehicleResult.rows.length === 0) {
        throw ApiError.notFound('Vehicle not found');
      }
      
      const vehicle = vehicleResult.rows[0];
      
      if (vehicle.status !== 'pending') {
        throw ApiError.badRequest(`Vehicle is already ${vehicle.status}`);
      }
      
      const docResult = await client.query(
        `SELECT 
          COUNT(*) FILTER (WHERE document_type IN ('vehicle_rc', 'insurance') AND status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE document_type IN ('vehicle_rc', 'insurance')) as total_required
         FROM documents 
         WHERE vehicle_id = $1 
         AND document_type IN ('vehicle_rc', 'insurance')`,
        [vehicleId]
      );
      
      const totalRequired = parseInt(docResult.rows[0].total_required);
      const approvedCount = parseInt(docResult.rows[0].approved_count);
      
      console.log('🔍 Vehicle Document Check:', { totalRequired, approvedCount });
      
      const MANDATORY_DOCS = 2;
      
      if (totalRequired < MANDATORY_DOCS) {
        throw ApiError.badRequest(
          `Vehicle documents incomplete. ${totalRequired}/${MANDATORY_DOCS} mandatory documents uploaded.`
        );
      }
      
      if (approvedCount < MANDATORY_DOCS) {
        throw ApiError.badRequest(
          `Vehicle documents not verified. ${approvedCount}/${MANDATORY_DOCS} documents approved.`
        );
      }
      
      const updateResult = await client.query(
        `UPDATE vehicles 
         SET status = 'approved', 
             rejection_reason = NULL,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [vehicleId]
      );
      
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
         VALUES ($1, 'APPROVE', 'vehicles', $2, $3)`,
        [adminId, vehicleId, JSON.stringify({ status: 'approved' })]
      );
      
      await client.query('COMMIT');
      
      console.log('✅ Vehicle approved:', updateResult.rows[0]);

      // ✅ Send notification to owner
      try {
        const owner = await userRepository.findById(vehicle.owner_id);
        if (owner) {
          await notificationService.vehicleDocumentApproved(owner, 'Vehicle', vehicle);
          console.log(`📢 Vehicle approved notification sent to ${owner.email}`);
        }
      } catch (notifError) {
        console.error('❌ Notification error:', notifError.message);
      }
      
      return updateResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Vehicle approval error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ✅ Reject vehicle with notification
  async rejectVehicle(vehicleId, adminId, reason) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      console.log('🔴 Rejecting vehicle:', vehicleId);
      console.log('🔴 Reason:', reason);
      
      const vehicleResult = await client.query(
        `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`,
        [vehicleId]
      );
      
      if (vehicleResult.rows.length === 0) {
        throw ApiError.notFound('Vehicle not found');
      }
      
      const vehicle = vehicleResult.rows[0];
      
      if (vehicle.status !== 'pending') {
        throw ApiError.badRequest(`Vehicle is already ${vehicle.status}`);
      }
      
      if (!reason) {
        throw ApiError.badRequest('Rejection reason is required');
      }
      
      const updateResult = await client.query(
        `UPDATE vehicles 
         SET status = 'rejected', 
             rejection_reason = $1,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [reason, vehicleId]
      );
      
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
         VALUES ($1, 'REJECT', 'vehicles', $2, $3)`,
        [adminId, vehicleId, JSON.stringify({ status: 'rejected', reason })]
      );
      
      await client.query('COMMIT');
      
      console.log('✅ Vehicle rejected:', updateResult.rows[0]);

      // ✅ Send notification to owner
      try {
        const owner = await userRepository.findById(vehicle.owner_id);
        if (owner) {
          await notificationService.vehicleDocumentRejected(owner, 'Vehicle', vehicle, reason);
          console.log(`📢 Vehicle rejected notification sent to ${owner.email}`);
        }
      } catch (notifError) {
        console.error('❌ Notification error:', notifError.message);
      }
      
      return updateResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Vehicle rejection error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async suspendVehicle(vehicleId, adminId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      console.log('⏸️ Suspending vehicle:', vehicleId);
      console.log('🔵 Admin:', adminId);
      
      const vehicleResult = await client.query(
        `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`,
        [vehicleId]
      );
      
      if (vehicleResult.rows.length === 0) {
        throw ApiError.notFound('Vehicle not found');
      }
      
      const updateResult = await client.query(
        `UPDATE vehicles 
         SET status = 'suspended', 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [vehicleId]
      );
      
      await client.query(
        `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
         VALUES ($1, 'SUSPEND', 'vehicles', $2, $3)`,
        [adminId, vehicleId, JSON.stringify({ status: 'suspended' })]
      );
      
      await client.query('COMMIT');
      
      console.log('✅ Vehicle suspended:', updateResult.rows[0]);
      
      return updateResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Vehicle suspension error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getAdminStats() {
    const stats = {};
    
    const usersResult = await db.query(`SELECT COUNT(*) FROM users`);
    stats.totalUsers = parseInt(usersResult.rows[0].count);
    
    const vehiclesResult = await db.query(`SELECT COUNT(*) FROM vehicles WHERE is_deleted = FALSE`);
    stats.totalVehicles = parseInt(vehiclesResult.rows[0].count);
    
    const pendingResult = await db.query(`SELECT COUNT(*) FROM vehicles WHERE status = 'pending' AND is_deleted = FALSE`);
    stats.pendingVehicles = parseInt(pendingResult.rows[0].count);
    
    const pendingDocsResult = await db.query(`SELECT COUNT(*) FROM documents WHERE status = 'pending'`);
    stats.pendingDocuments = parseInt(pendingDocsResult.rows[0].count);
    
    const bookingsResult = await db.query(`SELECT COUNT(*) FROM bookings`);
    stats.totalBookings = parseInt(bookingsResult.rows[0].count);
    
    const paymentsResult = await db.query(`SELECT COUNT(*) FROM payments WHERE status = 'paid'`);
    stats.totalPayments = parseInt(paymentsResult.rows[0].count);
    
    const commissionResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM wallet_transactions 
      WHERE transaction_type = 'commission'
    `);
    stats.commissionEarned = parseInt(commissionResult.rows[0].total);
    
    const revenueResult = await db.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'paid'
    `);
    stats.totalRevenue = parseInt(revenueResult.rows[0].total);
    
    return stats;
  }
}

module.exports = new AdminService();