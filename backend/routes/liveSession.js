const express = require('express');
const {
  startSession,
  stopSession,
  refreshSecret,
  checkIn
} = require('../controllers/liveSessionController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

// Teacher routes
router.post('/start', authorize('teacher'), startSession);
router.post('/:id/stop', authorize('teacher'), stopSession);
router.post('/:id/refresh', authorize('teacher'), refreshSecret);

// Student route
router.post('/checkin', authorize('student'), checkIn);

module.exports = router;
