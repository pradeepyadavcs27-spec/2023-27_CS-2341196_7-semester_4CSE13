const express = require('express');
const router = express.Router();
const {
  login,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  uploadAvatar,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
