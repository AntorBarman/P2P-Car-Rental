const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/auth');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const db = require('../config/database');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files allowed'));
    }
  },
});

const VALID_DOCUMENT_TYPES = [
  'nid', 'nid_front', 'nid_back',
  'driving_license', 'driving_license_front', 'driving_license_back',
  'face_photo',
  'vehicle_rc', 'insurance', 'tax_token', 'vehicle_photo', 'other',
];

// ✅ Get my documents
router.get('/my', authMiddleware, asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT d.*, v.brand, v.model, v.year
     FROM documents d
     LEFT JOIN vehicles v ON d.vehicle_id = v.id
     WHERE d.user_id = $1
     ORDER BY 
      CASE d.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      d.created_at DESC`,
    [req.user.id]
  );

  console.log(`📄 Found ${result.rows.length} documents for user ${req.user.id}`);
  res.json(ApiResponse.ok('Documents retrieved', result.rows));
}));

// ✅ Get documents for a specific vehicle (NEW)
router.get('/vehicle/:vehicleId', authMiddleware, asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  
  console.log('🔍 Fetching documents for vehicle:', vehicleId);
  
  const vehicleCheck = await db.query(
    'SELECT owner_id FROM vehicles WHERE id = $1 AND is_deleted = FALSE',
    [vehicleId]
  );
  
  if (vehicleCheck.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  
  if (vehicleCheck.rows[0].owner_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You do not own this vehicle' });
  }
  
  const result = await db.query(
    `SELECT * FROM documents 
     WHERE vehicle_id = $1 
     AND is_active = true
     ORDER BY created_at DESC`,
    [vehicleId]
  );
  
  console.log(`✅ Found ${result.rows.length} documents for vehicle ${vehicleId}`);
  res.json(ApiResponse.ok('Vehicle documents retrieved', result.rows));
}));

// ✅ Upload document
router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
  const { document_type, vehicle_id } = req.body;

  console.log('🔍 Upload:', { document_type, vehicle_id, file: req.file?.originalname });

  if (!document_type) {
    return res.status(400).json({ success: false, message: 'Document type is required' });
  }

  if (!VALID_DOCUMENT_TYPES.includes(document_type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid document type. Allowed: ${VALID_DOCUMENT_TYPES.join(', ')}`,
    });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File is required' });
  }

  let vehicleId = null;
  if (vehicle_id) {
    const vehicleCheck = await db.query(
      'SELECT id FROM vehicles WHERE id = $1 AND owner_id = $2 AND is_deleted = FALSE',
      [vehicle_id, req.user.id]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vehicle not found or you do not own this vehicle' 
      });
    }
    vehicleId = vehicle_id;
  }

  // Deactivate old documents
  await db.query(
    `UPDATE documents 
     SET is_active = false, updated_at = NOW()
     WHERE user_id = $1 
     AND document_type = $2 
     AND ($3::uuid IS NULL OR vehicle_id = $3)`,
    [req.user.id, document_type, vehicleId]
  );

  let documentUrl = req.file.originalname;
  let publicId = null;

  try {
    const base64 = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64}`;

    const cloudinaryResult = await cloudinary.uploader.upload(dataURI, {
      folder: 'udrive-bangladesh/documents',
      resource_type: 'auto',
      public_id: `doc_${req.user.id.slice(0, 8)}_${Date.now()}`,
    });

    documentUrl = cloudinaryResult.secure_url;
    publicId = cloudinaryResult.public_id;
  } catch (error) {
    console.warn('⚠️ Cloudinary failed, using filename:', error.message);
  }

  const result = await db.query(
    `INSERT INTO documents (
      user_id, vehicle_id, document_type, document_url, public_id, 
      status, is_active, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, 'pending', true, NOW(), NOW())
     RETURNING *`,
    [req.user.id, vehicleId, document_type, documentUrl, publicId]
  );

  console.log('✅ Document uploaded:', result.rows[0].id);
  res.status(201).json(ApiResponse.created('Document uploaded', result.rows[0]));
}));

// ✅ Delete document
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const docResult = await db.query(
    'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  if (docResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const doc = docResult.rows[0];

  if (doc.public_id) {
    try {
      await cloudinary.uploader.destroy(doc.public_id);
      console.log('🗑️ Deleted from Cloudinary:', doc.public_id);
    } catch (error) {
      console.warn('⚠️ Cloudinary delete failed:', error.message);
    }
  }

  await db.query('DELETE FROM documents WHERE id = $1', [id]);
  console.log('🗑️ Document deleted:', id);
  res.json(ApiResponse.ok('Document deleted'));
}));

// ✅ Get document by ID
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    `SELECT d.*, u.name as verified_by_name
     FROM documents d
     LEFT JOIN users u ON d.verified_by = u.id
     WHERE d.id = $1 AND d.user_id = $2`,
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  res.json(ApiResponse.ok('Document retrieved', result.rows[0]));
}));

module.exports = router;