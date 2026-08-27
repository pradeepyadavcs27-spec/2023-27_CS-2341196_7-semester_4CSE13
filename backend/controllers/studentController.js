const { prisma } = require('../config/db');

// @desc    Get attendance records for logged-in student
// @route   GET /api/student/attendance
// @access  Private/Student
const getAttendance = async (req, res) => {
  try {
    const { subject, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = { studentId: req.user.id };

    if (subject) where.subject = subject;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const total = await prisma.attendance.count({ where });
    const records = await prisma.attendance.findMany({
      where,
      include: {
        markedBy: { select: { fullName: true } }
      },
      orderBy: { date: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const mappedRecords = records.map(r => ({
      ...r,
      _id: r.id,
      markedBy: r.markedBy
    }));

    res.status(200).json({
      success: true,
      records: mappedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance records.' });
  }
};

// @desc    Get attendance summary by subject for logged-in student
// @route   GET /api/student/attendance-summary
// @access  Private/Student
const getAttendanceSummary = async (req, res) => {
  try {
    const summaryQuery = await prisma.$queryRaw`
      SELECT subject, COUNT(*) as "totalClasses", 
             SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
      FROM "attendances"
      WHERE "studentId" = ${req.user.id}
      GROUP BY subject
      ORDER BY subject ASC
    `;

    const summary = summaryQuery.map(s => ({
      subject: s.subject,
      totalClasses: Number(s.totalClasses),
      present: Number(s.present),
      absent: Number(s.absent),
      percentage: Number(s.totalClasses) > 0 ? Number(((Number(s.present) / Number(s.totalClasses)) * 100).toFixed(1)) : 0
    }));

    const overallStatsQuery = await prisma.$queryRaw`
      SELECT COUNT(*) as "totalClasses", 
             SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
             SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
      FROM "attendances"
      WHERE "studentId" = ${req.user.id}
    `;

    const overall = overallStatsQuery.length > 0 ? {
      totalClasses: Number(overallStatsQuery[0].totalClasses),
      present: Number(overallStatsQuery[0].present),
      absent: Number(overallStatsQuery[0].absent)
    } : { totalClasses: 0, present: 0, absent: 0 };
    
    const overallPercentage = overall.totalClasses > 0 ? parseFloat(((overall.present / overall.totalClasses) * 100).toFixed(1)) : 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);

    const monthlyTrendQuery = await prisma.$queryRaw`
      SELECT TO_CHAR(date, 'YYYY-MM') as month, 
             COUNT(*) as "totalClasses",
             SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE "studentId" = ${req.user.id} AND date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyTrend = monthlyTrendQuery.map(stat => {
      const parts = stat.month.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;
      return {
        name: monthNames[monthIndex],
        value: Number(stat.totalClasses) > 0 ? parseFloat(((Number(stat.present) / Number(stat.totalClasses)) * 100).toFixed(1)) : 0
      };
    });

    res.status(200).json({
      success: true,
      summary,
      monthlyTrend,
      overall: {
        totalClasses: overall.totalClasses,
        present: overall.present,
        absent: overall.absent,
        percentage: overallPercentage,
      },
    });
  } catch (error) {
    console.error('Attendance summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance summary.' });
  }
};

// @desc    Get calendar data for a specific month
// @route   GET /api/student/calendar
// @access  Private/Student
const getCalendarData = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: {
        studentId: req.user.id,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, status: true, subject: true },
      orderBy: { date: 'asc' },
    });

    const calendarData = records.map(record => ({
      date: record.date.toISOString().split('T')[0],
      status: record.status,
      subject: record.subject,
    }));

    res.status(200).json({
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      data: calendarData,
    });
  } catch (error) {
    console.error('Calendar data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calendar data.' });
  }
};

// @desc    Mark attendance via QR code scan
// @route   POST /api/student/mark-qr-attendance
// @access  Private/Student
const markQrAttendance = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'QR Code is required' });

    const session = await prisma.attendanceSession.findUnique({ where: { code } });
    
    if (!session || !session.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or expired QR code session' });
    }

    if (new Date() > session.expiresAt) {
      await prisma.attendanceSession.update({ where: { id: session.id }, data: { isActive: false } });
      return res.status(400).json({ success: false, message: 'QR code session has expired' });
    }

    // Check if student belongs to the class/section of the session.
    if (req.user.class !== session.class || req.user.section !== session.section) {
      return res.status(403).json({ success: false, message: 'You do not belong to this class/section.' });
    }

    const attendanceDate = new Date(session.date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingRecord = await prisma.attendance.findUnique({
      where: {
        studentId_subject_date: {
          studentId: req.user.id,
          subject: session.subject,
          date: attendanceDate
        }
      }
    });

    if (existingRecord) {
      if (existingRecord.status === 'Present') {
        return res.status(200).json({ success: true, message: 'Attendance already marked' });
      } else {
        await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: { status: 'Present', markedById: session.teacherId }
        });
        return res.status(200).json({ success: true, message: 'Attendance updated to Present' });
      }
    }

    // Create new attendance record
    await prisma.attendance.create({
      data: {
        studentId: req.user.id,
        subject: session.subject,
        date: attendanceDate,
        status: 'Present',
        markedById: session.teacherId,
        department: session.department,
        class: session.class,
        section: session.section,
        semester: session.semester
      }
    });

    res.status(200).json({ success: true, message: 'Attendance marked successfully!' });
  } catch (error) {
    console.error('Mark QR attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
};

module.exports = {
  getAttendance,
  getAttendanceSummary,
  getCalendarData,
  markQrAttendance,
};
