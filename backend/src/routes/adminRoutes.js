const express = require('express');
const authMiddleware = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const db = require('../config/database');

const router = express.Router();

// All routes require admin/staff
router.use(authMiddleware, requireRole('admin', 'staff'));

// ==================== USER MANAGEMENT ====================

router.get('/users', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      id, name, email, phone, role, 
      is_active, created_at,
      (SELECT COUNT(*) FROM vehicles WHERE owner_id = users.id AND is_deleted = FALSE) as vehicle_count,
      (SELECT COUNT(*) FROM bookings WHERE customer_id = users.id) as booking_count
    FROM users
    ORDER BY created_at DESC
  `);

  res.json(ApiResponse.ok('Users retrieved successfully', result.rows));
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      id, name, email, phone, role, 
      is_active, created_at, updated_at,
      (SELECT COUNT(*) FROM vehicles WHERE owner_id = users.id AND is_deleted = FALSE) as vehicle_count,
      (SELECT COUNT(*) FROM bookings WHERE customer_id = users.id) as booking_count,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE user_id = users.id AND status = 'paid') as total_spent
    FROM users
    WHERE id = $1
  `, [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json(ApiResponse.ok('User retrieved', result.rows[0]));
}));

router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ success: false, message: 'Role is required' });
  }

  const validRoles = ['customer', 'owner', 'staff', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const result = await db.query(
    `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 RETURNING id, name, email, role, updated_at`,
    [role, req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
     VALUES ($1, 'UPDATE_ROLE', 'users', $2, $3)`,
    [req.user.id, req.params.id, JSON.stringify({ role })]
  );

  res.json(ApiResponse.ok('User role updated', result.rows[0]));
}));

router.patch('/users/:id/toggle-status', asyncHandler(async (req, res) => {
  const result = await db.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1 RETURNING id, name, email, is_active, updated_at`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const status = result.rows[0].is_active ? 'activated' : 'deactivated';

  await db.query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
     VALUES ($1, 'TOGGLE_STATUS', 'users', $2, $3)`,
    [req.user.id, req.params.id, JSON.stringify({ is_active: result.rows[0].is_active })]
  );

  res.json(ApiResponse.ok(`User ${status} successfully`, result.rows[0]));
}));

// ==================== DOCUMENT MANAGEMENT ====================

// ✅ Get all KYC documents (including approved/rejected)
router.get('/documents', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      d.id,
      d.user_id,
      d.document_type,
      d.document_url,
      d.status,
      d.rejection_reason,
      d.verified_by,
      d.verified_at,
      d.created_at,
      d.updated_at,
      d.expiry_date,
      d.is_active,
      u.name as user_name,
      u.email as user_email,
      u.phone as user_phone,
      u.role as user_role
    FROM documents d
    JOIN users u ON d.user_id = u.id
    WHERE d.document_type IN ('nid_front', 'nid_back', 'driving_license_front', 'driving_license_back', 'face_photo')
    ORDER BY 
      CASE d.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      d.created_at DESC
  `);

  res.json(ApiResponse.ok('KYC documents retrieved', result.rows));
}));

router.get('/documents/pending', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT d.*, u.name as user_name, u.email as user_email
    FROM documents d
    JOIN users u ON d.user_id = u.id
    WHERE d.status = 'pending'
    ORDER BY d.created_at ASC
  `);

  res.json(ApiResponse.ok('Pending documents retrieved', result.rows));
}));

router.patch('/documents/:id/approve', asyncHandler(async (req, res) => {
  console.log('🔵 Approving document:', req.params.id);

  const checkResult = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);

  if (checkResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const result = await db.query(
    `UPDATE documents 
     SET status = 'approved', rejection_reason = NULL,
         verified_by = $1, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [req.user.id, req.params.id]
  );

  await db.query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
     VALUES ($1, 'APPROVE_DOCUMENT', 'documents', $2, $3)`,
    [req.user.id, req.params.id, JSON.stringify({ status: 'approved' })]
  );

  res.json(ApiResponse.ok('Document approved', result.rows[0]));
}));

router.patch('/documents/:id/reject', asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Rejection reason required' });
  }

  const result = await db.query(
    `UPDATE documents 
     SET status = 'rejected', rejection_reason = $1,
         verified_by = $2, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 RETURNING *`,
    [reason, req.user.id, req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
     VALUES ($1, 'REJECT_DOCUMENT', 'documents', $2, $3)`,
    [req.user.id, req.params.id, JSON.stringify({ status: 'rejected', reason })]
  );

  res.json(ApiResponse.ok('Document rejected', result.rows[0]));
}));

// ==================== VEHICLE MANAGEMENT ====================
// ✅ CORRECT ORDER: Specific routes FIRST, then dynamic routes

// 1. ✅ SPECIFIC ROUTES (No :id parameter)
router.get('/vehicles/pending', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT v.*, 
           u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
           b.name as branch_name
    FROM vehicles v
    JOIN users u ON v.owner_id = u.id
    JOIN branches b ON v.branch_id = b.id
    WHERE v.status = 'pending' AND v.is_deleted = FALSE
    ORDER BY v.created_at ASC
  `);

  res.json(ApiResponse.ok('Pending vehicles retrieved', result.rows));
}));

// 2. ✅ VEHICLE DOCUMENTS (Specific route)
router.get('/vehicles/documents', asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Fetching vehicle documents...');

    const result = await db.query(`
      SELECT 
        v.id as vehicle_id,
        v.brand,
        v.model,
        v.year,
        v.status as vehicle_status,
        v.compliance_status,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'type', d.document_type,
                'status', d.status,
                'url', d.document_url,
                'created_at', d.created_at,
                'verified_at', d.verified_at,
                'rejection_reason', d.rejection_reason
              )
            )
            FROM documents d
            WHERE d.vehicle_id = v.id AND d.is_active = true
          ),
          '[]'::json
        ) as documents
      FROM vehicles v
      JOIN users u ON v.owner_id = u.id
      WHERE v.is_deleted = false
      ORDER BY v.created_at DESC
    `);

    console.log(`✅ Found ${result.rows.length} vehicles`);

    const vehicles = result.rows.map(vehicle => {
      const docs = vehicle.documents || [];
      const requiredTypes = ['vehicle_rc', 'insurance', 'tax_token'];

      const docStatus = {};
      requiredTypes.forEach(type => {
        const doc = docs.find(d => d.type === type);
        docStatus[type] = doc ? doc.status : 'missing';
      });

      const allApproved = requiredTypes.every(type => docStatus[type] === 'approved');
      const anyPending = requiredTypes.some(type => docStatus[type] === 'pending');
      const anyRejected = requiredTypes.some(type => docStatus[type] === 'rejected');

      let overallStatus = 'draft';
      const complianceStatus = vehicle.compliance_status || 'pending';

      if (allApproved && vehicle.vehicle_status === 'approved' && complianceStatus === 'rental_ready') {
        overallStatus = 'verified';
      } else if (anyRejected) {
        overallStatus = 'rejected';
      } else if (anyPending) {
        overallStatus = 'under_review';
      } else if (allApproved && vehicle.vehicle_status === 'pending') {
        overallStatus = 'pending_review';
      } else {
        overallStatus = 'incomplete';
      }

      return { ...vehicle, docStatus, overallStatus };
    });

    res.json(ApiResponse.ok('Vehicle documents retrieved', vehicles));

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle documents',
      error: error.message
    });
  }
}));

// 3. ✅ COLLECTION ROUTE (No :id)
router.get('/vehicles', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT v.*, 
           u.name as owner_name,
           b.name as branch_name
    FROM vehicles v
    JOIN users u ON v.owner_id = u.id
    JOIN branches b ON v.branch_id = b.id
    WHERE v.is_deleted = FALSE
    ORDER BY v.created_at DESC
  `);

  res.json(ApiResponse.ok('All vehicles retrieved', result.rows));
}));

// 4. ✅ DYNAMIC ROUTES (With :id) — LAST
router.get('/vehicles/:id', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT v.*, 
           u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
           b.name as branch_name, b.address as branch_address
    FROM vehicles v
    JOIN users u ON v.owner_id = u.id
    JOIN branches b ON v.branch_id = b.id
    WHERE v.id = $1 AND v.is_deleted = FALSE
  `, [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  const images = await db.query(
    'SELECT * FROM vehicle_images WHERE vehicle_id = $1 ORDER BY is_primary DESC',
    [req.params.id]
  );

  const vehicle = result.rows[0];
  vehicle.images = images.rows;

  res.json(ApiResponse.ok('Vehicle retrieved', vehicle));
}));

router.patch('/vehicles/:id/approve', asyncHandler(async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    console.log('🔵 Approving vehicle:', req.params.id);

    const vehicleResult = await client.query(
      `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Vehicle is already ${vehicle.status}` });
    }

    // Check documents
    const docResult = await client.query(
      `SELECT 
        COUNT(*) FILTER (WHERE document_type IN ('vehicle_rc', 'insurance') AND status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE document_type IN ('vehicle_rc', 'insurance')) as total_required
       FROM documents 
       WHERE vehicle_id = $1 
       AND document_type IN ('vehicle_rc', 'insurance')`,
      [req.params.id]
    );

    const totalRequired = parseInt(docResult.rows[0].total_required);
    const approvedCount = parseInt(docResult.rows[0].approved_count);

    const MANDATORY_DOCS = 2;

    if (totalRequired < MANDATORY_DOCS) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Vehicle documents incomplete. ${totalRequired}/${MANDATORY_DOCS} mandatory documents uploaded.`
      });
    }

    if (approvedCount < MANDATORY_DOCS) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Vehicle documents not verified. ${approvedCount}/${MANDATORY_DOCS} documents approved.`
      });
    }

    const updateResult = await client.query(
      `UPDATE vehicles 
       SET status = 'approved', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
       VALUES ($1, 'APPROVE_VEHICLE', 'vehicles', $2, $3)`,
      [req.user.id, req.params.id, JSON.stringify({ status: 'approved' })]
    );

    await client.query('COMMIT');

    res.json(ApiResponse.ok('Vehicle approved successfully', updateResult.rows[0]));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Vehicle approval error:', error);
    throw error;
  } finally {
    client.release();
  }
}));

router.patch('/vehicles/:id/reject', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    if (!reason) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const vehicleResult = await client.query(
      `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Vehicle is already ${vehicle.status}` });
    }

    const updateResult = await client.query(
      `UPDATE vehicles 
       SET status = 'rejected', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [reason, req.params.id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
       VALUES ($1, 'REJECT_VEHICLE', 'vehicles', $2, $3)`,
      [req.user.id, req.params.id, JSON.stringify({ status: 'rejected', reason })]
    );

    await client.query('COMMIT');

    res.json(ApiResponse.ok('Vehicle rejected', updateResult.rows[0]));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Vehicle rejection error:', error);
    throw error;
  } finally {
    client.release();
  }
}));

router.patch('/vehicles/:id/suspend', asyncHandler(async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const vehicleResult = await client.query(
      `SELECT * FROM vehicles WHERE id = $1 FOR UPDATE`,
      [req.params.id]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const updateResult = await client.query(
      `UPDATE vehicles SET status = 'suspended', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_value)
       VALUES ($1, 'SUSPEND_VEHICLE', 'vehicles', $2, $3)`,
      [req.user.id, req.params.id, JSON.stringify({ status: 'suspended' })]
    );

    await client.query('COMMIT');

    res.json(ApiResponse.ok('Vehicle suspended', updateResult.rows[0]));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Vehicle suspension error:', error);
    throw error;
  } finally {
    client.release();
  }
}));

// ==================== BOOKING MANAGEMENT ====================

router.get('/bookings', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT b.*, u.name as customer_name, u.email as customer_email, v.brand, v.model
    FROM bookings b
    JOIN users u ON b.customer_id = u.id
    JOIN vehicles v ON b.vehicle_id = v.id
    ORDER BY b.created_at DESC
  `);

  res.json(ApiResponse.ok('Bookings retrieved', result.rows));
}));

router.get('/bookings/:id', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT b.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
           v.brand, v.model, v.owner_id, owner.name as owner_name
    FROM bookings b
    JOIN users u ON b.customer_id = u.id
    JOIN vehicles v ON b.vehicle_id = v.id
    JOIN users owner ON v.owner_id = owner.id
    WHERE b.id = $1
  `, [req.params.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  const payment = await db.query('SELECT * FROM payments WHERE booking_id = $1', [req.params.id]);
  const booking = result.rows[0];
  booking.payment = payment.rows[0] || null;

  res.json(ApiResponse.ok('Booking retrieved', booking));
}));

// ==================== PAYMENT MANAGEMENT ====================

router.get('/payments', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT p.*, u.name as user_name, u.email as user_email, b.id as booking_id
    FROM payments p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN bookings b ON p.booking_id = b.id
    ORDER BY p.created_at DESC
  `);

  res.json(ApiResponse.ok('Payments retrieved', result.rows));
}));

// ==================== STATISTICS ====================

router.get('/stats', asyncHandler(async (req, res) => {
  const stats = {};

  const usersResult = await db.query(`SELECT COUNT(*) FROM users`);
  stats.totalUsers = parseInt(usersResult.rows[0].count);

  const roleResult = await db.query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`);
  stats.usersByRole = roleResult.rows;

  const vehiclesResult = await db.query(`SELECT COUNT(*) FROM vehicles WHERE is_deleted = FALSE`);
  stats.totalVehicles = parseInt(vehiclesResult.rows[0].count);

  const pendingResult = await db.query(`SELECT COUNT(*) FROM vehicles WHERE status = 'pending' AND is_deleted = FALSE`);
  stats.pendingVehicles = parseInt(pendingResult.rows[0].count);

  const pendingDocsResult = await db.query(`SELECT COUNT(*) FROM documents WHERE status = 'pending'`);
  stats.pendingDocuments = parseInt(pendingDocsResult.rows[0].count);

  const bookingsResult = await db.query(`SELECT COUNT(*) FROM bookings`);
  stats.totalBookings = parseInt(bookingsResult.rows[0].count);

  const bookingStatusResult = await db.query(`SELECT status, COUNT(*) as count FROM bookings GROUP BY status`);
  stats.bookingsByStatus = bookingStatusResult.rows;

  const paymentsResult = await db.query(`SELECT COUNT(*) FROM payments WHERE status = 'paid'`);
  stats.totalPayments = parseInt(paymentsResult.rows[0].count);

  const commissionResult = await db.query(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM wallet_transactions WHERE transaction_type = 'commission'
  `);
  stats.commissionEarned = parseInt(commissionResult.rows[0].total);

  const revenueResult = await db.query(`
    SELECT COALESCE(SUM(amount), 0) as total 
    FROM payments WHERE status = 'paid'
  `);
  stats.totalRevenue = parseInt(revenueResult.rows[0].total);

  const recentResult = await db.query(`
    SELECT b.*, u.name as customer_name, v.brand, v.model
    FROM bookings b
    JOIN users u ON b.customer_id = u.id
    JOIN vehicles v ON b.vehicle_id = v.id
    ORDER BY b.created_at DESC LIMIT 5
  `);
  stats.recentBookings = recentResult.rows;

  res.json(ApiResponse.ok('Admin stats retrieved', stats));
}));

// ==================== ACTIVITY LOGS ====================

router.get('/logs', asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const result = await db.query(`
    SELECT al.*, u.name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const countResult = await db.query(`SELECT COUNT(*) FROM audit_logs`);

  res.json(ApiResponse.ok('Audit logs retrieved', {
    data: result.rows,
    total: parseInt(countResult.rows[0].count),
    limit: parseInt(limit),
    offset: parseInt(offset)
  }));
}));

module.exports = router;