const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getStudents,
  getTeachers,
  registerStudent,
  registerTeacher,
  updateUser,
  deleteUser,
  getRecentRecords,
  sendReport,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/students', getStudents);
router.get('/teachers', getTeachers);
router.post('/register-student', registerStudent);
router.post('/register-teacher', registerTeacher);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/recent-records', getRecentRecords);
router.post('/send-report', sendReport);

module.exports = router;
