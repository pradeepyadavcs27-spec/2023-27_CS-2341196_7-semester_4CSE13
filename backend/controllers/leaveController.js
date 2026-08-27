const { prisma } = require('../config/db');

// @desc    Apply for leave (Student)
// @route   POST /api/leave
// @access  Private/Student
const applyLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, documentUrl } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason.' });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        documentUrl: documentUrl || null,
        status: 'Pending'
      }
    });

    res.status(201).json({ success: true, data: { ...leaveRequest, _id: leaveRequest.id } });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply for leave.' });
  }
};

// @desc    Get student's leave requests
// @route   GET /api/leave/my
// @access  Private/Student
const getMyLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests.map(l => ({ ...l, _id: l.id })),
    });
  } catch (error) {
    console.error('Get my leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests.' });
  }
};

// @desc    Get all leave requests (Admin/Teacher)
// @route   GET /api/leave
// @access  Private/Admin,Teacher
const getAllLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    if (req.user.role === 'teacher') {
      const studentWhere = { role: 'student' };
      if (req.user.department) {
        studentWhere.department = req.user.department;
      }
      
      const students = await prisma.user.findMany({
        where: studentWhere,
        select: { id: true }
      });
      
      const studentIds = students.map(s => s.id);
      where.userId = { in: studentIds };
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: { select: { fullName: true, rollNumber: true, department: true, class: true, section: true, role: true } },
        reviewedBy: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests.map(l => ({ ...l, _id: l.id, userId: l.user, reviewedBy: l.reviewedBy })),
    });
  } catch (error) {
    console.error('Get all leave error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests.' });
  }
};

// @desc    Update leave status (Approve/Reject)
// @route   PUT /api/leave/:id
// @access  Private/Admin,Teacher
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be Approved or Rejected.' });
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewedById: req.user.id,
        reviewDate: new Date()
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('leaveUpdated', { message: `Leave request ${status}`, leaveId: leaveRequest.id, timestamp: new Date() });
    }

    res.status(200).json({ success: true, data: { ...leaveRequest, _id: leaveRequest.id } });
  } catch (error) {
    console.error('Update leave status error:', error);
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update leave status.' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus,
};
