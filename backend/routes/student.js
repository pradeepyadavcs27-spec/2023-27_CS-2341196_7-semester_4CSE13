const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceSummary,
  getCalendarData,
  markQrAttendance
} = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/auth');

// All routes are protected and require student or admin role
router.use(protect);
router.use(authorize('student', 'admin'));

router.get('/attendance', getAttendance);
router.get('/attendance-summary', getAttendanceSummary);
router.get('/calendar', getCalendarData);
router.post('/mark-qr-attendance', markQrAttendance);

module.exports = router;
