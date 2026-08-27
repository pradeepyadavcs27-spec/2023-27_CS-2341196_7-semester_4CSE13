const { prisma } = require('../config/db');
const { sendLowAttendanceAlert } = require('../services/emailService');

// @desc    Mark attendance for multiple students
// @route   POST /api/teacher/mark-attendance
const markAttendance = async (req, res) => {
  try {
    const { subject, class: className, section, date, semester, department, records, latitude, longitude } = req.body;

    if (!subject || !date || !records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide subject, date, and attendance records.' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    let savedCount = 0;

    for (const record of records) {
      try {
        await prisma.attendance.upsert({
          where: {
            studentId_subject_date: {
              studentId: record.studentId,
              subject,
              date: attendanceDate
            }
          },
          update: {
            status: record.status,
            markedById: req.user.id,
            latitude: latitude || null,
            longitude: longitude || null
          },
          create: {
            studentId: record.studentId,
            subject,
            date: attendanceDate,
            status: record.status,
            markedById: req.user.id,
            department: department || null,
            class: className || null,
            section: section || null,
            semester: semester ? parseInt(semester) : null,
            latitude: latitude || null,
            longitude: longitude || null
          }
        });
        savedCount++;
      } catch (err) {
        console.error('Error upserting attendance:', err);
      }
    }

    // Check attendance for each student and send alerts if below 75%
    const alertPromises = records.map(async (record) => {
      try {
        const statsQuery = await prisma.$queryRaw`
          SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
          FROM "attendances"
          WHERE "studentId" = ${record.studentId}
        `;

        if (statsQuery.length > 0 && Number(statsQuery[0].total) > 0) {
          const percentage = (Number(statsQuery[0].present) / Number(statsQuery[0].total)) * 100;
          if (percentage < 75) {
            const student = await prisma.user.findUnique({ where: { id: record.studentId } });
            if (student) {
              await sendLowAttendanceAlert(student.email, student.fullName, percentage);
            }
          }
        }
      } catch (alertError) {
        console.error(`Alert check failed for student ${record.studentId}:`, alertError.message);
      }
    });

    Promise.all(alertPromises).catch((err) => console.error('Alert processing error:', err));

    const io = req.app.get('io');
    if (io) {
      io.emit('statsUpdated', { message: 'Attendance marked', timestamp: new Date() });
    }

    res.status(201).json({ success: true, message: `Attendance marked successfully. ${savedCount} records saved.`, savedCount });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark attendance.' });
  }
};

// @desc    Update attendance records
const updateAttendance = async (req, res) => {
  try {
    const { subject, class: className, date, records } = req.body;

    if (!subject || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Please provide subject, date, and records to update.' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    let updatedCount = 0;

    for (const record of records) {
      const result = await prisma.attendance.updateMany({
        where: {
          studentId: record.studentId,
          subject,
          date: { gte: attendanceDate, lt: nextDay }
        },
        data: { status: record.status }
      });
      if (result.count > 0) updatedCount += result.count;
    }

    res.status(200).json({ success: true, message: `Attendance updated. ${updatedCount} records modified.`, updatedCount });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to update attendance.' });
  }
};

// @desc    Get students list (filtered)
const getStudentsList = async (req, res) => {
  try {
    const { class: className, section, department } = req.query;

    const where = { role: 'student' };
    if (className) where.class = className;
    if (section) where.section = section;
    if (department) where.department = department;

    const students = await prisma.user.findMany({
      where,
      select: { id: true, fullName: true, rollNumber: true, email: true, department: true, semester: true, section: true, class: true },
      orderBy: [{ rollNumber: 'asc' }, { fullName: 'asc' }]
    });

    const mapped = students.map(s => ({ ...s, _id: s.id }));

    res.status(200).json({ success: true, count: mapped.length, students: mapped });
  } catch (error) {
    console.error('Get students list error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

// @desc    Get attendance report with filters
const getAttendanceReport = async (req, res) => {
  try {
    const { subject, class: className, department, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};
    if (subject) where.subject = subject;
    if (className) where.class = className;
    if (department) where.department = department;

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
        student: { select: { fullName: true, rollNumber: true, department: true, semester: true, section: true, class: true } },
        markedBy: { select: { fullName: true } }
      },
      orderBy: { date: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Compute per-student stats using raw SQL for efficiency
    let studentStatsQuery = `
      SELECT a."studentId", u."fullName", u."rollNumber", u."department",
             COUNT(a.id) as total,
             SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances" a
      JOIN "users" u ON a."studentId" = u.id
      WHERE 1=1
    `;
    
    // Add raw SQL filters securely (parameterized in a real app, simplified here since it's just an example)
    const queryArgs = [];
    if (subject) { studentStatsQuery += ` AND a.subject = $${queryArgs.length + 1}`; queryArgs.push(subject); }
    if (className) { studentStatsQuery += ` AND a.class = $${queryArgs.length + 1}`; queryArgs.push(className); }
    if (department) { studentStatsQuery += ` AND u.department = $${queryArgs.length + 1}`; queryArgs.push(department); }
    if (startDate) { studentStatsQuery += ` AND a.date >= $${queryArgs.length + 1}`; queryArgs.push(new Date(startDate)); }
    if (endDate) { 
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        studentStatsQuery += ` AND a.date <= $${queryArgs.length + 1}`; queryArgs.push(end);
    }
    
    studentStatsQuery += ` GROUP BY a."studentId", u."fullName", u."rollNumber", u."department" ORDER BY u."fullName" ASC`;
    
    const statsResult = await prisma.$queryRawUnsafe(studentStatsQuery, ...queryArgs);
    
    const studentStats = statsResult.map(s => ({
      studentId: s.studentId,
      fullName: s.fullName,
      rollNumber: s.rollNumber,
      department: s.department,
      total: Number(s.total),
      present: Number(s.present),
      absent: Number(s.total) - Number(s.present),
      percentage: Number(s.total) > 0 ? (Number(s.present) / Number(s.total)) * 100 : 0
    }));

    res.status(200).json({
      success: true,
      records: records.map(r => ({ ...r, _id: r.id, studentId: r.student, markedBy: r.markedBy })),
      studentStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance report.' });
  }
};

// @desc    Get teacher's summary stats
const getSummary = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const totalRecords = await prisma.attendance.count({ where: { markedById: teacherId } });
    
    // Total Unique Students
    const uniqueStudentsResult = await prisma.$queryRaw`SELECT COUNT(DISTINCT "studentId") as count FROM "attendances" WHERE "markedById" = ${teacherId}`;
    const totalStudents = Number(uniqueStudentsResult[0].count);

    // Average Attendance
    const presentCount = await prisma.attendance.count({ where: { markedById: teacherId, status: 'Present' } });
    const avgAttendance = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;

    // Subject Performance
    const perfResult = await prisma.$queryRaw`
      SELECT subject, class, COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE "markedById" = ${teacherId}
      GROUP BY subject, class
      ORDER BY subject ASC
    `;
    const subjectPerformance = perfResult.map(p => ({
      name: `${p.subject} (${p.class})`,
      value: Number(p.total) > 0 ? Number(((Number(p.present) / Number(p.total)) * 100).toFixed(1)) : 0
    }));

    const subjectsQuery = await prisma.$queryRaw`SELECT DISTINCT subject FROM "attendances" WHERE "markedById" = ${teacherId}`;
    const classesQuery = await prisma.$queryRaw`SELECT DISTINCT class FROM "attendances" WHERE "markedById" = ${teacherId}`;
    
    const subjects = subjectsQuery.map(s => s.subject);
    const classes = classesQuery.map(c => c.class).filter(Boolean);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCount = await prisma.attendance.count({
      where: { markedById: teacherId, date: { gte: today, lt: tomorrow } }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentResult = await prisma.$queryRaw`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') as date, COUNT(*) as count, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE "markedById" = ${teacherId} AND date >= ${sevenDaysAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;
    
    const recentActivity = recentResult.map(r => ({
      date: r.date,
      count: Number(r.count),
      present: Number(r.present),
      percentage: Number(r.count) > 0 ? Number(((Number(r.present) / Number(r.count)) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({
      success: true,
      data: { totalRecords, totalStudents, avgAttendance, subjectPerformance, subjects, classes, todayCount, recentActivity }
    });
  } catch (error) {
    console.error('Teacher summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary.' });
  }
};

const generateQrSession = async (req, res) => {
  try {
    const { subject, department, class: className, section, semester, date, expiresInMinutes = 10 } = req.body;

    if (!subject || !className || !section || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await prisma.attendanceSession.updateMany({
      where: { teacherId: req.user.id, isActive: true },
      data: { isActive: false }
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expiresInMinutes));

    const session = await prisma.attendanceSession.create({
      data: {
        teacherId: req.user.id,
        subject,
        department,
        class: className,
        section,
        semester: semester ? parseInt(semester) : null,
        date: new Date(date),
        expiresAt,
        code: require('crypto').randomBytes(16).toString('hex') // In MongoDB it was handled by pre-save hook, but Prisma needs explicit generation or custom extension
      }
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error('Generate QR session error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate QR session.' });
  }
};

const getQrSessionStatus = async (req, res) => {
  try {
    const { code } = req.params;
    let session = await prisma.attendanceSession.findUnique({ where: { code } });
    
    if (!session || session.teacherId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.isActive && new Date() > session.expiresAt) {
      session = await prisma.attendanceSession.update({
        where: { id: session.id },
        data: { isActive: false }
      });
    }

    const attendanceDate = new Date(session.date);
    attendanceDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const presentCount = await prisma.attendance.count({
      where: {
        markedById: req.user.id,
        subject: session.subject,
        class: session.class,
        section: session.section,
        date: { gte: attendanceDate, lt: nextDay },
        status: 'Present'
      }
    });

    res.status(200).json({ success: true, isActive: session.isActive, expiresAt: session.expiresAt, presentCount });
  } catch (error) {
    console.error('Get QR session status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get session status' });
  }
};

const closeQrSession = async (req, res) => {
  try {
    const { code } = req.params;
    const session = await prisma.attendanceSession.updateMany({
      where: { code, teacherId: req.user.id },
      data: { isActive: false }
    });

    if (session.count === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.status(200).json({ success: true, message: 'Session closed successfully' });
  } catch (error) {
    console.error('Close QR session error:', error);
    res.status(500).json({ success: false, message: 'Failed to close session' });
  }
};

module.exports = {
  markAttendance, updateAttendance, getStudentsList, getAttendanceReport, getSummary, generateQrSession, getQrSessionStatus, closeQrSession
};
