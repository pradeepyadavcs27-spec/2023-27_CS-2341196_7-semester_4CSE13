const { prisma } = require('../config/db');
const crypto = require('crypto');

// Helper to calculate distance in meters using Haversine formula
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in m
  return d;
}

// Generate a random 6-character hex secret
const generateSecret = () => crypto.randomBytes(3).toString('hex').toUpperCase();

// @desc    Start a live session
// @route   POST /api/live-session/start
// @access  Private/Teacher
exports.startSession = async (req, res) => {
  try {
    const { subject, class: className, department, semester, section, latitude, longitude } = req.body;

    if (!subject || !className || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields or location.' });
    }

    // Deactivate any existing active sessions for this teacher
    await prisma.liveSession.updateMany({
      where: { teacherId: req.user.id, active: true },
      data: { active: false }
    });

    const session = await prisma.liveSession.create({
      data: {
        teacherId: req.user.id,
        subject,
        class: className,
        department: department || null,
        semester: semester ? parseInt(semester) : null,
        section: section || null,
        currentSecret: generateSecret(),
        latitude,
        longitude
      }
    });

    res.status(201).json({ success: true, session: { ...session, _id: session.id } });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ success: false, message: 'Failed to start session.' });
  }
};

// @desc    Stop a live session
// @route   POST /api/live-session/:id/stop
// @access  Private/Teacher
exports.stopSession = async (req, res) => {
  try {
    const session = await prisma.liveSession.updateMany({
      where: { id: req.params.id, teacherId: req.user.id },
      data: { active: false }
    });
    
    if (session.count === 0) return res.status(404).json({ success: false, message: 'Session not found.' });
    
    const updatedSession = await prisma.liveSession.findUnique({ where: { id: req.params.id } });
    res.status(200).json({ success: true, session: { ...updatedSession, _id: updatedSession.id } });
  } catch (error) {
    console.error('Stop session error:', error);
    res.status(500).json({ success: false, message: 'Failed to stop session.' });
  }
};

// @desc    Refresh session secret
// @route   POST /api/live-session/:id/refresh
// @access  Private/Teacher
exports.refreshSecret = async (req, res) => {
  try {
    const newSecret = generateSecret();
    const session = await prisma.liveSession.updateMany({
      where: { id: req.params.id, teacherId: req.user.id, active: true },
      data: { currentSecret: newSecret }
    });
    
    if (session.count === 0) return res.status(404).json({ success: false, message: 'Active session not found.' });
    
    res.status(200).json({ success: true, secret: newSecret });
  } catch (error) {
    console.error('Refresh secret error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh secret.' });
  }
};

// @desc    Student Check-in via QR
// @route   POST /api/live-session/checkin
// @access  Private/Student
exports.checkIn = async (req, res) => {
  try {
    const { sessionId, secret, latitude, longitude } = req.body;

    if (!sessionId || !secret || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid check-in data or missing location.' });
    }

    const session = await prisma.liveSession.findUnique({ where: { id: sessionId } });
    
    if (!session || !session.active) {
      return res.status(400).json({ success: false, message: 'This session is invalid or has ended.' });
    }

    if (session.currentSecret !== secret) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code. Please scan the latest one.' });
    }

    // Verify distance (Max 50 meters)
    const distance = getDistanceFromLatLonInMeters(
      session.latitude, session.longitude,
      latitude, longitude
    );

    if (distance > 50) {
      return res.status(400).json({ 
        success: false, 
        message: `You are too far from the classroom! (${Math.round(distance)}m away. Max allowed is 50m).` 
      });
    }

    // Check if already marked present today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: req.user.id,
        subject: session.subject,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already marked attendance for this subject today.' });
    }

    // Mark present
    const attendance = await prisma.attendance.create({
      data: {
        studentId: req.user.id,
        subject: session.subject,
        date: new Date(),
        status: 'Present',
        markedById: req.user.id, // Self marked
        department: req.user.department,
        class: session.class,
        section: req.user.section,
        semester: req.user.semester,
        latitude,
        longitude
      }
    });

    // Emit live update to teacher
    const io = req.app.get('io');
    if (io) {
      io.emit('statsUpdated', { message: `${req.user.fullName} just checked in!`, timestamp: new Date() });
    }

    res.status(200).json({ success: true, message: 'Check-in successful!', attendance: { ...attendance, _id: attendance.id } });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Failed to process check-in.' });
  }
};
