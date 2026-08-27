const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const leaveSchema = new mongoose.Schema({}, { strict: false });
const LeaveRequest = mongoose.model('LeaveRequest', leaveSchema, 'leaverequests');

async function migrate() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const result = await LeaveRequest.updateMany(
      { studentId: { $exists: true } },
      { $rename: { "studentId": "userId" } }
    );
    
    console.log('Migration complete:', result);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
