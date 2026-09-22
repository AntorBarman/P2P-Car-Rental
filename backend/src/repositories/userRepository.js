const db = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }
  
  async findByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1';
    const result = await db.query(query, [phone]);
    return result.rows[0];
  }
  
  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
  
  async create(userData) {
    const query = `
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, is_active, created_at
    `;
    
    const params = [
      userData.name,
      userData.email,
      userData.phone,
      userData.passwordHash,
      userData.role,
    ];
    
    const result = await db.query(query, params);
    return result.rows[0];
  }
  
  async updateProfile(userId, data) {
    const result = await db.query(
      `UPDATE users 
       SET name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, name, email, phone, role, avatar_url, is_active, created_at`,
      [data.name, data.phone, userId]
    );
    
    return result.rows[0];
  }
  
  async updateAvatar(userId, avatarUrl) {
    await db.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, userId]
    );
  }
  
  async updatePassword(userId, newHash) {
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, userId]
    );
  }
  
  async deactivate(userId) {
    await db.query(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }
  
  async activate(userId) {
    await db.query(
      'UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }
  
  async updateLastLogin(userId) {
    await db.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }
}

module.exports = new UserRepository();