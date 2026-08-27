const express = require('express');
const {
  applyLeave,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

// Student & Teacher routes
router.post('/', authorize('student', 'teacher'), applyLeave);
router.get('/my', authorize('student', 'teacher'), getMyLeaveRequests);

// Admin & Teacher routes
router.get('/', authorize('admin', 'teacher'), getAllLeaveRequests);
router.put('/:id', authorize('admin', 'teacher'), updateLeaveStatus);

module.exports = router;
