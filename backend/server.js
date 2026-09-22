const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// ✅ Import hold expiry job
const holdExpiryJob = require('./src/jobs/expireHolds');

// ✅ Start the expiry job
holdExpiryJob.start();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 UDrive Bangladesh server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network: http://192.168.0.224:${PORT}/api/health`);
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM signal, shutting down gracefully...');
  holdExpiryJob.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT signal, shutting down gracefully...');
  holdExpiryJob.stop();
  process.exit(0);
});