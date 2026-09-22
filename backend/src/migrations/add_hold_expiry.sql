-- ✅ Add hold_expires_at column to bookings table
ALTER TABLE bookings 
ADD COLUMN hold_expires_at TIMESTAMP;

-- ✅ Add index for expiry job performance
CREATE INDEX idx_bookings_hold_expires 
ON bookings(hold_expires_at) 
WHERE status = 'pending_payment';

-- ✅ Add status check constraint (optional but recommended)
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending_payment', 'confirmed', 'ongoing', 'completed', 'cancelled', 'expired'));