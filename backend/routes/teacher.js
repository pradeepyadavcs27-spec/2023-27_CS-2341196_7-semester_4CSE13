const express = require('express');
const router = express.Router();
const {
  markAttendance,
  updateAttendance,
  getStudentsList,
  getAttendanceReport,
  getSummary,
  generateQrSession,
  getQrSessionStatus,
  closeQrSession
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/auth');

// All routes are protected and require teacher or admin role
router.use(protect);
router.use(authorize('teacher', 'admin'));

router.post('/mark-attendance', markAttendance);
router.put('/update-attendance', updateAttendance);
router.get('/students', getStudentsList);
router.get('/attendance-report', getAttendanceReport);
router.get('/summary', getSummary);

// QR Attendance Routes
router.post('/qr-session', generateQrSession);
router.get('/qr-session/:code/status', getQrSessionStatus);
router.post('/qr-session/:code/close', closeQrSession);

module.exports = router;
