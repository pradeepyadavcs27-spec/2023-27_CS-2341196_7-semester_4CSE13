const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { sendPasswordResetEmail } = require('../services/emailService');

// Helper: Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'default_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and role.',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Check if the role matches
    if (user.role !== role) {
      console.log('Login failed: Role mismatch. Expected:', role, 'Actual:', user.role);
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. This account is not registered as a ${role}.`,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('Login failed: User inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Login failed: Password mismatch for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    // Remove password from response
    const { password: _, ...userResponse } = user;
    userResponse._id = userResponse.id;

    res.status(200).cookie('token', token, cookieOptions).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: { resetPasswordToken, resetPasswordExpire }
    });

    // Create reset URL
    const resetUrl = `${
      process.env.FRONTEND_URL || 'http://localhost:5173'
    }/reset-password/${resetToken}`;

    // Send email
    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
      resetUrl, // Send back for easy local testing without SMTP
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    // Reset the token fields if email fails
    await prisma.user.updateMany({
      where: { email: req.body.email },
      data: { resetPasswordToken: null, resetPasswordExpire: null }
    });

    res.status(500).json({
      success: false,
      message: 'Email could not be sent. Please try again later.',
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // Hash the token from params
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with matching token that hasn't expired
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { gt: new Date() },
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set new password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null
      }
    });

    // Generate new token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password reset successful.',
      token,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset.',
    });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (user) {
        delete user.password;
        user._id = user.id;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Generate new token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      token,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change.',
    });
  }
};

// @desc    Upload user avatar
// @route   POST /api/auth/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    // Save relative path to DB
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl }
    });
    
    delete user.password;

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      user
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar upload.',
    });
  }
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  uploadAvatar,
};
