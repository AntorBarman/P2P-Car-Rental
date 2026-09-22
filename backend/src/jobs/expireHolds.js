const cron = require('node-cron');
const db = require('../config/database');
const notificationService = require('../services/notificationService'); // ✅ ADD
const userRepository = require('../repositories/userRepository'); // ✅ ADD
const vehicleRepository = require('../repositories/vehicleRepository'); // ✅ ADD

class HoldExpiryJob {
  constructor() {
    this.job = cron.schedule('* * * * *', async () => {
      await this.expireExpiredHolds();
    });
    console.log('⏰ Hold expiry job scheduled');
  }
  
  async expireExpiredHolds() {
    try {
      console.log('🔍 Checking expired holds...', new Date().toISOString());
      
      const result = await db.query(
        `UPDATE bookings 
         SET status = 'expired', 
             updated_at = NOW()
         WHERE status = 'pending_payment'
         AND hold_expires_at < NOW()
         AND hold_expires_at IS NOT NULL
         RETURNING id, vehicle_id, customer_id, pickup_date, return_date`
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ Released ${result.rows.length} expired holds`);
        
        // ✅ Send hold expired notifications
        for (const booking of result.rows) {
          try {
            const customer = await userRepository.findById(booking.customer_id);
            const vehicle = await vehicleRepository.findById(booking.vehicle_id);
            
            if (customer && vehicle) {
              await notificationService.bookingHoldExpired(booking, customer, vehicle);
              console.log(`📢 Hold expired notification sent for booking ${booking.id}`);
            }
          } catch (notifError) {
            console.error('❌ Notification error for booking', booking.id, ':', notifError.message);
          }
        }
      }
      
      return result.rows;
      
    } catch (error) {
      console.error('❌ Expiry job failed:', error);
    }
  }
  
  start() {
    console.log('▶️ Hold expiry job started');
    return this;
  }
  
  stop() {
    this.job.stop();
    console.log('⏹️ Hold expiry job stopped');
  }
}

module.exports = new HoldExpiryJob();