const db = require('../config/database');

class ComplianceService {
  
  // ✅ Check if vehicle is rental eligible
  async checkVehicleCompliance(vehicleId) {
    console.log('🔍 Checking compliance for vehicle:', vehicleId);
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get vehicle status
      const vehicleResult = await client.query(
        `SELECT status, compliance_status FROM vehicles WHERE id = $1 AND is_deleted = FALSE`,
        [vehicleId]
      );
      
      if (vehicleResult.rows.length === 0) {
        return { eligible: false, reason: 'Vehicle not found' };
      }
      
      const vehicle = vehicleResult.rows[0];
      
      // 2. Check required documents
      const docResult = await client.query(
        `SELECT 
          COUNT(*) FILTER (WHERE document_type IN ('vehicle_rc', 'insurance', 'tax_token') AND status = 'approved' AND is_active = true) as approved_count,
          COUNT(*) FILTER (WHERE document_type IN ('vehicle_rc', 'insurance', 'tax_token')) as total_required,
          COUNT(*) FILTER (WHERE document_type = 'insurance' AND status = 'approved' AND expiry_date < CURRENT_DATE) as expired_insurance,
          COUNT(*) FILTER (WHERE document_type = 'tax_token' AND status = 'approved' AND expiry_date < CURRENT_DATE) as expired_tax
         FROM documents 
         WHERE vehicle_id = $1 
         AND is_active = true`,
        [vehicleId]
      );
      
      const { approved_count, total_required, expired_insurance, expired_tax } = docResult.rows[0];
      
      console.log('📄 Document check:', { approved_count, total_required, expired_insurance, expired_tax });
      
      // 3. Determine compliance status
      let complianceStatus = 'blocked';
      let notes = [];
      
      // Check if vehicle is suspended
      if (vehicle.compliance_status === 'suspended') {
        await client.query('COMMIT');
        return { 
          eligible: false, 
          status: 'suspended', 
          reason: 'Vehicle suspended by admin',
          notes: ['Vehicle suspended by admin']
        };
      }
      
      // Check required documents
      if (total_required < 3) {
        notes.push('Missing required documents');
        complianceStatus = 'blocked';
      } else if (approved_count < 3) {
        notes.push('Some documents not verified');
        complianceStatus = 'under_review';
      } else if (expired_insurance > 0) {
        notes.push('Insurance expired');
        complianceStatus = 'blocked';
      } else if (expired_tax > 0) {
        notes.push('Tax token expired');
        complianceStatus = 'blocked';
      } else if (vehicle.status !== 'approved') {
        notes.push(`Vehicle status: ${vehicle.status}`);
        complianceStatus = 'blocked';
      } else {
        complianceStatus = 'rental_ready';
        notes.push('All compliant');
      }
      
      // 4. Update vehicle compliance
      await client.query(
        `UPDATE vehicles 
         SET compliance_status = $1, 
             compliance_notes = $2,
             last_compliance_check = NOW()
         WHERE id = $3`,
        [complianceStatus, notes.join(', '), vehicleId]
      );
      
      await client.query('COMMIT');
      
      const eligible = complianceStatus === 'rental_ready';
      
      console.log(`✅ Vehicle ${vehicleId} - Eligible: ${eligible}, Status: ${complianceStatus}`);
      
      return {
        eligible,
        status: complianceStatus,
        notes: notes,
        documentStats: {
          approved: parseInt(approved_count),
          required: parseInt(total_required),
          expiredInsurance: parseInt(expired_insurance),
          expiredTax: parseInt(expired_tax)
        }
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Compliance check error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ✅ Check if vehicle can be booked
  async canVehicleBeBooked(vehicleId) {
    const result = await db.query(
      `SELECT compliance_status, status 
       FROM vehicles 
       WHERE id = $1 AND is_deleted = FALSE`,
      [vehicleId]
    );
    
    if (result.rows.length === 0) {
      return { canBook: false, reason: 'Vehicle not found' };
    }
    
    const vehicle = result.rows[0];
    
    // Check compliance
    if (vehicle.compliance_status !== 'rental_ready') {
      return { 
        canBook: false, 
        reason: `Vehicle ${vehicle.compliance_status.replace('_', ' ')}` 
      };
    }
    
    // Check vehicle status
    if (vehicle.status !== 'approved') {
      return { 
        canBook: false, 
        reason: `Vehicle status: ${vehicle.status}` 
      };
    }
    
    return { canBook: true, reason: 'Available for booking' };
  }
  
  // ✅ Get compliance details for admin
  async getComplianceDetails(vehicleId) {
    const result = await db.query(`
      SELECT 
        v.id, v.brand, v.model, v.year,
        v.compliance_status, v.compliance_notes,
        v.status as vehicle_status,
        v.registration_number, v.chassis_number, v.engine_number,
        v.mileage, v.inspection_date,
        COALESCE(
          json_agg(json_build_object(
            'id', d.id,
            'type', d.document_type,
            'status', d.status,
            'uploaded_at', d.created_at,
            'verified_by', d.verified_by,
            'verified_at', d.verified_at,
            'expiry_date', d.expiry_date,
            'rejection_reason', d.rejection_reason
          )) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) as documents
      FROM vehicles v
      LEFT JOIN documents d ON v.id = d.vehicle_id AND d.is_active = true
      WHERE v.id = $1
      GROUP BY v.id
    `, [vehicleId]);
    
    return result.rows[0];
  }
}

module.exports = new ComplianceService();