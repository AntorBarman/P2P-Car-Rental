const db = require('../config/database');

class VehicleRepository {
  async create(vehicleData) {
    const query = `
      INSERT INTO vehicles (
        owner_id, branch_id, brand, model, year, vehicle_type,
        transmission, fuel_type, seats, color, registration_number,
        description, daily_rate, deposit_amount, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      vehicleData.owner_id,
      vehicleData.branch_id,
      vehicleData.brand,
      vehicleData.model,
      vehicleData.year,
      vehicleData.vehicle_type,
      vehicleData.transmission,
      vehicleData.fuel_type,
      vehicleData.seats,
      vehicleData.color || null,
      vehicleData.registration_number || null,
      vehicleData.description || null,
      vehicleData.daily_rate,
      vehicleData.deposit_amount,
      vehicleData.status || 'pending',
    ];

    const result = await db.query(query, params);
    return result.rows[0];
  }

  async findById(id) {
    const query = `
      SELECT v.*, 
             b.name as branch_name,
             b.address as branch_address,
             u.name as owner_name,
             u.email as owner_email,
             u.phone as owner_phone,
             COALESCE(
               (SELECT vi.image_url FROM vehicle_images vi 
                WHERE vi.vehicle_id = v.id AND vi.is_primary = TRUE LIMIT 1),
               (SELECT vi.image_url FROM vehicle_images vi 
                WHERE vi.vehicle_id = v.id ORDER BY vi.created_at ASC LIMIT 1)
             ) as primary_image
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.id
      JOIN users u ON v.owner_id = u.id
      WHERE v.id = $1 AND v.is_deleted = FALSE
    `;

    const result = await db.query(query, [id]);
    const vehicle = result.rows[0];

    if (vehicle) {
      const imagesQuery = `
        SELECT id, image_url, public_id, is_primary, display_order
        FROM vehicle_images
        WHERE vehicle_id = $1
        ORDER BY is_primary DESC, display_order ASC
      `;
      const imagesResult = await db.query(imagesQuery, [id]);
      vehicle.images = imagesResult.rows;
    }

    return vehicle;
  }

  async findByOwnerId(ownerId) {
    const query = `
      SELECT v.*, 
             b.name as branch_name,
             COALESCE(
               (SELECT vi.image_url FROM vehicle_images vi 
                WHERE vi.vehicle_id = v.id AND vi.is_primary = TRUE LIMIT 1),
               (SELECT vi.image_url FROM vehicle_images vi 
                WHERE vi.vehicle_id = v.id ORDER BY vi.created_at ASC LIMIT 1)
             ) as primary_image
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.id
      WHERE v.owner_id = $1 AND v.is_deleted = FALSE
      ORDER BY v.created_at DESC
    `;

    const result = await db.query(query, [ownerId]);
    return result.rows;
  }

  async update(id, vehicleData) {
    const updates = [];
    const params = [];
    let paramCount = 1;

    Object.keys(vehicleData).forEach((key) => {
      updates.push(`${key} = $${paramCount}`);
      params.push(vehicleData[key]);
      paramCount++;
    });

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE vehicles 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND is_deleted = FALSE
      RETURNING *
    `;

    const result = await db.query(query, params);
    return result.rows[0];
  }

  async softDelete(id) {
    const query = `
      UPDATE vehicles 
      SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // ✅ FIXED: Search without compliance_status
  async search(filters) {
    const conditions = ['v.is_deleted = FALSE'];
    const params = [];
    let paramCount = 1;

    // Only show APPROVED vehicles
    conditions.push(`v.status = $${paramCount}`);
    params.push('approved');
    paramCount++;

    // Branch filter
    if (filters.branch_id) {
      conditions.push(`v.branch_id = $${paramCount}`);
      params.push(filters.branch_id);
      paramCount++;
    }

    // Vehicle type
    if (filters.vehicle_type) {
      conditions.push(`v.vehicle_type = $${paramCount}`);
      params.push(filters.vehicle_type);
      paramCount++;
    }

    // Transmission
    if (filters.transmission) {
      conditions.push(`v.transmission = $${paramCount}`);
      params.push(filters.transmission);
      paramCount++;
    }

    // Fuel type
    if (filters.fuel_type) {
      conditions.push(`v.fuel_type = $${paramCount}`);
      params.push(filters.fuel_type);
      paramCount++;
    }

    // Seats
    if (filters.seats) {
      conditions.push(`v.seats = $${paramCount}`);
      params.push(parseInt(filters.seats));
      paramCount++;
    }

    // Brand/model search
    if (filters.brand) {
      conditions.push(`(v.brand ILIKE $${paramCount} OR v.model ILIKE $${paramCount})`);
      params.push(`%${filters.brand}%`);
      paramCount++;
    }

    // Price range
    if (filters.min_price) {
      conditions.push(`v.daily_rate >= $${paramCount}`);
      params.push(parseFloat(filters.min_price));
      paramCount++;
    }

    if (filters.max_price) {
      conditions.push(`v.daily_rate <= $${paramCount}`);
      params.push(parseFloat(filters.max_price));
      paramCount++;
    }

    // Date availability check
    if (filters.pickup_date && filters.return_date) {
      conditions.push(`
      NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.vehicle_id = v.id
        AND b.status IN ('pending_payment', 'confirmed', 'ongoing')
        AND (
          (b.pickup_date <= $${paramCount}::date AND b.return_date >= $${paramCount}::date) OR
          (b.pickup_date <= $${paramCount + 1}::date AND b.return_date >= $${paramCount + 1}::date) OR
          (b.pickup_date >= $${paramCount}::date AND b.return_date <= $${paramCount + 1}::date)
        )
      )
    `);
      params.push(filters.pickup_date, filters.return_date);
      paramCount += 2;
    }

    const whereClause = conditions.join(' AND ');

    // Count
    const countQuery = `SELECT COUNT(*) as total FROM vehicles v WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Pagination
    const limit = parseInt(filters.limit) || 9;
    const page = parseInt(filters.page) || 1;
    const offset = (page - 1) * limit;

    // ✅ FIXED: Sort logic
    let orderBy = 'v.created_at';
    let orderDir = 'DESC';

    if (filters.sort_by === 'daily_rate') {
      orderBy = 'v.daily_rate';
      orderDir = 'ASC';
    } else if (filters.sort_by === 'daily_rate_desc') {
      orderBy = 'v.daily_rate';
      orderDir = 'DESC';
    } else if (filters.sort_by === 'created_at') {
      orderBy = 'v.created_at';
      orderDir = 'DESC';
    }

    const dataParams = [...params, limit, offset];

    const dataQuery = `
    SELECT 
      v.*,
      b.name as branch_name,
      u.name as owner_name,
      COALESCE(
        (SELECT vi.image_url FROM vehicle_images vi 
         WHERE vi.vehicle_id = v.id AND vi.is_primary = TRUE LIMIT 1),
        (SELECT vi.image_url FROM vehicle_images vi 
         WHERE vi.vehicle_id = v.id ORDER BY vi.created_at ASC LIMIT 1)
      ) as primary_image
    FROM vehicles v
    JOIN branches b ON v.branch_id = b.id
    JOIN users u ON v.owner_id = u.id
    WHERE ${whereClause}
    ORDER BY ${orderBy} ${orderDir}
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;

    const dataResult = await db.query(dataQuery, dataParams);

    return {
      vehicles: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addImage(vehicleId, imageUrl, publicId, isPrimary = false, displayOrder = 0) {
    const query = `
      INSERT INTO vehicle_images (vehicle_id, image_url, public_id, is_primary, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [vehicleId, imageUrl, publicId, isPrimary, displayOrder]);
    return result.rows[0];
  }

  async getImages(vehicleId) {
    const query = `
      SELECT * FROM vehicle_images
      WHERE vehicle_id = $1
      ORDER BY is_primary DESC, display_order ASC
    `;
    const result = await db.query(query, [vehicleId]);
    return result.rows;
  }

  async hasActiveBookings(vehicleId) {
    const query = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE vehicle_id = $1
      AND status IN ('pending_payment', 'confirmed', 'ongoing')
    `;
    const result = await db.query(query, [vehicleId]);
    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = new VehicleRepository();